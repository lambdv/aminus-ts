import { res_multiplier } from "../multipliers.js";
import { transformativeBaseDamage } from "../formulas.js";
import type { StatTable, Element } from "../stat.js";
import type {
  CritMode, DirectReactionInput, IndirectComponent, IndirectReactionInput,
  ReactionContributor, ReactionModifiers, SpecialReaction,
} from "./types.js";

/** Wiki Damage § Lunar and Stellar Glimmer Reaction Damage: 6 EM / (EM + 2000). */
export function specialReactionEmBonus(em: number): number {
  if (!Number.isFinite(em) || em < 0) throw new Error("EM must be finite and nonnegative");
  return 6 * em / (em + 2000);
}

/** A Polestar Field's sampled qualifying applications, excluding its creating hit. */
export function stellarConductCoefficient(recordedHits: number): number {
  if (!Number.isInteger(recordedHits) || recordedHits < 0 || recordedHits > 12)
    throw new Error("recordedFieldHits must be an integer from 0 to 12");
  return recordedHits === 0 ? 1 : 1.4 + 0.05 * recordedHits;
}

export function polestarElementalBonus(recordedHits: number): number {
  stellarConductCoefficient(recordedHits);
  return recordedHits === 0 ? 0.2 : 0.28 + 0.01 * recordedHits;
}

const indirect: Record<IndirectComponent, {
  reaction: IndirectReactionInput["reaction"]; element: Element; coefficient: number;
}> = {
  thundercloud: { reaction: "Lunar-Charged", element: "Electro", coefficient: 3 },
  moondriftHarmony: { reaction: "Lunar-Crystallize", element: "Geo", coefficient: 1.6 },
  swirlInitial: { reaction: "Stellar Swirl", element: "Anemo", coefficient: 0.75 },
  vortexLevel1: { reaction: "Stellar Swirl", element: "Cryo", coefficient: 2 },
  vortexLevel2: { reaction: "Stellar Swirl", element: "Cryo", coefficient: 3 },
};

const directCoefficient: Record<Exclude<SpecialReaction, "Stellar-Conduct">, number> = {
  "Lunar-Charged": 3, "Lunar-Bloom": 1, "Lunar-Crystallize": 1.6,
  "Stellar Swirl": 1,
};

const resStat: Partial<Record<Element, Parameters<StatTable["get"]>[0]>> = {
  Electro: "ElectroResistanceReduction", Geo: "GeoResistanceReduction",
  Anemo: "AnemoResistanceReduction", Cryo: "CryoResistanceReduction",
  Hydro: "HydroResistanceReduction", Dendro: "DendroResistanceReduction",
};

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function factors(stats: StatTable, element: Element, modifiers: ReactionModifiers = {},
  resistance = 0.1) {
  const em = stats.get("ElementalMastery") + (modifiers.elementalMasteryBonus ?? 0);
  const emMultiplier = 1 + specialReactionEmBonus(em) + stats.get("ReactionBonus")
    + (modifiers.reactionBonus ?? 0);
  const baseMultiplier = 1 + finite(modifiers.baseDamageBonus ?? 0, "baseDamageBonus");
  const elevationMultiplier = 1 + finite(modifiers.elevation ?? 0, "elevation");
  const resistanceMultiplier = res_multiplier(finite(resistance, "enemyResistance"),
    (resStat[element] ? stats.get(resStat[element]!) : 0)
      + finite(modifiers.resistanceReduction ?? 0, "resistanceReduction"));
  const critRate = Math.max(0, Math.min(1, finite(stats.get("CritRate")
    + (modifiers.critRateBonus ?? 0), "critRate")));
  const critDamage = finite(stats.get("CritDMG") + (modifiers.critDamageBonus ?? 0), "critDamage");
  return { emMultiplier, baseMultiplier, elevationMultiplier, resistanceMultiplier,
    critRate, critDamage };
}

export interface DirectReactionBreakdown {
  coefficient: number;
  baseDamage: number;
  emMultiplier: number;
  baseMultiplier: number;
  additiveBaseDamage: number;
  elevationMultiplier: number;
  resistanceMultiplier: number;
  critMultiplier: number;
  total: number;
}

/** Direct talent reaction damage has no ordinary DMG Bonus or DEF multiplier. */
export function directReactionBreakdown(input: DirectReactionInput): DirectReactionBreakdown {
  const coefficient = input.reaction === "Stellar-Conduct"
    ? stellarConductCoefficient(input.recordedFieldHits ?? 0)
    : directCoefficient[input.reaction];
  if (input.reaction !== "Stellar-Conduct" && input.recordedFieldHits !== undefined)
    throw new Error("recordedFieldHits only applies to Stellar-Conduct");
  if (input.element === "None" || input.element === "Physical")
    throw new Error("direct reaction damage requires an elemental damage type");
  const { emMultiplier, baseMultiplier, elevationMultiplier, resistanceMultiplier,
    critRate, critDamage } = factors(input.stats, input.element, input.modifiers,
      input.enemyResistance);
  const baseDamage = coefficient * finite(input.abilityMultiplier, "abilityMultiplier")
    * finite(input.scalingValue, "scalingValue")
    * finite(input.baseDamageMultiplier ?? 1, "baseDamageMultiplier");
  const additiveBaseDamage = finite(input.additiveBaseDamage ?? 0, "additiveBaseDamage");
  const critMultiplier = input.crit === "none" ? 1 : input.crit === "crit"
    ? 1 + critDamage : 1 + critRate * critDamage;
  return { coefficient, baseDamage, emMultiplier, baseMultiplier, additiveBaseDamage,
    elevationMultiplier, resistanceMultiplier, critMultiplier,
    total: (baseDamage * baseMultiplier * emMultiplier + additiveBaseDamage)
      * elevationMultiplier * resistanceMultiplier * critMultiplier };
}

export interface ContributorBreakdown {
  id: string;
  nonCrit: number;
  crit: number;
  critRate: number;
  /** Weighted contribution in the chosen CRIT mode, not necessarily its expected share. */
  weightedDamage: number;
}

export interface IndirectReactionBreakdown {
  element: Element;
  coefficient: number;
  contributors: ContributorBreakdown[];
  total: number;
}

const weights = [0.6, 0.3, 0.05, 0.05];

function ranked(values: readonly { id: string; damage: number }[]): { total: number; shares: Map<string, number> } {
  const ordered = [...values].sort((a, b) => b.damage - a.damage || a.id.localeCompare(b.id));
  const shares = new Map<string, number>();
  let total = 0;
  ordered.forEach(({ id, damage }, i) => {
    const weighted = damage * weights[i];
    shares.set(id, weighted);
    total += weighted;
  });
  return { total, shares };
}

/** Exact expected damage enumerates each contributor's CRIT outcome before ranking. */
export function indirectReactionBreakdown(input: IndirectReactionInput): IndirectReactionBreakdown {
  const component = indirect[input.component];
  if (!component || component.reaction !== input.reaction)
    throw new Error("component does not belong to this reaction");
  if (input.contributors.length < 1 || input.contributors.length > 4)
    throw new Error("indirect reactions require 1 to 4 contributors");
  const ids = new Set<string>();
  const rows = input.contributors.map(({ id, level, stats, modifiers }: ReactionContributor) => {
    if (!id || ids.has(id)) throw new Error("contributor IDs must be unique and nonempty");
    ids.add(id);
    const f = factors(stats, component.element, modifiers, input.enemyResistance);
    const nonCrit = component.coefficient * transformativeBaseDamage(level)
      * f.baseMultiplier * f.emMultiplier * f.elevationMultiplier * f.resistanceMultiplier;
    return { id, nonCrit, crit: nonCrit * (1 + f.critDamage), critRate: f.critRate,
      weightedDamage: 0 };
  });
  const mode: CritMode = input.crit ?? "expected";
  let total = 0;
  const outcomes = mode === "expected" ? 1 << rows.length : 1;
  for (let mask = 0; mask < outcomes; mask++) {
    let probability = 1;
    const values = rows.map((row, i) => {
      const isCrit = mode === "crit" || (mode === "expected" && !!(mask & (1 << i)));
      if (mode === "expected") probability *= isCrit ? row.critRate : 1 - row.critRate;
      return { id: row.id, damage: isCrit ? row.crit : row.nonCrit };
    });
    if (probability === 0) continue;
    const result = ranked(values);
    total += probability * result.total;
    rows.forEach(row => { row.weightedDamage += probability * result.shares.get(row.id)!; });
  }
  return { element: component.element, coefficient: component.coefficient, contributors: rows, total };
}

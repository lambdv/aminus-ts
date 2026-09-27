import { avg_crit_multiplier, def_multiplier, res_multiplier, amplifier_multiplier } from "./multipliers.js";
import { REACTION_LEVEL_MULTIPLIERS } from "../data/reaction-levels.js";
import { BaseScaling, DamageCompute, DamageType, Element, StatTable, StatType } from "./stat.js";

/** Percentages are fractions: 0.1 means 10%. */
export interface DamageContext {
  characterLevel?: number;
  enemyLevel?: number;
  enemyResistance?: Partial<Record<Element, number>>;
}

export interface HitModifiers {
  percentScalingBonus?: number;
  flatScalingBonus?: number;
  elementalMasteryBonus?: number;
  critRateBonus?: number;
  critDamageBonus?: number;
  damageBonus?: number;
  /** Target-side damage reduction, subtracted from the damage-bonus factor. */
  damageReduction?: number;
  /** Positive fractions reduce resistance. */
  resistanceReduction?: number;
  /** Positive fractions reduce defense or ignore it, respectively. */
  defenseReduction?: number;
  defenseIgnore?: number;
}

export interface CharacterDamageOptions extends DamageContext, HitModifiers {
  element: Element;
  damageType: DamageType;
  scaling?: BaseScaling;
  motionValue?: number;
  /** Flat base damage, added after the talent base multiplier. */
  additiveDamage?: number;
  /** Multiplies talent damage only, before additive base damage. */
  baseDamageMultiplier?: number;
  instances?: number;
  buffs?: StatTable;
}

const elementStat: Partial<Record<Element, StatType>> = {
  Physical: "PhysicalDMGBonus", Pyro: "PyroDMGBonus", Hydro: "HydroDMGBonus",
  Electro: "ElectroDMGBonus", Cryo: "CryoDMGBonus", Dendro: "DendroDMGBonus",
  Anemo: "AnemoDMGBonus", Geo: "GeoDMGBonus",
};
const resistanceStat: Partial<Record<Element, StatType>> = {
  Physical: "PhysicalResistanceReduction", Pyro: "PyroResistanceReduction",
  Hydro: "HydroResistanceReduction", Electro: "ElectroResistanceReduction",
  Cryo: "CryoResistanceReduction", Dendro: "DendroResistanceReduction",
  Anemo: "AnemoResistanceReduction", Geo: "GeoResistanceReduction",
};
const attackStat: Partial<Record<DamageType, StatType>> = {
  Normal: "NormalATKDMGBonus", Charged: "ChargeATKDMGBonus",
  Plunging: "PlungeATKDMGBonus", Skill: "SkillDMGBonus", Burst: "BurstDMGBonus",
};

function withBuffs(stats: StatTable, buffs?: StatTable): StatTable {
  return buffs ? stats.merge(buffs) : stats.clone();
}

export function scalingValue(stats: StatTable, scaling: BaseScaling, modifiers: HitModifiers = {}): number {
  if (scaling === "BaseATK") return stats.get("BaseATK");
  if (scaling === "EM") return stats.get("ElementalMastery") + (modifiers.elementalMasteryBonus ?? 0);
  const [base, percent, flat] = scaling === "HP"
    ? ["BaseHP", "HPPercent", "FlatHP"] as const
    : scaling === "DEF"
      ? ["BaseDEF", "DEFPercent", "FlatDEF"] as const
      : ["BaseATK", "ATKPercent", "FlatATK"] as const;
  return stats.get(base) * (1 + stats.get(percent) + (modifiers.percentScalingBonus ?? 0))
    + stats.get(flat) + (modifiers.flatScalingBonus ?? 0);
}

function critFactor(stats: StatTable, modifiers: HitModifiers = {}): number {
  const adjusted = stats.clone();
  adjusted.add("CritRate", modifiers.critRateBonus ?? 0);
  adjusted.add("CritDMG", modifiers.critDamageBonus ?? 0);
  return avg_crit_multiplier(adjusted);
}

function damageBonus(stats: StatTable, element: Element, damageType: DamageType, extra = 0): number {
  return stats.get("DMGBonus")
    + (element !== "Physical" && element !== "None" ? stats.get("ElementalDMGBonus") : 0)
    + (elementStat[element] ? stats.get(elementStat[element]!) : 0)
    + (attackStat[damageType] ? stats.get(attackStat[damageType]!) : 0)
    + extra;
}

function defenseFactor(stats: StatTable, options: DamageContext & HitModifiers): number {
  return def_multiplier(
    options.characterLevel ?? 90,
    options.enemyLevel ?? 100,
    stats.get("DefReduction") + (options.defenseReduction ?? 0),
    stats.get("DefIgnore") + (options.defenseIgnore ?? 0),
  );
}

function resistanceFactor(
  stats: StatTable,
  element: Element,
  options: DamageContext & HitModifiers,
): number {
  const base = options.enemyResistance?.[element] ?? 0.1;
  const reduction = resistanceStat[element] ? stats.get(resistanceStat[element]!) : 0;
  return res_multiplier(base, reduction + (options.resistanceReduction ?? 0));
}

function validateInstances(instances: number): void {
  if (!Number.isFinite(instances) || instances < 0)
    throw new Error("instances must be nonnegative and finite");
}

export interface CharacterDamageBreakdown {
  scalingValue: number;
  baseDamage: number;
  critMultiplier: number;
  damageMultiplier: number;
  resistanceMultiplier: number;
  defenseMultiplier: number;
  instances: number;
  total: number;
}

/** Every factor of a direct hit, suitable for numerical regression assertions. */
export function characterDamageBreakdown(options: CharacterDamageOptions,
  character: StatTable): CharacterDamageBreakdown {
  const instances = options.instances ?? 1;
  validateInstances(instances);
  const motionValue = options.motionValue ?? 0;
  for (const value of [motionValue, options.additiveDamage ?? 0, options.baseDamageMultiplier ?? 1])
    if (!Number.isFinite(value)) throw new Error("Base damage inputs must be finite");
  const stats = withBuffs(character, options.buffs);
  const scaling = scalingValue(stats, options.scaling ?? "ATK", options);
  const baseDamage = motionValue * scaling * (options.baseDamageMultiplier ?? 1)
    + (options.additiveDamage ?? 0);
  const critMultiplier = critFactor(stats, options);
  const damageMultiplier = 1 + damageBonus(stats, options.element, options.damageType, options.damageBonus)
    - (options.damageReduction ?? 0);
  const resistanceMultiplier = resistanceFactor(stats, options.element, options);
  const defenseMultiplier = defenseFactor(stats, options);
  return {
    scalingValue: scaling, baseDamage, critMultiplier, damageMultiplier,
    resistanceMultiplier, defenseMultiplier, instances,
    total: baseDamage * critMultiplier * damageMultiplier * resistanceMultiplier
      * defenseMultiplier * instances,
  };
}

/** A direct hit; omitted motionValue permits pure additive damage. */
export function character_damage(options: CharacterDamageOptions): DamageCompute {
  return (stats) => characterDamageBreakdown(options, stats).total;
}

export { avg_crit_multiplier, def_multiplier, res_multiplier, amplifier_multiplier } from "./multipliers.js";
export const total_attack = (stats: StatTable): number => scalingValue(stats, "ATK");
export const total_defense = (stats: StatTable): number => scalingValue(stats, "DEF");
export const total_health = (stats: StatTable): number => scalingValue(stats, "HP");

export function transformativeBaseDamage(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > 100)
    throw new Error("character level must be an integer from 1 to 100");
  return REACTION_LEVEL_MULTIPLIERS[level - 1];
}

interface ReactionScaling {
  characterLevel?: number;
  elementalMasteryBonus?: number;
  reactionBonus?: number;
}

/** Raw additive base damage: feed this into a hit, or compose with Swirl. */
export function additiveReactionBase(kind: "Aggravate" | "Spread", stats: StatTable,
  options: ReactionScaling = {}): number {
  const em = stats.get("ElementalMastery") + (options.elementalMasteryBonus ?? 0);
  return (kind === "Aggravate" ? 1.15 : 1.25)
    * transformativeBaseDamage(options.characterLevel ?? 90)
    * (1 + 5 * em / (em + 1200) + stats.get("ReactionBonus") + (options.reactionBonus ?? 0));
}

// KQM TCL transformative reactions, verified 2026-09-27. EC is per tick.
const transformativeFactor = {
  Burning: 0.25, Superconduct: 1.5, Swirl: 0.6, "Electro-Charged": 2,
  Shattered: 3, Overloaded: 2.75, Bloom: 2, Burgeon: 3, Hyperbloom: 3,
} as const;
export type TransformativeReaction = keyof typeof transformativeFactor;

export interface TransformativeOptions extends Pick<DamageContext, "enemyResistance">, ReactionScaling {
  kind: TransformativeReaction;
  element: Element;
  resistanceReduction?: number;
  instances?: number;
  buffs?: StatTable;
}

/** Transformative damage ignores ordinary damage bonus, crit, and defense. */
export function reaction_damage(options: TransformativeOptions): DamageCompute {
  if (!Object.prototype.hasOwnProperty.call(transformativeFactor, options.kind))
    throw new Error(`Unknown transformative reaction: ${options.kind}`);
  validateInstances(options.instances ?? 1);
  const levelBase = transformativeBaseDamage(options.characterLevel ?? 90);
  return (character) => {
    const stats = withBuffs(character, options.buffs);
    const em = stats.get("ElementalMastery") + (options.elementalMasteryBonus ?? 0);
    return transformativeFactor[options.kind] * levelBase
      * (1 + 16 * em / (em + 2000) + stats.get("ReactionBonus") + (options.reactionBonus ?? 0))
      * resistanceFactor(stats, options.element, options) * (options.instances ?? 1);
  };
}

/** Wrap any calculated damage; only the amplified fraction receives this multiplier. */
export function amplify(baseDamage: DamageCompute, factor: 1.5 | 2,
  options: { uptime?: number; elementalMasteryBonus?: number; reactionBonus?: number } = {}): DamageCompute {
  const uptime = options.uptime ?? 1;
  if (!Number.isFinite(uptime) || uptime < 0 || uptime > 1)
    throw new Error("uptime must be finite and between 0 and 1");
  return (stats) => baseDamage(stats) * (1 - uptime + uptime * amplifier_multiplier(factor,
    stats.get("ElementalMastery") + (options.elementalMasteryBonus ?? 0),
    stats.get("ReactionBonus") + (options.reactionBonus ?? 0)));
}

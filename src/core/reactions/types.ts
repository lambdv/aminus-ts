import type { Element, StatTable } from "../stat.js";

export type LunarReaction = "Lunar-Charged" | "Lunar-Bloom" | "Lunar-Crystallize";
export type StellarReaction = "Stellar-Conduct" | "Stellar Swirl";
export type SpecialReaction = LunarReaction | StellarReaction;
export type IndirectComponent = "thundercloud" | "moondriftHarmony" | "swirlInitial" | "vortexLevel1" | "vortexLevel2";
export type CritMode = "none" | "crit" | "expected";

/** All percentages are fractions. These modifiers are scoped to this reaction damage, not ordinary hits. */
export interface ReactionModifiers {
  /** Moonsign Benediction or Stellar Jubilee bonus; multiplied before EM. */
  baseDamageBonus?: number;
  /** Reaction DMG Bonus, additive with the reaction's EM factor. */
  reactionBonus?: number;
  /** Separate special DMG boost: 0.25 means a 1.25x Elevation multiplier. */
  elevation?: number;
  elementalMasteryBonus?: number;
  critRateBonus?: number;
  critDamageBonus?: number;
  resistanceReduction?: number;
}

export interface ReactionContributor {
  id: string;
  /** The character's level, not the triggering character or a shared party level. */
  level: number;
  stats: StatTable;
  modifiers?: ReactionModifiers;
}

export interface IndirectReactionInput {
  reaction: "Lunar-Charged" | "Lunar-Crystallize" | "Stellar Swirl";
  component: IndirectComponent;
  contributors: readonly ReactionContributor[];
  crit?: CritMode;
  enemyResistance?: number;
}

export interface DirectReactionInput {
  reaction: SpecialReaction;
  element: Element;
  /** Talent coefficient as a fraction, e.g. 1.5 for 150%. */
  abilityMultiplier: number;
  /** Already calculated ATK, DEF, HP or EM of the attacker. */
  scalingValue: number;
  /** Talent-specific base multiplier; not the reaction coefficient. */
  baseDamageMultiplier?: number;
  /** Added after the EM/reaction bonus and before Elevation and RES. */
  additiveBaseDamage?: number;
  /** Required for Stellar-Conduct: count of qualifying field hits (0–12). */
  recordedFieldHits?: number;
  stats: StatTable;
  modifiers?: ReactionModifiers;
  crit?: CritMode;
  enemyResistance?: number;
}

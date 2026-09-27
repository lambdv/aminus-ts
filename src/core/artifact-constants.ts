import { StatType, StatTable } from "./stat.js";
import type { ArtifactRollQuality } from "./artifacts.js";
import { MAIN_STAT_VALUES } from "../data/main-affix.js";
import { SUBSTAT_ROLL_TIERS } from "../data/substats.js";

export type ArtifactType =
  | "flower"
  | "feather"
  | "sands"
  | "goblet"
  | "circlet";

export type Artifact = {
  type: ArtifactType;
  main_stat: StatType;
  level: number;
  rarity: number;
  substats?: StatTable;
};

// Constants for possible main stats
export const POSSIBLE_SANDS_STATS: StatType[] = [
  "HPPercent",
  "ATKPercent",
  "DEFPercent",
  "ElementalMastery",
  "EnergyRecharge",
];

export const POSSIBLE_GOBLET_STATS: StatType[] = [
  "HPPercent",
  "ATKPercent",
  "DEFPercent",
  "ElementalMastery",
  "PyroDMGBonus",
  "CryoDMGBonus",
  "GeoDMGBonus",
  "DendroDMGBonus",
  "ElectroDMGBonus",
  "HydroDMGBonus",
  "AnemoDMGBonus",
  "PhysicalDMGBonus",
];

export const POSSIBLE_CIRCLE_STATS: StatType[] = [
  "HPPercent",
  "ATKPercent",
  "DEFPercent",
  "ElementalMastery",
  "CritRate",
  "CritDMG",
  "HealingBonus",
];

export const POSSIBLE_SUB_STATS: StatType[] = [
  "HPPercent",
  "FlatHP",
  "ATKPercent",
  "FlatATK",
  "DEFPercent",
  "FlatDEF",
  "ElementalMastery",
  "CritRate",
  "CritDMG",
  "EnergyRecharge",
];

// DamageTemplate's KQMS scalars (the already averaged value of a 5-star roll).
export const KQMC_SUBSTAT_VALUES: Partial<Record<StatType, number>> = {
  HPPercent: 0.0496,
  FlatHP: 253.94,
  ATKPercent: 0.0496,
  FlatATK: 16.54,
  DEFPercent: 0.062,
  FlatDEF: 19.68,
  ElementalMastery: 19.82,
  EnergyRecharge: 0.0551,
  CritRate: 0.0331,
  CritDMG: 0.0662,
};

// ArtifactPiece is now unified with Artifact

/** returns multiplier for a given roll quality */
export function rollQualityMultiplier(quality: ArtifactRollQuality): number {
  switch (quality) {
    case "MAX":
      return 1.0;
    case "HIGH":
      return 0.9;
    case "MID":
      return 0.8;
    case "LOW":
      return 0.7;
    case "AVG":
      return (1.0 + 0.9 + 0.8 + 0.7) / 4.0;
    default:
      return 1.0;
  }
}

/** returns max number of rolls for a given artifact piece */
export function maxRollsFor(artifact: Artifact): number {
  const baseSubstats = artifact.rarity - 1;
  const upgrades = Math.floor(artifact.level / 4);
  return baseSubstats + upgrades;
}

/** returns max number of rolls for a given artifact piece and substat type */
export function maxRollsForGiven(
  artifact: Artifact,
  substatType: StatType,
  worseCase: boolean = false,
): number {
  if (artifact.main_stat === substatType) return 0;
  const upgrades = Math.floor(artifact.level / 4);
  return worseCase ? upgrades : upgrades + 1;
}

export function isValidSubstatType(statType: StatType): boolean {
  return POSSIBLE_SUB_STATS.includes(statType);
}

export const validate_artifact_pieces = (
  flower?: Artifact,
  feather?: Artifact,
  sands?: Artifact,
  goblet?: Artifact,
  circlet?: Artifact,
) => {
  if (flower && flower.main_stat !== "FlatHP")
    throw new Error("Flower must have FlatHP main stat");
  if (feather && feather.main_stat !== "FlatATK")
    throw new Error("Feather must have FlatATK main stat");
  if (sands && !POSSIBLE_SANDS_STATS.includes(sands.main_stat))
    throw new Error("Invalid sands main stat");
  if (goblet && !POSSIBLE_GOBLET_STATS.includes(goblet.main_stat))
    throw new Error("Invalid goblet main stat");
  if (circlet && !POSSIBLE_CIRCLE_STATS.includes(circlet.main_stat))
    throw new Error("Invalid circlet main stat");
};

// Function to get main stat value for 5-star level 20 artifacts
export function getMainStatValue(stat: StatType, rarity = 5, level = 20): number {
  const rarityTable = MAIN_STAT_VALUES[rarity];
  if (!rarityTable) return 0;
  const levelTable = rarityTable[level];
  if (!levelTable) return 0;
  return levelTable[stat] || 0;
}

export function getSubStatTierValue(
  rarity: number,
  stat: StatType,
  quality: ArtifactRollQuality,
): number {
  const tiers = SUBSTAT_ROLL_TIERS[rarity]?.[stat];
  if (!tiers) return 0;
  if (quality === "AVG") return getSubStatValue(rarity, stat);
  const index = { MAX: 0, HIGH: 1, MID: 2, LOW: 3 }[quality];
  return tiers[index];
}

export function getSubStatValue(rarity: number, stat: StatType): number {
  const rarityTiers = SUBSTAT_ROLL_TIERS[rarity];
  if (!rarityTiers) return 0;
  const statTiers = rarityTiers[stat];
  if (!statTiers) return 0;
  const sum = statTiers.reduce((a, b) => a + b, 0);
  return sum / statTiers.length;
}

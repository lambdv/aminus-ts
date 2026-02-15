import { StatType, StatTable } from "./stat";
import { ArtifactRollQuality } from "./artifacts";
import { MAIN_STAT_VALUES } from "../data/main-affix";
import { SUBSTAT_ROLL_TIERS } from "../data/substats";

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
export function getMainStatValue(stat: StatType): number {
  const rarityTable = MAIN_STAT_VALUES[5];
  if (!rarityTable) return 0;
  const levelTable = rarityTable[20];
  if (!levelTable) return 0;
  return levelTable[stat] || 0;
}

export function getSubStatValue(rarity: number, stat: StatType): number {
  const rarityTiers = SUBSTAT_ROLL_TIERS[rarity];
  if (!rarityTiers) return 0;
  const statTiers = rarityTiers[stat];
  if (!statTiers) return 0;
  const sum = statTiers.reduce((a, b) => a + b, 0);
  return sum / statTiers.length;
}

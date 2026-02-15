import { StatType, StatTable, Rotation } from "./stat";

// Constants for possible main stats
const POSSIBLE_SANDS_STATS: StatType[] = [
  "HPPercent",
  "ATKPercent",
  "DEFPercent",
  "ElementalMastery",
  "EnergyRecharge",
];

const POSSIBLE_GOBLET_STATS: StatType[] = [
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

const POSSIBLE_CIRCLE_STATS: StatType[] = [
  "HPPercent",
  "ATKPercent",
  "DEFPercent",
  "ElementalMastery",
  "CritRate",
  "CritDMG",
  "HealingBonus",
];

// Computes gradients of stats based on slopes
function statGradients(
  base: StatTable,
  target: Rotation,
  slopes: Map<StatType, number>,
): Map<StatType, number> {
  const gradients = new Map<StatType, number>();
  for (const [stat, delta] of slopes) {
    const direction = new StatTable([stat, delta]);
    const adjusted = base.clone();
    for (const [s, v] of direction) {
      adjusted.add(s, v);
    }
    const before = target.execute(base);
    const after = target.execute(adjusted);
    const gradient = (after - before) / delta;
    gradients.set(stat, gradient);
  }
  return gradients;
}

// Finds stats that increase target value based on gradients
function reluHeuristic(
  base: StatTable,
  target: Rotation,
  slopes: Map<StatType, number>,
): Set<StatType> {
  const gradients = statGradients(base, target, slopes);
  const effectiveSet = new Set<StatType>();
  for (const [stat, gradient] of gradients) {
    if (gradient > 0) {
      effectiveSet.add(stat);
    }
  }
  return effectiveSet;
}

// Finds best artifact main stat combo for given stats and rotation
function globalKqmcArtifactMainStatOptimizer(
  stats: StatTable,
  target: Rotation,
  getMainStatValue: (stat: StatType) => number,
): [StatType, StatType, StatType] {
  const sandsStats = new Set(POSSIBLE_SANDS_STATS);
  const gobletStats = new Set(POSSIBLE_GOBLET_STATS);
  const circletStats = new Set(POSSIBLE_CIRCLE_STATS);
  const pool = new Set([...sandsStats, ...gobletStats, ...circletStats]);

  // Heuristic: check which stats actually increase target value
  const slopes = new Map<StatType, number>();
  for (const stat of pool) {
    slopes.set(stat, 1.0);
  }
  const effectiveSet = reluHeuristic(stats, target, slopes);

  // Intersect with valid stats for each piece
  const sandsSubset = new Set(
    [...effectiveSet].filter((s) => sandsStats.has(s)),
  );
  const gobletSubset = new Set(
    [...effectiveSet].filter((s) => gobletStats.has(s)),
  );
  const circletSubset = new Set(
    [...effectiveSet].filter((s) => circletStats.has(s)),
  );

  let bestCombo: [StatType, StatType, StatType] = ["None", "None", "None"];
  let bestValue = 0;

  // N^3 global search to find best combo
  for (const sands of sandsSubset) {
    for (const goblet of gobletSubset) {
      for (const circlet of circletSubset) {
        const combo: [StatType, StatType, StatType] = [sands, goblet, circlet];
        // Create combined stats with main stats
        const combined = stats.clone();
        combined.add(sands, getMainStatValue(sands));
        combined.add(goblet, getMainStatValue(goblet));
        combined.add(circlet, getMainStatValue(circlet));
        const value = target.execute(combined);
        if (value > bestValue) {
          bestValue = value;
          bestCombo = combo;
        }
      }
    }
  }
  return bestCombo;
}

export function optimalMainStats(
  stats: StatTable,
  rotation: Rotation,
  getMainStatValue: (stat: StatType) => number,
): [StatType, StatType, StatType] {
  return globalKqmcArtifactMainStatOptimizer(stats, rotation, getMainStatValue);
}

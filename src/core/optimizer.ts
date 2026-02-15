import { StatType, StatTable, Rotation } from "./stat";
import {
  POSSIBLE_SANDS_STATS,
  POSSIBLE_GOBLET_STATS,
  POSSIBLE_CIRCLE_STATS,
  POSSIBLE_SUB_STATS,
  Artifact,
  getMainStatValue,
} from "./artifact-constants";
import { ArtifactBuilder } from "./artifact-builder";

/** Public API */
type SubstatDistribution = Map<StatType, number>;

export function optimalMainStats(
  stats: StatTable,
  rotation: Rotation,
): [StatType, StatType, StatType] {
  return globalKqmcArtifactMainStatOptimizer(stats, rotation);
}

export function gradient5StarKqmcArtifactSubstatOptimizer(
  stats: StatTable,
  target: Rotation,
  flower: Artifact | undefined,
  feather: Artifact | undefined,
  sands: Artifact | undefined,
  goblet: Artifact | undefined,
  circlet: Artifact | undefined,
  energyRechargeRequirement: number,
): SubstatDistribution {
  const builder = ArtifactBuilder.kqmc(
    flower,
    feather,
    sands,
    goblet,
    circlet,
  );

  while (true) {
    const combinedStats = stats.merge(builder.build());
    if (combinedStats.get("EnergyRecharge") >= energyRechargeRequirement) {
      break;
    }
    if (
      builder.rollsLeft() <= 0 ||
      builder.rollsLeftForGiven("EnergyRecharge", "AVG", 5) <= 0
    ) {
      throw new Error(
        "Energy Recharge requirements cannot be met with substats alone",
      );
    }
    builder.roll("EnergyRecharge", "AVG", 5, 1);
  }

  const possibleSubsToRoll = new Set<StatType>(POSSIBLE_SUB_STATS);

  while (builder.rollsLeft() > 0 && possibleSubsToRoll.size > 0) {
    let bestSub: StatType = "None";
    let bestValue = Number.NEGATIVE_INFINITY;

    for (const substat of possibleSubsToRoll) {
      if (
        builder.currentRollsForGiven(substat, "AVG", 5) >=
        builder.substatConstraint(substat, 5)
      ) {
        continue;
      }

      builder.roll(substat, "AVG", 5, 1);
      const value = target.execute(stats.merge(builder.build()));
      builder.unroll(substat, "AVG", 5, 1);

      if (value > bestValue) {
        bestValue = value;
        bestSub = substat;
      }
    }

    if (bestSub === "None") {
      break;
    }

    builder.roll(bestSub, "AVG", 5, 1);
  }

  const distribution: SubstatDistribution = new Map();
  for (const [[stat], count] of builder.rolls.entries()) {
    distribution.set(stat, (distribution.get(stat) || 0) + count);
  }

  return distribution;
}

export function optimalKqmc5ArtifactsStats(
  stats: StatTable,
  target: Rotation,
  energyRechargeRequirement: number,
): StatTable {
  const [sandsMain, gobletMain, circletMain] =
    globalKqmcArtifactMainStatOptimizer(stats, target);

  const flower: Artifact = {
    type: "flower",
    rarity: 5,
    level: 20,
    main_stat: "FlatHP",
  };
  const feather: Artifact = {
    type: "feather",
    rarity: 5,
    level: 20,
    main_stat: "FlatATK",
  };
  const sands: Artifact = {
    type: "sands",
    rarity: 5,
    level: 20,
    main_stat: sandsMain,
  };
  const goblet: Artifact = {
    type: "goblet",
    rarity: 5,
    level: 20,
    main_stat: gobletMain,
  };
  const circlet: Artifact = {
    type: "circlet",
    rarity: 5,
    level: 20,
    main_stat: circletMain,
  };

  const builder = new ArtifactBuilder(flower, feather, sands, goblet, circlet);
  const optimalSubstats = gradient5StarKqmcArtifactSubstatOptimizer(
    stats,
    target,
    flower,
    feather,
    sands,
    goblet,
    circlet,
    energyRechargeRequirement,
  );

  for (const [stat, count] of optimalSubstats.entries()) {
    builder.roll(stat, "AVG", 5, count);
  }

  return stats.merge(builder.build());
}

/** Ecapsulated implementation */

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


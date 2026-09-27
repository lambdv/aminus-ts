import { DamageCompute, StatTable, StatType } from "./stat.js";
import {
  Artifact,
  ArtifactType,
  KQMC_SUBSTAT_VALUES,
  POSSIBLE_CIRCLE_STATS,
  POSSIBLE_GOBLET_STATS,
  POSSIBLE_SANDS_STATS,
  POSSIBLE_SUB_STATS,
} from "./artifact-constants.js";
import { ArtifactBuilder } from "./artifact-builder.js";

export type KqmcMainStats = [StatType, StatType, StatType];
export type KqmcRarities = [4 | 5, 4 | 5, 4 | 5, 4 | 5, 4 | 5];

export interface KqmcOptimizeOptions {
  stats: StatTable;
  /** Receives combined base and candidate artifact stats; treat the argument as read-only. */
  score: DamageCompute;
  energyRechargeRequirement: number;
  mainStats?: KqmcMainStats;
  rarities?: KqmcRarities;
  manualCaps?: Partial<Record<StatType, number>>;
}

export interface KqmcOptimizationResult {
  mainStats: KqmcMainStats;
  fixedRolls: Map<StatType, number>;
  distributedRolls: Map<StatType, number>;
  artifactStats: StatTable;
  totalStats: StatTable;
  damage: number;
  energyRecharge: number;
}

function makePieces(main: KqmcMainStats, rarities: KqmcRarities): Artifact[] {
  const types: ArtifactType[] = ["flower", "feather", "sands", "goblet", "circlet"];
  const mains: StatType[] = ["FlatHP", "FlatATK", ...main];
  return types.map((type, i) => ({
    type,
    main_stat: mains[i],
    rarity: rarities[i],
    level: rarities[i] === 5 ? 20 : 16,
  }));
}

function makeBuilder(
  main: KqmcMainStats,
  rarities: KqmcRarities,
  caps: Partial<Record<StatType, number>>,
): ArtifactBuilder {
  const [flower, feather, sands, goblet, circlet] = makePieces(main, rarities);
  return ArtifactBuilder.kqmc(flower, feather, sands, goblet, circlet, caps);
}

function evaluateScore(score: DamageCompute, stats: StatTable): number {
  const value = score(stats.clone());
  if (!Number.isFinite(value)) throw new Error("Score produced non-finite damage");
  return value;
}

function optimizeDistribution(
  options: KqmcOptimizeOptions,
  main: KqmcMainStats,
  rarities: KqmcRarities,
): KqmcOptimizationResult | undefined {
  const builder = makeBuilder(main, rarities, options.manualCaps ?? {});
  const rollRarity = Math.max(...rarities);
  const scalar = (5 - rarities.filter((r) => r === 4).length * 0.2) / 5;
  const total = options.stats.merge(builder.build());
  const distributed = new Map<StatType, number>();
  const caps = new Map<StatType, number>();
  const values = new Map<StatType, number>();
  for (const stat of POSSIBLE_SUB_STATS) {
    distributed.set(stat, 0);
    caps.set(stat, builder.substatConstraint(stat, rollRarity) - 2);
    values.set(stat, (KQMC_SUBSTAT_VALUES[stat] ?? 0) * scalar);
  }

  const erValue = values.get("EnergyRecharge")!;
  const erNeeded = Math.max(
    0,
    Math.ceil((options.energyRechargeRequirement - total.get("EnergyRecharge") - 1e-12) / erValue),
  );
  if (erNeeded > caps.get("EnergyRecharge")! || erNeeded > builder.rollsLeft())
    return undefined;

  const adjust = (stat: StatType, count: number): void => {
    distributed.set(stat, distributed.get(stat)! + count);
    total.set(stat, total.get(stat) + count * values.get(stat)!);
  };
  adjust("EnergyRecharge", erNeeded);
  let remaining = builder.rollsLeft() - erNeeded;

  // Choose the best next roll at the current stats. Input order breaks ties.
  while (remaining > 0) {
    let best: StatType | undefined;
    let bestDamage = Number.NEGATIVE_INFINITY;
    for (const stat of POSSIBLE_SUB_STATS) {
      if (distributed.get(stat)! >= caps.get(stat)!) continue;
      adjust(stat, 1);
      const damage = evaluateScore(options.score, total);
      adjust(stat, -1);
      if (damage > bestDamage + 1e-10) {
        bestDamage = damage;
        best = stat;
      }
    }
    if (!best) return undefined;
    adjust(best, 1);
    remaining--;
  }

  // Repair greedy choices until no feasible one-roll reassignment improves damage.
  while (true) {
    const baseline = evaluateScore(options.score, total);
    let bestDamage = baseline;
    let bestMove: [StatType, StatType] | undefined;
    for (const from of POSSIBLE_SUB_STATS) {
      if (distributed.get(from)! === 0) continue;
      adjust(from, -1);
      for (const to of POSSIBLE_SUB_STATS) {
        if (to === from || distributed.get(to)! >= caps.get(to)!) continue;
        adjust(to, 1);
        if (total.get("EnergyRecharge") + 1e-12 >= options.energyRechargeRequirement) {
          const damage = evaluateScore(options.score, total);
          if (damage > bestDamage + 1e-10) {
            bestDamage = damage;
            bestMove = [from, to];
          }
        }
        adjust(to, -1);
      }
      adjust(from, 1);
    }
    if (!bestMove) break;
    adjust(bestMove[0], -1);
    adjust(bestMove[1], 1);
  }

  for (const [stat, count] of distributed)
    if (count > 0) builder.roll(stat, "AVG", rollRarity, count);
  const artifactStats = builder.build();
  const totalStats = options.stats.merge(artifactStats);
  const fixedRolls = new Map(POSSIBLE_SUB_STATS.map((stat) => [stat, 2] as [StatType, number]));
  return {
    mainStats: main,
    fixedRolls,
    distributedRolls: distributed,
    artifactStats,
    totalStats,
    damage: evaluateScore(options.score, totalStats),
    energyRecharge: totalStats.get("EnergyRecharge"),
  };
}

export function optimizeKqmcArtifacts(options: KqmcOptimizeOptions): KqmcOptimizationResult {
  if (!Number.isFinite(options.energyRechargeRequirement) || options.energyRechargeRequirement < 0)
    throw new Error("energyRechargeRequirement must be nonnegative and finite");
  const rarities = options.rarities ?? [5, 5, 5, 5, 5];
  if (rarities.length !== 5 || rarities.some((rarity) => rarity !== 4 && rarity !== 5))
    throw new Error("rarities must contain five 4- or 5-star values");
  const mains = options.mainStats
    ? [options.mainStats]
    : POSSIBLE_SANDS_STATS.flatMap((sands) =>
        POSSIBLE_GOBLET_STATS.flatMap((goblet) =>
          POSSIBLE_CIRCLE_STATS.map((circlet): KqmcMainStats => [sands, goblet, circlet]),
        ),
      );
  let best: KqmcOptimizationResult | undefined;
  for (const main of mains) {
    const candidate = optimizeDistribution(options, main, rarities);
    if (candidate && (!best || candidate.damage > best.damage + 1e-10)) best = candidate;
  }
  if (!best) throw new Error("Energy Recharge requirement is infeasible for all allowed main stats");
  return best;
}

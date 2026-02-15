import { StatType, StatTable } from "./stat";
import { Rng, defaultRng } from "./rng";
import { MAIN_AFFIX_WEIGHTS, MAIN_STAT_VALUES, Slot } from "../data/main-affix";
import {
  SUBSTAT_WEIGHTS,
  SUBSTAT_ROLL_TIERS,
  INITIAL_SUBSTAT_COUNTS,
  ROLL_TIER_PROBABILITIES,
  UPGRADE_ROLL_COUNTS,
  UPGRADE_INTERVAL,
  SubstatWeight,
} from "../data/substats";
import { Artifact } from "./artifacts";

/**
 * Create artifacts based on in game data
 */
export class ArtifactFactory {
  static pickWeighted<T extends { weight: number }>(
    items: T[],
    rng: Rng = defaultRng,
  ): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = rng.nextFloat() * totalWeight;

    for (const item of items) {
      random -= item.weight;
      if (random <= 0) {
        return item;
      }
    }

    return items[items.length - 1];
  }

  static selectMainStat(slot: Slot, rng: Rng = defaultRng): StatType {
    const weights = MAIN_AFFIX_WEIGHTS[slot];
    if (!weights) {
      throw new Error(`No main stat weights defined for slot: ${slot}`);
    }
    return ArtifactFactory.pickWeighted(weights, rng).stat;
  }

  static getAvailableSubstats(slot: Slot, mainStat: StatType): SubstatWeight[] {
    const slotWeights = SUBSTAT_WEIGHTS[slot];
    if (!slotWeights) {
      throw new Error(`No substat weights for slot: ${slot}`);
    }

    const mainStatWeights = slotWeights[mainStat];
    if (!mainStatWeights) {
      const keys = Object.keys(slotWeights);
      if (keys.length === 1) {
        return slotWeights[keys[0]];
      }
      throw new Error(
        `No substat weights for main stat ${mainStat} in slot ${slot}`,
      );
    }

    return mainStatWeights.filter((weight) => weight.stat !== mainStat);
  }

  static selectInitialSubstatCount(
    rarity: number,
    rng: Rng = defaultRng,
  ): number {
    const counts = INITIAL_SUBSTAT_COUNTS[rarity];
    if (!counts) {
      throw new Error(`No initial substat counts for rarity ${rarity}`);
    }

    const options = Object.entries(counts).map(([count, prob]) => ({
      value: parseInt(count, 10),
      weight: prob * 1000,
    }));

    return ArtifactFactory.pickWeighted(options, rng).value;
  }

  static selectRollTier(rarity: number, rng: Rng = defaultRng): number {
    const probs = ROLL_TIER_PROBABILITIES[rarity];
    if (!probs) {
      throw new Error(`No roll tier probabilities for rarity ${rarity}`);
    }

    const cumulative: number[] = [];
    let sum = 0;
    for (const prob of probs) {
      sum += prob;
      cumulative.push(sum);
    }

    const random = rng.nextFloat();
    for (let i = 0; i < cumulative.length; i++) {
      if (random < cumulative[i]) {
        return i;
      }
    }

    return 0;
  }

  static getSubstatRollValue(
    stat: StatType,
    rarity: number,
    tier: number,
  ): number {
    const rarityTiers = SUBSTAT_ROLL_TIERS[rarity];
    if (!rarityTiers) {
      throw new Error(`No substat roll tiers for rarity ${rarity}`);
    }

    const statTiers = rarityTiers[stat];
    if (!statTiers) {
      throw new Error(`No roll tiers for stat ${stat} at rarity ${rarity}`);
    }

    return statTiers[tier];
  }

  static selectUpgradeRollCount(rng: Rng = defaultRng): number {
    const options = Object.entries(UPGRADE_ROLL_COUNTS).map(
      ([count, prob]) => ({
        value: parseInt(count, 10),
        weight: prob * 10000,
      }),
    );

    return ArtifactFactory.pickWeighted(options, rng).value;
  }

  static generateSubstats(
    piece: Artifact,
    rng: Rng = defaultRng,
  ): Array<{ stat: StatType; value: number }> {
    const slot = ArtifactFactory.getSlotFromMainStat(piece.main_stat);
    const availableSubstats = ArtifactFactory.getAvailableSubstats(
      slot,
      piece.main_stat,
    );

    const initialCount = ArtifactFactory.selectInitialSubstatCount(
      piece.rarity,
      rng,
    );
    const substats: Map<StatType, number> = new Map();

    while (substats.size < initialCount) {
      const selected = ArtifactFactory.pickWeighted(availableSubstats, rng);
      if (!substats.has(selected.stat)) {
        const tier = ArtifactFactory.selectRollTier(piece.rarity, rng);
        const value = ArtifactFactory.getSubstatRollValue(
          selected.stat,
          piece.rarity,
          tier,
        );
        substats.set(selected.stat, value);
      }
    }

    const upgradeLevels = Math.floor(piece.level / UPGRADE_INTERVAL);
    for (let upgrade = 0; upgrade < upgradeLevels; upgrade++) {
      if (substats.size < 4) {
        const availableForNew = availableSubstats.filter(
          (weight) => !substats.has(weight.stat),
        );
        if (availableForNew.length > 0) {
          const selected = ArtifactFactory.pickWeighted(availableForNew, rng);
          const tier = ArtifactFactory.selectRollTier(piece.rarity, rng);
          const value = ArtifactFactory.getSubstatRollValue(
            selected.stat,
            piece.rarity,
            tier,
          );
          substats.set(
            selected.stat,
            (substats.get(selected.stat) || 0) + value,
          );
        }
        continue;
      }

      const existingStats = Array.from(substats.keys());
      const randomIndex = rng.nextInt(existingStats.length);
      const statToUpgrade = existingStats[randomIndex];

      const rollCount = ArtifactFactory.selectUpgradeRollCount(rng);
      for (let i = 0; i < rollCount; i++) {
        const tier = ArtifactFactory.selectRollTier(piece.rarity, rng);
        const value = ArtifactFactory.getSubstatRollValue(
          statToUpgrade,
          piece.rarity,
          tier,
        );
        substats.set(statToUpgrade, (substats.get(statToUpgrade) || 0) + value);
      }
    }

    return Array.from(substats.entries()).map(([stat, value]) => ({
      stat,
      value,
    }));
  }

  static generateArtifact(
    slot: Slot,
    rarity: number,
    level: number,
    rng: Rng = defaultRng,
  ): Artifact {
    const mainStat = ArtifactFactory.selectMainStat(slot, rng);
    const piece: Artifact = { type: slot, rarity, level, main_stat: mainStat };
    const substats = ArtifactFactory.generateSubstats(piece, rng);
    piece.substats = new StatTable(
      ...substats.map((s) => [s.stat, s.value] as [StatType, number]),
    );
    return piece;
  }

  static getSlotFromMainStat(mainStat: StatType): Slot {
    if (mainStat === "FlatHP") return "flower";
    if (mainStat === "FlatATK") return "feather";
    if (
      [
        "HPPercent",
        "ATKPercent",
        "DEFPercent",
        "ElementalMastery",
        "EnergyRecharge",
      ].includes(mainStat as string)
    )
      return "sands";
    if (
      [
        "HPPercent",
        "ATKPercent",
        "DEFPercent",
        "ElementalMastery",
        "PyroDMGBonus",
        "ElectroDMGBonus",
        "CryoDMGBonus",
        "HydroDMGBonus",
        "DendroDMGBonus",
        "AnemoDMGBonus",
        "GeoDMGBonus",
        "PhysicalDMGBonus",
      ].includes(mainStat as string)
    )
      return "goblet";
    return "circlet";
  }
}

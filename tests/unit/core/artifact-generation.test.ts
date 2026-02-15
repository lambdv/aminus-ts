import { describe, it, expect } from "@jest/globals";
import {
  selectMainStat,
  getMainStatValue,
  getAvailableSubstats,
  selectInitialSubstatCount,
  selectRollTier,
  getSubstatRollValue,
  selectUpgradeRollCount,
  generateArtifact,
  generateSubstats,
} from "@/core/artifacts";
import { SeededRng } from "@/core/rng";
import {
  MAIN_STAT_VALUES,
  MAIN_AFFIX_WEIGHTS,
} from "../../../src/data/main-affix";
import {
  SUBSTAT_ROLL_TIERS,
  INITIAL_SUBSTAT_COUNTS,
  ROLL_TIER_PROBABILITIES,
  UPGRADE_ROLL_COUNTS,
} from "../../../src/data/substats";

describe("Artifact Generation - Deterministic Rules", () => {
  describe("Main Stat Selection", () => {
    it("should select valid main stats for each slot", () => {
      const rng = new SeededRng(42);

      // Test each slot has valid main stat options
      for (const slot of [
        "flower",
        "feather",
        "sands",
        "goblet",
        "circlet",
      ] as const) {
        const weights = MAIN_AFFIX_WEIGHTS[slot];
        expect(weights.length).toBeGreaterThan(0);

        // All weights should be positive
        for (const weight of weights) {
          expect(weight.weight).toBeGreaterThan(0);
        }

        // Should be able to select a main stat
        const selected = selectMainStat(slot, rng);
        expect(weights.some((w: any) => w.stat === selected)).toBe(true);
      }
    });

    it("should have fixed main stats for flower and feather", () => {
      const flowerWeights = MAIN_AFFIX_WEIGHTS.flower;
      const featherWeights = MAIN_AFFIX_WEIGHTS.feather;

      expect(flowerWeights).toEqual([{ stat: "FlatHP", weight: 100 }]);
      expect(featherWeights).toEqual([{ stat: "FlatATK", weight: 100 }]);
    });

    it("should have weighted distributions for variable slots", () => {
      const sandsWeights = MAIN_AFFIX_WEIGHTS.sands;
      const gobletWeights = MAIN_AFFIX_WEIGHTS.goblet;
      const circletWeights = MAIN_AFFIX_WEIGHTS.circlet;

      // Sands should have 5 options
      expect(sandsWeights.length).toBe(5);
      expect(sandsWeights.some((w: any) => w.stat === "HPPercent")).toBe(true);
      expect(sandsWeights.some((w: any) => w.stat === "ATKPercent")).toBe(true);
      expect(sandsWeights.some((w: any) => w.stat === "DEFPercent")).toBe(true);
      expect(sandsWeights.some((w: any) => w.stat === "ElementalMastery")).toBe(
        true,
      );
      expect(sandsWeights.some((w: any) => w.stat === "EnergyRecharge")).toBe(
        true,
      );

      // Goblet should have 12 options
      expect(gobletWeights.length).toBe(12);

      // Circlet should have 7 options
      expect(circletWeights.length).toBe(7);
    });
  });

  describe("Main Stat Values", () => {
    it("should have main stat values for all rarities and levels", () => {
      for (const rarity of [1, 2, 3, 4, 5]) {
        expect(MAIN_STAT_VALUES[rarity]).toBeDefined();

        const levels = Object.keys(MAIN_STAT_VALUES[rarity]).map(Number);
        expect(levels.length).toBeGreaterThan(0);

        // Should have level 0 and at least one higher level
        expect(levels).toContain(0);
        expect(levels.length).toBeGreaterThan(1);
      }
    });

    it("should return correct main stat values", () => {
      // Test some known values
      expect(getMainStatValue("FlatHP", 5, 20)).toBe(4780);
      expect(getMainStatValue("FlatATK", 5, 20)).toBe(311);
      expect(getMainStatValue("HPPercent", 5, 20)).toBeCloseTo(0.466, 3);
      expect(getMainStatValue("CritRate", 5, 20)).toBeCloseTo(0.311, 3);
    });

    it("should interpolate levels correctly", () => {
      // Level 6 should use level 4 values
      const level4HP = getMainStatValue("FlatHP", 5, 4);
      const level6HP = getMainStatValue("FlatHP", 5, 6);
      expect(level6HP).toBe(level4HP);
    });
  });

  describe("Substat Availability", () => {
    it("should exclude main stat from available substats", () => {
      const flowerSubstats = getAvailableSubstats("flower", "FlatHP");
      expect(flowerSubstats.some((s) => s.stat === "FlatHP")).toBe(false);

      const featherSubstats = getAvailableSubstats("feather", "FlatATK");
      expect(featherSubstats.some((s) => s.stat === "FlatATK")).toBe(false);
    });

    it("should have correct substat pools for each slot/main combination", () => {
      // Flower with FlatHP should have 9 possible substats
      const flowerSubstats = getAvailableSubstats("flower", "FlatHP");
      expect(flowerSubstats.length).toBe(9);

      // Sands with HP% should exclude HP% and have 9 substats
      const sandsHPSubstats = getAvailableSubstats("sands", "HPPercent");
      expect(sandsHPSubstats.some((s) => s.stat === "HPPercent")).toBe(false);
      expect(sandsHPSubstats.length).toBe(9);

      // Sands with ATK% should exclude ATK% and have 9 substats
      const sandsATKSubstats = getAvailableSubstats("sands", "ATKPercent");
      expect(sandsATKSubstats.some((s) => s.stat === "ATKPercent")).toBe(false);
      expect(sandsATKSubstats.length).toBe(9);
    });
  });

  describe("Initial Substat Counts", () => {
    it("should have valid initial count distributions", () => {
      for (const rarity of [1, 2, 3, 4, 5]) {
        const counts = INITIAL_SUBSTAT_COUNTS[rarity];
        expect(counts).toBeDefined();

        const totalProb = Object.values(counts).reduce(
          (sum: number, prob: number) => sum + prob,
          0,
        );
        expect(totalProb).toBeCloseTo(1.0, 5);
      }
    });

    it("should select valid initial counts", () => {
      const rng = new SeededRng(123);

      for (const rarity of [3, 4, 5]) {
        const count = selectInitialSubstatCount(rarity, rng);
        const validCounts = Object.keys(INITIAL_SUBSTAT_COUNTS[rarity]).map(
          Number,
        );
        expect(validCounts).toContain(count);
      }
    });
  });

  describe("Roll Tiers", () => {
    it("should have valid roll tier probabilities", () => {
      for (const rarity of [1, 2, 3, 4, 5]) {
        const probs = ROLL_TIER_PROBABILITIES[rarity];
        expect(probs).toBeDefined();
        expect(probs.length).toBe(4);

        const totalProb = probs.reduce(
          (sum: number, prob: number) => sum + prob,
          0,
        );
        expect(totalProb).toBeCloseTo(1.0, 2);
      }
    });

    it("should select valid roll tiers", () => {
      const rng = new SeededRng(456);

      for (const rarity of [3, 4, 5]) {
        const tier = selectRollTier(rarity, rng);
        expect(tier).toBeGreaterThanOrEqual(0);
        expect(tier).toBeLessThanOrEqual(3);
      }
    });

    it("should have correct roll tier values", () => {
      // Test 5-star FlatHP tiers
      expect(getSubstatRollValue("FlatHP", 5, 0)).toBe(298.75); // max
      expect(getSubstatRollValue("FlatHP", 5, 1)).toBe(268.88); // high
      expect(getSubstatRollValue("FlatHP", 5, 2)).toBe(239.0); // mid
      expect(getSubstatRollValue("FlatHP", 5, 3)).toBe(209.13); // low

      // Test 5-star CritRate tiers
      expect(getSubstatRollValue("CritRate", 5, 0)).toBeCloseTo(0.0389, 4);
      expect(getSubstatRollValue("CritRate", 5, 1)).toBeCloseTo(0.035, 4);
    });
  });

  describe("Upgrade Behavior", () => {
    it("should have valid upgrade roll count distribution", () => {
      const totalProb = Object.values(UPGRADE_ROLL_COUNTS).reduce(
        (sum: number, prob: number) => sum + prob,
        0,
      );
      expect(totalProb).toBeCloseTo(1.0, 5);
    });

    it("should select valid upgrade roll counts", () => {
      const rng = new SeededRng(789);

      for (let i = 0; i < 10; i++) {
        const count = selectUpgradeRollCount(rng);
        expect(count).toBeGreaterThanOrEqual(0);
        expect(count).toBeLessThanOrEqual(5);
      }
    });
  });

  describe("Artifact Generation", () => {
    it("should generate valid artifacts", () => {
      const rng = new SeededRng(1000);

      const artifact = generateArtifact("sands", 5, 20, rng);

      expect(artifact.piece.rarity).toBe(5);
      expect(artifact.piece.level).toBe(20);
      expect(artifact.substats.length).toBeGreaterThanOrEqual(3);
      expect(artifact.substats.length).toBeLessThanOrEqual(4);

      // Main stat should not appear in substats
      for (const substat of artifact.substats) {
        expect(substat.stat).not.toBe(artifact.piece.main_stat);
        expect(substat.value).toBeGreaterThan(0);
      }
    });

    it("should respect level-based upgrades", () => {
      const rng = new SeededRng(2000);

      // Level 0: no upgrades
      const level0 = generateArtifact("circlet", 5, 0, rng);
      expect(level0.substats.length).toBeGreaterThanOrEqual(3);
      expect(level0.substats.length).toBeLessThanOrEqual(4);

      // Level 20: 5 upgrades (every 4 levels: 4,8,12,16,20)
      const level20 = generateArtifact("circlet", 5, 20, rng);
      expect(level20.substats.length).toBe(4); // Should reach max substats
    });

    it("should generate different artifacts with different seeds", () => {
      const artifact1 = generateArtifact("goblet", 5, 20, new SeededRng(1));
      const artifact2 = generateArtifact("goblet", 5, 20, new SeededRng(2));

      // Should have some differences (with high probability)
      const substat1 = artifact1.substats[0];
      const substat2 = artifact2.substats[0];
      expect(substat1.value).not.toBe(substat2.value);
    });
  });
});

import { describe, it, expect } from "@jest/globals";
import {
  selectMainStat,
  selectInitialSubstatCount,
  selectRollTier,
  selectUpgradeRollCount,
  generateArtifact,
} from "@/core/artifacts";
import { SeededRng } from "@/core/rng";
import { MAIN_AFFIX_WEIGHTS } from "../../../src/data/main-affix";
import {
  INITIAL_SUBSTAT_COUNTS,
  ROLL_TIER_PROBABILITIES,
  UPGRADE_ROLL_COUNTS,
} from "../../../src/data/substats";

describe("Artifact Generation - Statistical Distributions", () => {
  const SAMPLE_SIZE = 10000;
  const TOLERANCE = 0.05; // 5% tolerance for distribution tests

  describe("Main Stat Distributions", () => {
    it("should match expected main stat frequencies for sands", () => {
      const rng = new SeededRng(10000);
      const counts: Record<string, number> = {};

      for (let i = 0; i < SAMPLE_SIZE; i++) {
        const stat = selectMainStat("sands", rng);
        counts[stat] = (counts[stat] || 0) + 1;
      }

      const weights = MAIN_AFFIX_WEIGHTS.sands;
      const totalWeight = weights.reduce(
        (sum: number, w: any) => sum + w.weight,
        0,
      );

      for (const weight of weights) {
        const expectedFreq = weight.weight / totalWeight;
        const actualFreq = counts[weight.stat] / SAMPLE_SIZE;
        const diff = Math.abs(actualFreq - expectedFreq);

        expect(diff).toBeLessThan(TOLERANCE);
      }
    });

    it("should match expected main stat frequencies for goblet", () => {
      const rng = new SeededRng(20000);
      const counts: Record<string, number> = {};

      for (let i = 0; i < SAMPLE_SIZE; i++) {
        const stat = selectMainStat("goblet", rng);
        counts[stat] = (counts[stat] || 0) + 1;
      }

      const weights = MAIN_AFFIX_WEIGHTS.goblet;
      const totalWeight = weights.reduce(
        (sum: number, w: any) => sum + w.weight,
        0,
      );

      for (const weight of weights) {
        const expectedFreq = weight.weight / totalWeight;
        const actualFreq = counts[weight.stat] / SAMPLE_SIZE;
        const diff = Math.abs(actualFreq - expectedFreq);

        expect(diff).toBeLessThan(TOLERANCE);
      }
    });

    it("should match expected main stat frequencies for circlet", () => {
      const rng = new SeededRng(30000);
      const counts: Record<string, number> = {};

      for (let i = 0; i < SAMPLE_SIZE; i++) {
        const stat = selectMainStat("circlet", rng);
        counts[stat] = (counts[stat] || 0) + 1;
      }

      const weights = MAIN_AFFIX_WEIGHTS.circlet;
      const totalWeight = weights.reduce(
        (sum: number, w: any) => sum + w.weight,
        0,
      );

      for (const weight of weights) {
        const expectedFreq =
          weight.stat === "CritRate" || weight.stat === "CritDMG"
            ? weight.weight / totalWeight
            : weight.weight / totalWeight;
        const actualFreq = counts[weight.stat] / SAMPLE_SIZE;
        const diff = Math.abs(actualFreq - expectedFreq);

        expect(diff).toBeLessThan(TOLERANCE);
      }
    });
  });

  describe("Initial Substat Count Distributions", () => {
    it("should match expected initial substat count frequencies for 5-star", () => {
      const rng = new SeededRng(40000);
      const counts: Record<number, number> = {};

      for (let i = 0; i < SAMPLE_SIZE; i++) {
        const count = selectInitialSubstatCount(5, rng);
        counts[count] = (counts[count] || 0) + 1;
      }

      const expected = INITIAL_SUBSTAT_COUNTS[5];
      for (const [countStr, expectedProb] of Object.entries(expected)) {
        const count = parseInt(countStr);
        const actualFreq = counts[count] / SAMPLE_SIZE;
        const diff = Math.abs(actualFreq - (expectedProb as number));

        expect(diff).toBeLessThan(TOLERANCE);
      }
    });

    it("should match expected initial substat count frequencies for 4-star", () => {
      const rng = new SeededRng(50000);
      const counts: Record<number, number> = {};

      for (let i = 0; i < SAMPLE_SIZE; i++) {
        const count = selectInitialSubstatCount(4, rng);
        counts[count] = (counts[count] || 0) + 1;
      }

      const expected = INITIAL_SUBSTAT_COUNTS[4];
      for (const [countStr, expectedProb] of Object.entries(expected)) {
        const count = parseInt(countStr);
        const actualFreq = counts[count] / SAMPLE_SIZE;
        const diff = Math.abs(actualFreq - (expectedProb as number));

        expect(diff).toBeLessThan(TOLERANCE);
      }
    });
  });

  describe("Roll Tier Distributions", () => {
    it("should match expected roll tier frequencies for 5-star", () => {
      const rng = new SeededRng(60000);
      const counts: Record<number, number> = {};

      for (let i = 0; i < SAMPLE_SIZE; i++) {
        const tier = selectRollTier(5, rng);
        counts[tier] = (counts[tier] || 0) + 1;
      }

      const expected = ROLL_TIER_PROBABILITIES[5];
      for (let tier = 0; tier < expected.length; tier++) {
        const actualFreq = counts[tier] / SAMPLE_SIZE;
        const diff = Math.abs(actualFreq - expected[tier]);

        expect(diff).toBeLessThan(TOLERANCE);
      }
    });

    it("should match expected roll tier frequencies for 4-star", () => {
      const rng = new SeededRng(70000);
      const counts: Record<number, number> = {};

      for (let i = 0; i < SAMPLE_SIZE; i++) {
        const tier = selectRollTier(4, rng);
        counts[tier] = (counts[tier] || 0) + 1;
      }

      const expected = ROLL_TIER_PROBABILITIES[4];
      for (let tier = 0; tier < expected.length; tier++) {
        const actualFreq = counts[tier] / SAMPLE_SIZE;
        const diff = Math.abs(actualFreq - expected[tier]);

        expect(diff).toBeLessThan(TOLERANCE);
      }
    });
  });

  describe("Upgrade Roll Count Distributions", () => {
    it("should match expected upgrade roll count frequencies", () => {
      const rng = new SeededRng(80000);
      const counts: Record<number, number> = {};

      for (let i = 0; i < SAMPLE_SIZE; i++) {
        const count = selectUpgradeRollCount(rng);
        counts[count] = (counts[count] || 0) + 1;
      }

      for (const [countStr, expectedProb] of Object.entries(
        UPGRADE_ROLL_COUNTS,
      )) {
        const count = parseInt(countStr);
        const actualFreq = (counts[count] || 0) / SAMPLE_SIZE;
        const diff = Math.abs(actualFreq - (expectedProb as number));

        expect(diff).toBeLessThan(TOLERANCE);
      }
    });
  });

  describe("End-to-End Artifact Distributions", () => {
    it("should generate artifacts with correct substat count distribution at level 20", () => {
      const rng = new SeededRng(90000);
      const substatCounts: Record<number, number> = {};

      for (let i = 0; i < SAMPLE_SIZE; i++) {
        const artifact = generateArtifact("circlet", 5, 20, rng);
        const count = artifact.substats.length;
        substatCounts[count] = (substatCounts[count] || 0) + 1;
      }

      // At level 20, all artifacts should have 4 substats (initial 3-4 + 5 upgrades)
      expect(substatCounts[4]).toBe(SAMPLE_SIZE);
      expect(substatCounts[3]).toBeUndefined();
    });

    it("should have no duplicate substats in generated artifacts", () => {
      const rng = new SeededRng(100000);

      for (let i = 0; i < 1000; i++) {
        const artifact = generateArtifact("goblet", 5, 20, rng);
        const statNames = artifact.substats.map((s) => s.stat);
        const uniqueStats = new Set(statNames);

        expect(uniqueStats.size).toBe(statNames.length);
      }
    });

    it("should never have main stat as substat", () => {
      const rng = new SeededRng(110000);

      for (let i = 0; i < 1000; i++) {
        const artifact = generateArtifact("sands", 5, 20, rng);

        for (const substat of artifact.substats) {
          expect(substat.stat).not.toBe(artifact.piece.main_stat);
        }
      }
    });

    it("should have reasonable substat value ranges", () => {
      const rng = new SeededRng(120000);

      for (let i = 0; i < 1000; i++) {
        const artifact = generateArtifact("feather", 5, 20, rng);

        for (const substat of artifact.substats) {
          expect(substat.value).toBeGreaterThan(0);

          // Check against known max values for 5-star
          if (substat.stat === "FlatHP") {
            expect(substat.value).toBeLessThanOrEqual(298.75 * 10); // Rough max with upgrades
          }
          if (substat.stat === "CritRate") {
            expect(substat.value).toBeLessThanOrEqual(0.0389 * 10);
          }
        }
      }
    });
  });

  describe("Occurrence Probability Validation", () => {
    it("should have correct CRIT Rate + CRIT DMG pair occurrence in circlet", () => {
      const rng = new SeededRng(130000);
      let critPairCount = 0;

      for (let i = 0; i < SAMPLE_SIZE; i++) {
        const artifact = generateArtifact("circlet", 5, 20, rng);
        const hasCritRate = artifact.substats.some(
          (s) => s.stat === "CritRate",
        );
        const hasCritDMG = artifact.substats.some((s) => s.stat === "CritDMG");

        if (hasCritRate && hasCritDMG) {
          critPairCount++;
        }
      }

      const actualFreq = critPairCount / SAMPLE_SIZE;
      const expectedFreq = 0.083; // From wiki: 8.3% for CR + CD pair

      const diff = Math.abs(actualFreq - expectedFreq);
      expect(diff).toBeLessThan(TOLERANCE);
    });

    it("should have correct single CRIT stat occurrence in circlet", () => {
      const rng = new SeededRng(140000);
      let critRateOnlyCount = 0;
      let critDMGOnlyCount = 0;

      for (let i = 0; i < SAMPLE_SIZE; i++) {
        const artifact = generateArtifact("circlet", 5, 20, rng);
        const hasCritRate = artifact.substats.some(
          (s) => s.stat === "CritRate",
        );
        const hasCritDMG = artifact.substats.some((s) => s.stat === "CritDMG");

        if (hasCritRate && !hasCritDMG) {
          critRateOnlyCount++;
        }
        if (hasCritDMG && !hasCritRate) {
          critDMGOnlyCount++;
        }
      }

      // From wiki: CRIT Rate% 32.0%, CRIT DMG% 32.0% (but these are scaled chances)
      // The actual occurrence probability needs calculation based on the pool
      const critRateOnlyFreq = critRateOnlyCount / SAMPLE_SIZE;
      const critDMGOnlyFreq = critDMGOnlyCount / SAMPLE_SIZE;

      // Both should be roughly equal and non-zero
      expect(critRateOnlyFreq).toBeGreaterThan(0.1);
      expect(critDMGOnlyFreq).toBeGreaterThan(0.1);
      expect(Math.abs(critRateOnlyFreq - critDMGOnlyFreq)).toBeLessThan(0.05);
    });
  });
});

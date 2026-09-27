import { ArtifactBuilder } from "@/core/artifact-builder";
import { POSSIBLE_SUB_STATS } from "@/core/artifact-constants";
import { character_damage } from "@/core/formulas";
import { optimizeKqmcArtifacts } from "@/core/optimizer";
import { Rotation, StatTable, StatType } from "@/core/stat";

const pieces = (rarities: [4 | 5, 4 | 5, 4 | 5, 4 | 5, 4 | 5]) => {
  const [f, p, s, g, c] = rarities;
  const piece = (type: "flower" | "feather" | "sands" | "goblet" | "circlet", rarity: 4 | 5, main_stat: StatType) =>
    ({ type, rarity, level: rarity === 5 ? 20 : 16, main_stat });
  return ArtifactBuilder.kqmc(
    piece("flower", f, "FlatHP"), piece("feather", p, "FlatATK"),
    piece("sands", s, "ATKPercent"), piece("goblet", g, "PyroDMGBonus"),
    piece("circlet", c, "CritRate"),
  );
};

const base = () => new StatTable(
  ["BaseATK", 1000], ["BaseHP", 1000], ["BaseDEF", 100],
  ["CritRate", 0.05], ["CritDMG", 0.5], ["EnergyRecharge", 1],
);
const rotation = () => new Rotation([["hit", character_damage({ element: "Pyro", damageType: "Normal", motionValue: 1 })]]);

describe("KQMS artifact results and optimization", () => {
  it("matches workbook fixed rolls, main stats, caps, and roll budget", () => {
    const builder = pieces([5, 5, 5, 5, 5]);
    expect(builder.currentRolls()).toBe(20);
    expect(builder.maxRolls()).toBe(40);
    expect(builder.subStats().get("HPPercent")).toBeCloseTo(2 * 0.0496, 10);
    expect(builder.subStats().get("CritDMG")).toBeCloseTo(2 * 0.0662, 10);
    expect(builder.mainStats().get("ATKPercent")).toBe(0.466);
    expect(builder.substatConstraint("CritDMG", 5)).toBe(12);
    expect(builder.substatConstraint("ATKPercent", 5)).toBe(10);
    expect(builder.substatConstraint("FlatHP", 5)).toBe(10);
    expect(() => builder.roll("CritDMG", "AVG", 5, 11)).toThrow("Exceeds constraint");
    expect(() => builder.roll("CritDMG", "AVG", 5, 10)).not.toThrow();
    builder.roll("FlatDEF", "AVG", 5, 10);
    expect(builder.currentRolls()).toBe(40);
    expect(() => builder.roll("HPPercent", "AVG", 5, 1)).toThrow("Exceeds total roll budget");
    expect(() => builder.unroll("HPPercent", "AVG", 5, 1)).toThrow("fixed rolls");
  });

  it("applies mixed-rarity KQMS scalar and distributed-roll penalty", () => {
    const mixed = pieces([5, 4, 4, 4, 4]);
    expect(mixed.currentRolls()).toBe(20);
    expect(mixed.maxRolls()).toBe(32);
    expect(mixed.subStats().get("HPPercent")).toBeCloseTo(2 * 0.0496 * 0.84, 10);
    expect(mixed.mainStats().get("ATKPercent")).toBeCloseTo(0.466 * 0.8, 10);
    const four = pieces([4, 4, 4, 4, 4]);
    expect(four.currentRolls()).toBe(20);
    expect(four.maxRolls()).toBe(30);
    expect(four.subStats().get("CritRate")).toBeCloseTo(2 * 0.0331 * 0.8, 10);
    expect(four.mainStats().get("ATKPercent")).toBeCloseTo(0.466 * 0.8, 10);
  });

  it("considers ER sands before rejecting a feasible target", () => {
    const result = optimizeKqmcArtifacts({
      stats: base(), score: s => rotation().execute(s), energyRechargeRequirement: 2.05,
    });
    expect(result.mainStats[0]).toBe("EnergyRecharge");
    expect(result.energyRecharge).toBeGreaterThanOrEqual(2.05);
    expect(result.distributedRolls.get("EnergyRecharge")).toBeLessThanOrEqual(8);
    expect([...result.distributedRolls.values()].reduce((sum, count) => sum + count, 0)).toBe(20);
    expect(result.totalStats.get("BaseATK")).toBe(1000);
    expect(result.artifactStats.get("BaseATK")).toBe(0);

    const scalar = 0.0551;
    expect(1 + 0.518 + 10 * scalar).toBeGreaterThanOrEqual(2.05);
  });

  it("has no feasible improving one-roll reassignment", () => {
    const target = rotation();
    const result = optimizeKqmcArtifacts({
      stats: base(), score: s => target.execute(s), energyRechargeRequirement: 1.3,
      mainStats: ["ATKPercent", "PyroDMGBonus", "CritDMG"],
    });
    const mainStats: StatType[] = ["FlatHP", "FlatATK", ...result.mainStats];
    const scalar: Partial<Record<StatType, number>> = {
      HPPercent: .0496, FlatHP: 253.94, ATKPercent: .0496, FlatATK: 16.54,
      DEFPercent: .062, FlatDEF: 19.68, ElementalMastery: 19.82,
      EnergyRecharge: .0551, CritRate: .0331, CritDMG: .0662,
    };
    for (const from of POSSIBLE_SUB_STATS) {
      if (!result.distributedRolls.get(from)) continue;
      for (const to of POSSIBLE_SUB_STATS) {
        if (from === to || result.distributedRolls.get(to)! >= 2 * (5 - mainStats.filter((s) => s === to).length)) continue;
        const moved = result.totalStats.clone();
        moved.add(from, -scalar[from]!);
        moved.add(to, scalar[to]!);
        if (moved.get("EnergyRecharge") + 1e-12 < 1.3) continue;
        expect(target.execute(moved)).toBeLessThanOrEqual(result.damage + 1e-8);
      }
    }
  });

  it("matches exhaustive optimization in a small feasible allocation space", () => {
    const caps = Object.fromEntries(POSSIBLE_SUB_STATS.map((stat) => [stat, 2])) as Partial<Record<StatType, number>>;
    caps.ATKPercent = 10;
    caps.CritRate = 12;
    caps.CritDMG = 12;
    const target = rotation();
    const result = optimizeKqmcArtifacts({
      stats: base(), score: s => target.execute(s), energyRechargeRequirement: 1,
      mainStats: ["ATKPercent", "PyroDMGBonus", "CritDMG"], manualCaps: caps,
    });
    let exhaustive = Number.NEGATIVE_INFINITY;
    for (let atk = 0; atk <= 8; atk++) {
      for (let cr = 0; cr <= 10; cr++) {
        const cd = 20 - atk - cr;
        if (cd < 0 || cd > 8) continue; // Crit DMG circlet excludes that substat.
        const builder = ArtifactBuilder.kqmAll5Star("ATKPercent", "PyroDMGBonus", "CritDMG");
        builder.roll("ATKPercent", "AVG", 5, atk);
        builder.roll("CritRate", "AVG", 5, cr);
        builder.roll("CritDMG", "AVG", 5, cd);
        exhaustive = Math.max(exhaustive, target.execute(base().merge(builder.build())));
      }
    }
    expect(result.damage).toBeCloseTo(exhaustive, 7);
  });
});

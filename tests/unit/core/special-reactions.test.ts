import { StatTable } from "@/core/stat";
import { resolveReaction } from "@/core/reactions/conversion";
import { directReactionBreakdown, indirectReactionBreakdown,
  polestarElementalBonus, stellarConductCoefficient } from "@/core/reactions/formulas";

describe("Lunar and Stellar reaction kernels", () => {
  it("only converts the supported elemental variants in the presence of an enabler", () => {
    const enablers = [{ id: "moon", converts: ["Lunar-Crystallize" as const] },
      { id: "star", converts: ["Stellar Swirl" as const] }];
    expect(resolveReaction("Hydro Crystallize", enablers)).toBe("Lunar-Crystallize");
    expect(resolveReaction("Pyro Crystallize", enablers)).toBe("Pyro Crystallize");
    expect(resolveReaction("Cryo Swirl", enablers)).toBe("Stellar Swirl");
    expect(resolveReaction("Hydro Swirl", enablers)).toBe("Hydro Swirl");
    expect(resolveReaction("Bloom", enablers)).toBe("Bloom");
  });

  it("calculates direct damage with additive base damage after the EM factor", () => {
    const stats = new StatTable(["ElementalMastery", 200], ["CritRate", 0.5],
      ["CritDMG", 1], ["GeoDMGBonus", 5], ["DefIgnore", 1]);
    const result = directReactionBreakdown({ reaction: "Lunar-Crystallize", element: "Geo",
      abilityMultiplier: 2, scalingValue: 1000, stats, additiveBaseDamage: 100,
      modifiers: { baseDamageBonus: 0.1, reactionBonus: 0.2, elevation: 0.25 },
      enemyResistance: 0.1 });
    const em = 1 + 6 * 200 / 2200 + 0.2;
    expect(result.total).toBeCloseTo((1.6 * 2 * 1000 * 1.1 * em + 100) * 1.25 * 0.9 * 1.5);
    expect(result.coefficient).toBe(1.6);
    expect(stats.get("GeoDMGBonus")).toBe(5);
  });

  it("tracks the Polestar count and rejects out-of-range counts", () => {
    expect([0, 1, 12].map(stellarConductCoefficient)).toEqual([1, 1.45, 2]);
    expect(polestarElementalBonus(0)).toBe(0.2);
    expect(polestarElementalBonus(1)).toBeCloseTo(0.29);
    expect(polestarElementalBonus(12)).toBeCloseTo(0.4);
    expect(() => stellarConductCoefficient(13)).toThrow();
    expect(directReactionBreakdown({ reaction: "Stellar-Conduct", element: "Cryo",
      abilityMultiplier: 1, scalingValue: 100, stats: new StatTable(), recordedFieldHits: 12,
      crit: "none", enemyResistance: 0 }).total).toBe(200);
  });

  it("weights ranks after CRIT rather than ranking average damage", () => {
    const a = new StatTable(["CritRate", 0.5], ["CritDMG", 1]);
    const b = new StatTable();
    const input = { reaction: "Lunar-Charged" as const, component: "thundercloud" as const,
      contributors: [{ id: "a", level: 90, stats: a }, { id: "b", level: 90, stats: b }],
      enemyResistance: 0 };
    const levelBase = indirectReactionBreakdown({ ...input, crit: "none" }).contributors[0].nonCrit;
    const actual = indirectReactionBreakdown(input);
    // Half the time: a=2x, b=1x. Otherwise both=1x.
    expect(actual.total).toBeCloseTo(levelBase * (0.5 * (2 * 0.6 + 0.3) + 0.5 * 0.9));
    expect(actual.contributors.reduce((sum, c) => sum + c.weightedDamage, 0)).toBeCloseTo(actual.total);
    expect(() => indirectReactionBreakdown({ ...input, component: "swirlInitial" })).toThrow();
  });

  it("omits missing ranks without redistributing their weights", () => {
    const result = indirectReactionBreakdown({ reaction: "Stellar Swirl", component: "swirlInitial",
      contributors: [{ id: "swirler", level: 90, stats: new StatTable() }],
      enemyResistance: 0, crit: "none" });
    expect(result.total).toBeCloseTo(result.contributors[0].nonCrit * 0.6);
    expect(result.element).toBe("Anemo");
  });
});

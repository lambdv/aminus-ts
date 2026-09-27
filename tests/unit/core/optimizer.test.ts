import { optimizeKqmcArtifacts, character_damage, StatTable } from "@/index";
const score = character_damage({ element: "Pyro", damageType: "Normal", motionValue: 1 });
const stats = () => new StatTable(["BaseATK", 1000], ["CritRate", .05], ["CritDMG", .5], ["EnergyRecharge", 1]);
it("improves damage without double counting base stats or mutating input", () => {
  const base = stats(), before = [...base];
  const result = optimizeKqmcArtifacts({ stats: base, score, energyRechargeRequirement: 1.3 });
  expect(result.damage).toBeGreaterThan(score(base));
  expect(result.totalStats.get("BaseATK")).toBe(1000);
  expect(result.totalStats).toEqual(base.merge(result.artifactStats));
  expect(result.energyRecharge).toBeGreaterThanOrEqual(1.3);
  expect([...base]).toEqual(before);
});
it("rejects infeasible ER and non-finite objectives", () => {
  expect(() => optimizeKqmcArtifacts({ stats: stats(), score, energyRechargeRequirement: 5 })).toThrow("infeasible");
  expect(() => optimizeKqmcArtifacts({ stats: stats(), score: () => NaN, energyRechargeRequirement: 1 })).toThrow("non-finite");
});
it("uses supplied main stats when ER is already sufficient", () => {
  const result = optimizeKqmcArtifacts({ stats: stats(), score, energyRechargeRequirement: 1.5,
    mainStats: ["EnergyRecharge", "PyroDMGBonus", "CritRate"] });
  expect(result.energyRecharge).toBeGreaterThanOrEqual(1.5);
  expect([...result.distributedRolls.values()].reduce((a,b) => a+b,0)).toBe(20);
});
it("isolates candidate allocation from callbacks that mutate their argument", () => {
  const options = { stats: stats(), energyRechargeRequirement: 1,
    mainStats: ["ATKPercent", "PyroDMGBonus", "CritRate"] as ["ATKPercent", "PyroDMGBonus", "CritRate"] };
  const expected = optimizeKqmcArtifacts({ ...options, score });
  const actual = optimizeKqmcArtifacts({ ...options, score: s => { const value = score(s); s.set("BaseATK", 0); return value; } });
  expect(actual).toEqual(expected);
});

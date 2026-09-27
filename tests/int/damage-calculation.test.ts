import { StatTable, Rotation } from "@/core/stat";
import { character_damage } from "@/core/formulas";
import { optimizeKqmcArtifacts } from "@/core/optimizer";

describe("Damage Calculation Integration", () => {
  it("should calculate primitive character damage", () => {
    let ayaka = new StatTable(
      ["BaseHP", 12858],
      ["BaseATK", 342 + 674],
      ["BaseDEF", 784],
      ["CritRate", 0.05 + 0.55],
      ["CritDMG", 0.5 + 0.884 + 0.441],
      ["EnergyRecharge", 1.0],
      ["ATKPercent", 0.88],
      ["CryoDMGBonus", 0.73],
      ["NormalATKDMGBonus", 0.3],
      ["ChargeATKDMGBonus", 0.3],
      ["CryoResistanceReduction", 0.4],
    );

    const rotation = new Rotation([
      ["n1", character_damage({ element: "Cryo", damageType: "Normal", motionValue: 0.84, instances: 3 })],
      ["n2", character_damage({ element: "Cryo", damageType: "Normal", motionValue: 0.894, instances: 2 })],
      ["ca", character_damage({ element: "Cryo", damageType: "Charged", motionValue: 3.039, instances: 2 })],
      ["skill", character_damage({ element: "Cryo", damageType: "Skill", motionValue: 4.07, instances: 2 })],
      ["burstcuts", character_damage({ element: "Cryo", damageType: "Burst", motionValue: 1.91, instances: 19 })],
      ["burstexplosion", character_damage({ element: "Cryo", damageType: "Burst", motionValue: 2.86 })],
    ]);
    ayaka = optimizeKqmcArtifacts({ stats: ayaka, score: s => rotation.execute(s), energyRechargeRequirement: 1.30 }).totalStats;
    const dps = rotation.execute(ayaka) / 21.0;

    expect(dps).toBeGreaterThan(0);
    expect(Number.isFinite(dps)).toBe(true);
  });
});

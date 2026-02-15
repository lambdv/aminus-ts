import { StatTable, Rotation } from "@/core/stat";
import { dmg_formula } from "@/core/formulas";
import { optimalKqmc5ArtifactsStats } from "@/core/optimizer";

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

    const rotation = new Rotation(
      ["n1", dmg_formula("Cryo", "Normal", 0.84, 3)],
      ["n2", dmg_formula("Cryo", "Normal", 0.894, 2)],
      ["ca", dmg_formula("Cryo", "Charged", 3.039, 2)],
      ["skill", dmg_formula("Cryo", "Skill", 4.07, 2)],
      ["burstcuts", dmg_formula("Cryo", "Burst", 1.91, 19)],
      ["burstexplosion", dmg_formula("Cryo", "Burst", 2.86)],
    );
    ayaka = ayaka.merge(optimalKqmc5ArtifactsStats(ayaka, rotation, 1.30));
    const dps = rotation.execute(ayaka) / 21.0;

    expect(dps).toBeGreaterThan(0);
    expect(Number.isFinite(dps)).toBe(true);
  });
});

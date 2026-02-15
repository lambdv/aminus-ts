import { StatTable, Rotation } from "@/core/stat";
import { dmg_formula } from "@/core/formulas";
import { optimalKqmc5ArtifactsStats } from "@/core/optimizer";

describe("KQM Damage Calculation", () => {
  it("recreates the Rust Ayaka KQM damage flow", () => {
    let ayaka = new StatTable(
      ["BaseATK", 342 + 674], // Ayaka + Mistsplitter base ATK
      ["CritRate", 0.05],
      ["CritDMG", 0.5 + 0.441 + 0.384], // base + weapon + ascension
      ["ATKPercent", 0.88],
      ["CritRate", 0.55],
      ["CryoDMGBonus", 0.73],
      ["NormalATKDMGBonus", 0.3],
      ["ChargeATKDMGBonus", 0.3],
      ["CryoResistanceReduction", 0.4],
    );

    const rotation = new Rotation([
      ["n1", dmg_formula("Cryo", "Normal", 0.84)],  
      ["n2", dmg_formula("Cryo", "Normal", 0.894)],
      ["ca", dmg_formula("Cryo", "Charged", 3.039)],
      ["skill", dmg_formula("Cryo", "Skill", 4.07)],
      ["burstcuts", dmg_formula("Cryo", "Burst", 1.91)],
      ["burstexplosion", dmg_formula("Cryo", "Burst", 2.86)],
    ]);

    const optimizedArtifacts = optimalKqmc5ArtifactsStats(ayaka, rotation, 1.0);
    ayaka = ayaka.merge(optimizedArtifacts);

    const dps = rotation.execute(ayaka) / 21.0;

    console.log(`dps: ${dps}`);

    expect(
      optimizedArtifacts.get("CritRate") > 0 ||
        optimizedArtifacts.get("CritDMG") > 0 ||
        optimizedArtifacts.get("ATKPercent") > 0,
    ).toBe(true);
    expect(Number.isFinite(dps)).toBe(true);
    expect(dps).toBeGreaterThan(0);
  });
});

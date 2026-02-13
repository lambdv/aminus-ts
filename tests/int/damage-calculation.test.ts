import { StatTable, Rotation } from "@/core/stat";
import { calculate_damage } from "@/core/formulas";

describe("Damage Calculation Integration", () => {
  it("should calculate primitive character damage", () => {
    let diluc = new StatTable(
      ["BaseATK", 334.85],
      ["CritRate", 0.192 + 0.05],
      ["CritDMG", 0.5],
    );

    const weapon = new StatTable(
      ["BaseATK", 510.0],
      ["ElementalMastery", 165.0],
    );
    const artifacts = new StatTable(
      ["ATKPercent", 0.2],
      ["CritRate", 0.1],
      ["PyroDMGBonus", 0.15],
    ); // example artifact stats

    diluc = diluc.merge(weapon).merge(artifacts);

    const rotation = new Rotation([
      [
        "skill vape",
        (s) =>
          calculate_damage(
            "Pyro",
            "Skill",
            "ATK",
            "None",
            1.0,
            1.0,
            s,
            undefined,
          ),
      ],
    ]);

    const result = rotation.execute(diluc);
    expect(result).toBeCloseTo(598.614, 0);
  });
});

import { total_attack, avg_crit_multiplier } from "@/core/formulas";
import { StatTable } from "@/core/stat";

describe("Formula Tests", () => {
  it("should calculate total ATK correctly", () => {
    const base = 42.0;
    const flat = 100.0;
    const percentage = 1.2;
    const expected = base * (1.0 + percentage) + flat;

    const stats = new StatTable(
      ["BaseATK", base],
      ["ATKPercent", percentage],
      ["FlatATK", flat],
    );

    expect(total_attack(stats)).toBeCloseTo(expected, 5);
  });
  it("should calculate avg crit multiplier", () => {
    // Edge cases
    expect(
      avg_crit_multiplier(new StatTable(["CritRate", 0.0], ["CritDMG", 0.0])),
    ).toBe(1.0);
    expect(
      avg_crit_multiplier(new StatTable(["CritRate", 1.2], ["CritDMG", 1.0])),
    ).toBe(2.0); // capped at 100%
    expect(
      avg_crit_multiplier(new StatTable(["CritRate", 0.5], ["CritDMG", 1.0])),
    ).toBe(1.5);
  });
});

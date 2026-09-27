import { StatTable, Rotation } from "@/core/stat";
import { character_damage } from "@/core/formulas";

describe("Solo Calculation", () => {
  it("should calculate damage for a single character", () => {
    const x = new StatTable(["FlatATK", 100]);
    const r = new Rotation([
      ["hit", character_damage({ element: "Cryo", damageType: "Normal", motionValue: 1.0 })],
      ["hit", character_damage({ element: "Cryo", damageType: "Normal", motionValue: 1.5 })],
    ]);
    const dmg = r.execute(x);
    console.log(dmg);
  });
});
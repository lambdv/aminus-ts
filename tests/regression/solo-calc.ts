import { StatTable, Rotation } from "@/core/stat";
import { dmg_formula } from "@/core/formulas";

describe("Solo Calculation", () => {
  it("should calculate damage for a single character", () => {
    const x = new StatTable(["FlatATK", 100]);
    const r = new Rotation([
      dmg_formula("Cryo", "Normal", 1.0),
      dmg_formula("Cryo", "Normal", 1.5),
    ]);
    const dmg = r.execute(x);
    console.log(dmg);
  });
});
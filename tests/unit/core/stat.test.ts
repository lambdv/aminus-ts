import { StatType, StatTable, Rotation, compose } from "@/core/stat";
import { dmg_formula } from "@/core/formulas";

describe("StatTable", () => {
  it("should create a new StatTable", () => {
    const s = new StatTable();
    s.set("FlatHP", 100);
    expect(s.get("FlatHP")).toBe(100);
  });
  it("should sum the kv", () => {
    const s = new StatTable(["FlatATK", 50], ["FlatATK", 30]);
    expect(s.get("FlatATK")).toBe(80);
  });
  it("should add values to existing stats", () => {
    const s = new StatTable(["FlatATK", 50]);
    s.add("FlatATK", 25);
    expect(s.get("FlatATK")).toBe(75);
  });

  it("can deeply clone", () => {
    const s = new StatTable(["FlatATK", 50], ["FlatHP", 51]);
    const s2 = s.clone();
    expect(s).not.toBe(s2);
    expect(s.get("FlatATK")).toBe(s2.get("FlatATK"));
    expect(s.get("FlatHP")).toBe(s2.get("FlatHP"));
  });
});

describe("StatTable Basic Operations", () => {
  it("should start at 0 and accumulate values", () => {
    const table = new StatTable();
    expect(table.get("FlatATK")).toBe(0); // starts at 0
    table.add("FlatATK", 10.0);
    expect(table.get("FlatATK")).toBe(10.0);
    table.add("FlatATK", 10.0);
    expect(table.get("FlatATK")).toBe(20.0); // accumulates
  });
});

describe("Rotation", () => {
  it("should return sum of action results", () => {
    const rotation = new Rotation([
      ["test", (stats: StatTable) => stats.get("FlatATK")],
      ["test2", (stats: StatTable) => stats.get("FlatATK")],
    ]);

    const stats = new StatTable(["FlatATK", 1.6]);
    const result = rotation.execute(stats);

    expect(result).toBe(1.6 * 2.0);
  });
  it("should execute a rotation and compute total damage", () => {
    const x = default_stat_table_factory();
    const r = new Rotation([
      ["x", (s: StatTable) => (s.get("FlatATK") as number) * 1.0],
      ["x2", (s: StatTable) => (s.get("FlatATK") as number) * 1.5],
    ]);
    const dmg = r.execute(x);
    expect(dmg).toBe(1342.0 + 1342.0 * 1.5);
  });
  it("can do a real damage calc", () => {
    const x = default_stat_table_factory();
    const r = new Rotation([
      dmg_formula("Cryo", "Normal", 1.0),
      dmg_formula("Cryo", "Normal", 1.5),
    ]);
    const dmg = r.execute(x);

    const dmg2 = compose(
      dmg_formula("Cryo", "Normal", 1.0),
      dmg_formula("Cryo", "Normal", 1.5),
    )(x);

    expect(dmg).toBeCloseTo(dmg2);
  });
});

function default_stat_table_factory() {
  return new StatTable(
    // HP
    ["BaseHP", 100],
    ["HPPercent", 0.0992],
    ["FlatHP", 5287.88],

    // ATK
    ["BaseATK", 100],
    ["ATKPercent", 1.8822],
    ["FlatATK", 1342.0], // assumed unit-corrected

    // DEF
    ["BaseDEF", 100],
    ["DEFPercent", 0.124],
    ["FlatDEF", 3936.0],

    // Core combat stats
    ["ElementalMastery", 346.28],
    ["CritRate", 0.892],
    ["CritDMG", 1.678],
    ["EnergyRecharge", 1.1102],

    // Damage bonuses
    ["ElementalDMGBonus", 0.466],
    ["PhysicalDMGBonus", 0.0],
    ["NormalATKDMGBonus", 0.0],
    ["ChargeATKDMGBonus", 0.35],
    ["PlungeATKDMGBonus", 0.0],
    ["SkillDMGBonus", 0.0],
    ["BurstDMGBonus", 0.0],
  );
}

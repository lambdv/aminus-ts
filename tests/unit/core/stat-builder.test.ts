import { StatTableBuilder } from "@/core/stat-builder";
import { StatTable } from "@/core/stat";

describe("StatTableBuilder", () => {
  it("should build an empty StatTable", () => {
    const builder = new StatTableBuilder();
    const result = builder.build();
    expect(result).toEqual(new StatTable());
  });

  it("should add single stats", () => {
    const builder = new StatTableBuilder();
    builder.addStat("FlatATK", 100.0);
    const result = builder.build();
    expect(result.get("FlatATK")).toBe(100.0);
  });

  it("should accumulate stats when added multiple times", () => {
    const builder = new StatTableBuilder();
    builder.addStat("FlatATK", 100.0);
    builder.addStat("FlatATK", 100.0);
    const result = builder.build();
    expect(result.get("FlatATK")).toBe(200.0);
  });

  it("should add tables", () => {
    const builder = new StatTableBuilder();
    const other = new StatTable(["FlatATK", 100.0], ["FlatHP", 200.0]);
    builder.addTable(other);
    const result = builder.build();
    expect(result.get("FlatATK")).toBe(100.0);
    expect(result.get("FlatHP")).toBe(200.0);
  });

  it("should combine stats and tables", () => {
    const builder = new StatTableBuilder();
    builder.addStat("FlatATK", 100.0);
    const other = new StatTable(["FlatATK", 100.0], ["FlatHP", 200.0]);
    builder.addTable(other);
    const result = builder.build();
    expect(result.get("FlatATK")).toBe(200.0);
    expect(result.get("FlatHP")).toBe(200.0);
  });

  it("should be fluent", () => {
    const result = new StatTableBuilder()
      .addStat("FlatATK", 100.0)
      .addStat("FlatHP", 200.0)
      .build();
    expect(result.get("FlatATK")).toBe(100.0);
    expect(result.get("FlatHP")).toBe(200.0);
  });
});

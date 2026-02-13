import { StatTable, StatType } from "@/core/stat";
import {
  StatNode,
  BuffedStatNode,
  DependedBuffedStatNode,
  OpNode,
  Graph,
} from "@/engine/graph";

describe("Graph primitives", () => {
  it("StatNode should return the underlying StatTable", () => {
    const s = new StatTable(["FlatATK", 50]);
    const sn = new StatNode(s);
    expect(sn.eval()).toBe(s);
  });

  it("BuffedStatNode should merge buffs with the base stat node", () => {
    const base = new StatTable(["FlatATK", 100]);
    const buff = new StatTable(["FlatATK", 50]);
    const bn = new BuffedStatNode(new StatNode(base), buff);
    const merged = bn.eval();
    expect(merged.get("FlatATK")).toBe(150);
    // original base should remain unchanged
    expect(base.get("FlatATK")).toBe(100);
  });

  it("DependedBuffedStatNode should compute buffs based on another node", () => {
    const self = new StatTable(["FlatATK", 100]);

    const other = new StatTable(["BaseATK", 500]);
    const mapper = new Map<StatType, (s: StatTable) => number>();
    // add a constant FlatATK buff of 10 based on other
    mapper.set("FlatATK", (s: StatTable) => s.get("BaseATK") * 1.6);

    const dbn = new DependedBuffedStatNode(
      new StatNode(self),
      new StatNode(other),
      mapper,
    );

    const result = dbn.eval();
    expect(result.get("FlatATK")).toBe(900);
  });

  it("OpNode should evaluate the provided damage compute against its StatNode", () => {
    const s = new StatTable(["FlatATK", 60]);
    const sn = new StatNode(s);
    const op = new OpNode(sn, (t) => t.get("FlatATK") * 2);
    expect(op.eval()).toBe(120);
  });

  it("Graph.execute should sum damages per StatNode", () => {
    const s = new StatTable(["FlatATK", 50]);
    const sn = new StatNode(s);
    const op1 = new OpNode(sn, () => 10);
    const op2 = new OpNode(sn, () => 5);
    const g = new Graph();
    g.ops.push(op1, op2);
    const res = g.execute();
    expect(res.get(sn)).toBe(15);
  });
});

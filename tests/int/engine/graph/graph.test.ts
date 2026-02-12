import { StatTable } from "../../../src/models/stat";
import { dmg_formula } from "../../../src/models/formulas";
import { StatNode, OpNode, Graph } from "../../../src/engine/graph";

describe("Graph integration (dmg_formula)", () => {
  it("computes damage for a single StatNode using dmg_formula", () => {
    const base = new StatTable(["BaseATK", 100]);
    const sn = new StatNode(base);
    const compute = dmg_formula("Pyro", "Skill", 1.0);

    const op = new OpNode(sn, compute);
    const g = new Graph();
    g.ops.push(op);

    const res = g.execute();
    const expected = op.eval();

    expect(res.get(sn)!).toBeCloseTo(expected, 6);
    expect(res.get(sn)!).toBeGreaterThan(0);
  });

  it("accumulates damage from multiple ops targeting the same StatNode", () => {
    const base = new StatTable(["BaseATK", 120]);
    const sn = new StatNode(base);
    const compute = dmg_formula("Pyro", "Skill", 1.0);

    const op1 = new OpNode(sn, compute);
    const op2 = new OpNode(sn, compute);

    const g = new Graph();
    g.ops.push(op1, op2);

    const res = g.execute();
    const expected = op1.eval() + op2.eval();

    expect(res.get(sn)!).toBeCloseTo(expected, 6);
  });

  it("computes damage independently for multiple StatNodes", () => {
    const s1 = new StatTable(["BaseATK", 100]);
    const s2 = new StatTable(["BaseATK", 200]);
    const sn1 = new StatNode(s1);
    const sn2 = new StatNode(s2);

    const compute = dmg_formula("Pyro", "Skill", 1.0);

    const op1 = new OpNode(sn1, compute);
    const op2 = new OpNode(sn2, compute);

    const g = new Graph();
    g.ops.push(op1, op2);

    const res = g.execute();

    expect(res.get(sn1)!).toBeCloseTo(op1.eval(), 6);
    expect(res.get(sn2)!).toBeCloseTo(op2.eval(), 6);
    expect(res.get(sn2)!).toBeGreaterThan(res.get(sn1)!);
  });
});

/**
 * If you only change three things:

 Introduce EvalContext with cache

 Introduce Cell<T> abstraction

 Split stats into per-stat cells
 */

import {
  StatType,
  StatTable,
  Rotation,
  compose,
  DamageCompute,
} from "../core/stat.js";
import { dmg_formula } from "../core/formulas.js";

interface Node {
  eval(): StatTable;
}

class StatNode implements Node {
  s: StatTable;
  constructor(s: StatTable) {
    this.s = s;
  }
  eval(): StatTable {
    return this.s;
  }
}

class BuffedStatNode implements Node {
  sn: StatNode;
  buffs: StatTable;
  constructor(sn: StatNode, buffs: StatTable) {
    this.sn = sn;
    this.buffs = buffs;
  }
  eval(): StatTable {
    return this.sn.eval().merge(this.buffs);
  }
}

class DependedBuffedStatNode implements Node {
  self: StatNode;
  mapper: Map<StatType, (s: StatTable) => number>;
  other: StatNode;
  constructor(
    self: StatNode,
    other: StatNode,
    mapper: Map<StatType, (s: StatTable) => number>,
  ) {
    this.self = self;
    this.other = other;
    this.mapper = mapper;
  }
  eval(): StatTable {
    let buffs = new StatTable();
    for (let [k, v] of this.mapper) {
      buffs.set(k, v(this.other.eval()));
    }
    return this.self.eval().merge(buffs);
  }
}

class OpNode {
  s: StatNode;
  op: DamageCompute; //should be non-closure function like rust Fn trait but can't be, lets just assume that it is
  constructor(s: StatNode, op: DamageCompute) {
    this.s = s;
    this.op = op;
  }
  eval(): number {
    return this.op(this.s.eval());
  }
}

class Graph {
  nodes: Node[] = [];
  ops: OpNode[] = [];

  execute() {
    let res = new Map<StatNode, number>();
    for (let op of this.ops) {
      let dmg = op.eval();
      res.set(op.s, (res.get(op.s) || 0) + dmg);
    }
    return res;
  }
}

export {
  Node,
  StatNode,
  BuffedStatNode,
  DependedBuffedStatNode,
  OpNode,
  Graph,
};

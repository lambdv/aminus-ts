You already have ≈70% of an Excel-style engine.

What you are missing are not more node types, but spreadsheet-engine primitives:

Identity & addressing

Dependency awareness

Memoization

Cycle detection

Separation of inputs vs derived

Recompute control

I’ll map this concretely.

1. Missing Concept: Inputs vs Formula Cells

Excel distinguishes:

Literal cell: 42

Formula cell: =A1+B1

Your StatNode currently mixes both.

Introduce:

interface Cell<T> {
  eval(ctx: EvalContext): T;
}

Then:

class InputCell<T> implements Cell<T> {
  constructor(public value: T) {}
  eval() { return this.value; }
}


class FormulaCell<T> implements Cell<T> {
  constructor(
    public deps: Cell<any>[],
    public f: (...xs:any[]) => T
  ) {}
  eval(ctx: EvalContext) {
    return ctx.compute(this, () =>
      this.f(...this.deps.map(d => d.eval(ctx)))
    );
  }
}

Your current nodes are specialized FormulaCell<StatTable>.

2. Missing: Evaluation Context (Memoization)

Excel never recomputes the same cell twice per pass.

You need:

class EvalContext {
  cache = new Map<Cell<any>, any>();


  compute<T>(c: Cell<T>, f: ()=>T): T {
    if (this.cache.has(c)) return this.cache.get(c);
    const v = f();
    this.cache.set(c, v);
    return v;
  }
}

Without this, graph size explodes with realistic buff layering.

3. Missing: Identity / Addressing

Excel can say:

TotalATK depends on BaseATK, ATKPct, FlatATK

Your nodes are anonymous.

Add:

interface Cell<T> {
  id: string;
}

This enables:

Debugging

Serialization

Graph inspection

Cycle reporting

4. Missing: Cycle Detection

Excel refuses:

A1 = B1
B1 = A1

Add stack tracking:

class EvalContext {
  stack = new Set<Cell<any>>();


  compute<T>(c: Cell<T>, f: ()=>T): T {
    if (this.stack.has(c)) {
      throw new Error("Cycle at " + c.id);
    }
    if (this.cache.has(c)) return this.cache.get(c);


    this.stack.add(c);
    const v = f();
    this.stack.delete(c);
    this.cache.set(c, v);
    return v;
  }
}
5. Missing: Fine-Grained Cells (You Use Big Blobs)

Right now:

Node → StatTable

Excel-style is:

Cell<number> per stat

Example:

BaseATK: Cell<number>
ATKPct: Cell<number>
FlatATK: Cell<number>
TotalATK: FormulaCell<number>

StatTable should become a view, not the fundamental unit.

Otherwise you lose dependency precision.

6. Missing: Deterministic Formula Nodes Instead of Closures

You noted this already.

Instead of:

(s: StatTable) => number

Use:

enum FormulaOp {
  Add,
  Mul,
  TotalATK,
  Damage
}

And:

class FormulaCell<T> {
  op: FormulaOp;
  deps: Cell<any>[];
}

This mirrors Excel’s internal representation.

7. Missing: Rebuild vs Re-eval Boundary

Excel workflow:

Build graph once

Change inputs

Re-eval

You currently rebuild nodes each time.

Add:

graph.build()
graph.evaluate()
graph.updateInput("BaseATK", 900)
graph.evaluate()
8. Missing: Dirty Propagation (Optional)

For performance:

Track which inputs changed → mark downstream cells dirty.

Not required initially, but Excel has this.

9. Missing: Separation Between Stat Graph and Damage Graph

Excel sheets:

Stats Sheet
Damage Sheet

You currently mix both.

Better:

Stat Cells → Derived Stat Cells → Damage Cells
10. Mapping Your Current Classes
Your Class	Excel Equivalent
StatNode	InputCell<StatTable>
BuffedStatNode	FormulaCell<StatTable>
DependedBuffedStatNode	FormulaCell<StatTable>
OpNode	FormulaCell<number>
graph	Workbook

So your architecture is conceptually correct.

It is just too coarse-grained and lacks engine infrastructure.

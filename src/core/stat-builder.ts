import { StatTable, StatType } from "./stat";

export class StatTableBuilder {
  private table: StatTable = new StatTable();

  addStat(stat: StatType, value: number): this {
    this.table.add(stat, value);
    return this;
  }

  addTable(other: StatTable): this {
    for (const [stat, value] of other) {
      this.table.add(stat, value);
    }
    return this;
  }

  build(): StatTable {
    return this.table.clone();
  }
}

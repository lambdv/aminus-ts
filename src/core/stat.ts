export const STAT_TYPES = [
  "BaseHP",
  "FlatHP",
  "HPPercent",
  "BaseATK",
  "FlatATK",
  "ATKPercent",
  "BaseDEF",
  "FlatDEF",
  "DEFPercent",
  "ElementalMastery",
  "CritRate",
  "CritDMG",
  "EnergyRecharge",
  "DMGBonus",
  "ElementalDMGBonus",
  "PyroDMGBonus",
  "CryoDMGBonus",
  "GeoDMGBonus",
  "DendroDMGBonus",
  "ElectroDMGBonus",
  "HydroDMGBonus",
  "AnemoDMGBonus",
  "PhysicalDMGBonus",
  "NormalATKDMGBonus",
  "ChargeATKDMGBonus",
  "PlungeATKDMGBonus",
  "SkillDMGBonus",
  "BurstDMGBonus",
  "HealingBonus",
  "None",
  "ReactionBonus",
  "DefReduction",
  "DefIgnore",
  "PyroResistanceReduction",
  "HydroResistanceReduction",
  "ElectroResistanceReduction",
  "CryoResistanceReduction",
  "AnemoResistanceReduction",
  "GeoResistanceReduction",
  "DendroResistanceReduction",
  "PhysicalResistanceReduction",
] as const;

type StatType = (typeof STAT_TYPES)[number];

type DamageType =
  | "Normal"
  | "Charged"
  | "Plunging"
  | "Skill"
  | "Burst"
  | "None";

type Element =
  | "Pyro"
  | "Hydro"
  | "Electro"
  | "Anemo"
  | "Geo"
  | "Dendro"
  | "Cryo"
  | "Physical"
  | "None";

type BaseScaling = "ATK" | "DEF" | "HP" | "BaseATK" | "EM";

class StatTable extends Map<StatType, number> {
  constructor(...kv: [StatType, number][]) {
    super();
    for (let [key, value] of kv) {
      this.add(key, value);
    }
  }
  get(key: StatType): number {
    return super.get(key) ?? 0;
  }
  set(key: StatType, value: number) {
    return super.set(key, value);
  }
  add(key: StatType, value: number) {
    super.set(key, value + (super.get(key) || 0));
  }
  clone() {
    return new StatTable(...this);
  }
  merge(other: StatTable): StatTable {
    const sum = new StatTable();
    for (const stat of STAT_TYPES) sum.set(stat, this.get(stat) + other.get(stat));
    return sum;
  }
}

type DamageCompute = (s: StatTable) => number;

const compose = (...funcs: DamageCompute[]): DamageCompute => {
  return (s: StatTable) => funcs.reduce((acc, fn) => acc + fn(s), 0);
};

class Rotation {
  constructor(public actions: [string, DamageCompute][]) {}
  add(action: [string, DamageCompute]) {
    this.actions.push(action);
  }
  execute(s: StatTable) {
    let total = 0;
    for (let [_, compute] of this.actions) {
      total += compute(s);
    }
    return total;
  }
}

export {
  StatTable,
  StatType,
  DamageType,
  Element,
  BaseScaling,
  DamageCompute,
  Rotation,
  compose,
};

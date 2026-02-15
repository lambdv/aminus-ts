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

type StatValue = [StatType, number];

type Debuff =
  | "DefReduction"
  | "DefIgnore"
  | "PyroResistanceReduction"
  | "HydroResistanceReduction"
  | "ElectroResistanceReduction"
  | "CryoResistanceReduction"
  | "AnemoResistanceReduction"
  | "GeoResistanceReduction"
  | "DendroResistanceReduction"
  | "PhysicalResistanceReduction";

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

type BaseScaling = "ATK" | "DEF" | "HP";

type Amplifier = "Forward" | "Reverse" | "None";

const amplifierMultiplier = (amplifier: Amplifier): number => {
  const multipliers = {
    Forward: 2.0,
    Reverse: 1.5,
    None: 1.0,
  } as const;
  return multipliers[amplifier];
};

type ReactionType =
  | "Overloaded"
  | "Superconduct"
  | "Electrocharged"
  | "Swirl"
  | "Shattered"
  | "Aggravate"
  | "Spread";

const isElementalDmgBonus = (stat: StatType): boolean => {
  return (
    stat === "PyroDMGBonus" ||
    stat === "CryoDMGBonus" ||
    stat === "GeoDMGBonus" ||
    stat === "DendroDMGBonus" ||
    stat === "ElectroDMGBonus" ||
    stat === "HydroDMGBonus" ||
    stat === "AnemoDMGBonus"
  );
};

const statFromString = (name: string): StatType | null => {
  const normalized = name.toLowerCase().replace(/[^a-z%]/g, "");
  const mapping: Record<string, StatType> = {
    basehp: "BaseHP",
    flathp: "FlatHP",
    hppercent: "HPPercent",
    hp: "HPPercent",
    baseatk: "BaseATK",
    flatatk: "FlatATK",
    atkpercent: "ATKPercent",
    atk: "ATKPercent",
    basedef: "BaseDEF",
    flatdef: "FlatDEF",
    defpercent: "DEFPercent",
    def: "DEFPercent",
    elementalmastery: "ElementalMastery",
    em: "ElementalMastery",
    critrate: "CritRate",
    cr: "CritRate",
    critdmg: "CritDMG",
    cd: "CritDMG",
    energyrecharge: "EnergyRecharge",
    er: "EnergyRecharge",
    dmgbonus: "DMGBonus",
    elementaldmgbonus: "ElementalDMGBonus",
    elementaldmg: "ElementalDMGBonus",
    pyrodmgbonus: "PyroDMGBonus",
    cryodmgbonus: "CryoDMGBonus",
    geodmgbonus: "GeoDMGBonus",
    dendrodmgbonus: "DendroDMGBonus",
    electrodmgbonus: "ElectroDMGBonus",
    hydrodmgbonus: "HydroDMGBonus",
    anemodmgbonus: "AnemoDMGBonus",
    physicaldmgbonus: "PhysicalDMGBonus",
    physicaldmg: "PhysicalDMGBonus",
    normalatkdmgbonus: "NormalATKDMGBonus",
    chargeatkdmgbonus: "ChargeATKDMGBonus",
    plungeatkdmgbonus: "PlungeATKDMGBonus",
    skilldmgbonus: "SkillDMGBonus",
    burstdmgbonus: "BurstDMGBonus",
    healingbonus: "HealingBonus",
    hb: "HealingBonus",
    none: "None",
    n: "None",
    reactionbonus: "ReactionBonus",
    defreduction: "DefReduction",
    defignore: "DefIgnore",
    pyroresistancereduction: "PyroResistanceReduction",
    hydroresistancereduction: "HydroResistanceReduction",
    electroresistancereduction: "ElectroResistanceReduction",
    cryoresistancereduction: "CryoResistanceReduction",
    anemoresistancereduction: "AnemoResistanceReduction",
    georesistancereduction: "GeoResistanceReduction",
    dendroresistancereduction: "DendroResistanceReduction",
    physicalresistancereduction: "PhysicalResistanceReduction",
    physicaldmgpercent: "PhysicalDMGBonus",
  };
  return mapping[normalized] ?? null;
};

class StatTable extends Map<StatType, number> {
  constructor(...kv: [StatType, number][]) {
    super();
    for (let [key, value] of kv) {
      this.add(key, value);
    }
  }
  get(key: StatType): number {
    return super.get(key) || 0;
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
    let sum = new StatTable();
    STAT_TYPES.map((s) => {
      sum.set(s, this.get(s) + other.get(s));
    });
    return sum;
  }
}

type DamageCompute = (s: StatTable) => number;

const compose = (...funcs: DamageCompute[]): DamageCompute => {
  return (s: StatTable) => funcs.reduce((acc, fn) => acc + fn(s), 0);
};

class Rotation {
  actions: [string, DamageCompute][] = [];
  constructor(actions: ([string, DamageCompute] | DamageCompute)[]);
  constructor(...actions: ([string, DamageCompute] | DamageCompute)[]);
  constructor(
    ...args: [([string, DamageCompute] | DamageCompute)[]] | ([string, DamageCompute] | DamageCompute)[]
  ) {
    // Support both `new Rotation([...])` and `new Rotation(a, b, c)`.
    const first = args[0] as unknown;
    const isSingleArrayArg = args.length === 1 && Array.isArray(first);
    const normalized = isSingleArrayArg
      ? (first as ([string, DamageCompute] | DamageCompute)[])
      : (args as ([string, DamageCompute] | DamageCompute)[]);

    if (normalized.length > 0 && typeof normalized[0] === "function") {
      for (let compute of normalized as DamageCompute[]) {
        this.actions.push(["", compute]);
      }
    } else {
      this.actions = normalized as [string, DamageCompute][];
    }
  }
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
  StatValue,
  Debuff,
  DamageType,
  Element,
  BaseScaling,
  Amplifier,
  amplifierMultiplier,
  ReactionType,
  isElementalDmgBonus,
  statFromString,
  DamageCompute,
  Rotation,
  compose,
};

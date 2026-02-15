/**
 * Frozen wiki snapshot: Substat Distributions and Values
 * Source: Genshin Impact Wiki - Artifacts/Scaling
 * Snapshot date: February 15, 2026
 */

export type StatType = (typeof import("@/core/stat").STAT_TYPES)[number];

export interface SubstatWeight {
  stat: StatType;
  weight: number;
}

export interface SubstatWeightTable {
  [slot: string]: {
    [mainStat: string]: SubstatWeight[];
  };
}

// Substat weights per slot and main stat (dependent on main stat for sands/goblet/circlet)
export const SUBSTAT_WEIGHTS: SubstatWeightTable = {
  flower: {
    FlatHP: [
      { stat: "FlatATK", weight: 578 },
      { stat: "FlatDEF", weight: 578 },
      { stat: "HPPercent", weight: 432 },
      { stat: "ATKPercent", weight: 432 },
      { stat: "DEFPercent", weight: 432 },
      { stat: "EnergyRecharge", weight: 432 },
      { stat: "ElementalMastery", weight: 432 },
      { stat: "CritRate", weight: 342 },
      { stat: "CritDMG", weight: 342 },
    ],
  },
  feather: {
    FlatATK: [
      { stat: "FlatHP", weight: 578 },
      { stat: "FlatDEF", weight: 578 },
      { stat: "HPPercent", weight: 432 },
      { stat: "ATKPercent", weight: 432 },
      { stat: "DEFPercent", weight: 432 },
      { stat: "EnergyRecharge", weight: 432 },
      { stat: "ElementalMastery", weight: 432 },
      { stat: "CritRate", weight: 342 },
      { stat: "CritDMG", weight: 342 },
    ],
  },
  sands: {
    HPPercent: [
      { stat: "FlatHP", weight: 560 },
      { stat: "FlatATK", weight: 560 },
      { stat: "FlatDEF", weight: 560 },
      { stat: "ATKPercent", weight: 0 },
      { stat: "DEFPercent", weight: 416 },
      { stat: "ElementalMastery", weight: 416 },
      { stat: "EnergyRecharge", weight: 416 },
      { stat: "CritRate", weight: 328 },
      { stat: "CritDMG", weight: 328 },
    ],
    ATKPercent: [
      { stat: "FlatHP", weight: 560 },
      { stat: "FlatATK", weight: 560 },
      { stat: "FlatDEF", weight: 560 },
      { stat: "HPPercent", weight: 416 },
      { stat: "DEFPercent", weight: 416 },
      { stat: "ElementalMastery", weight: 416 },
      { stat: "EnergyRecharge", weight: 416 },
      { stat: "CritRate", weight: 328 },
      { stat: "CritDMG", weight: 328 },
    ],
    DEFPercent: [
      { stat: "FlatHP", weight: 560 },
      { stat: "FlatATK", weight: 560 },
      { stat: "FlatDEF", weight: 560 },
      { stat: "HPPercent", weight: 416 },
      { stat: "ATKPercent", weight: 416 },
      { stat: "ElementalMastery", weight: 416 },
      { stat: "EnergyRecharge", weight: 416 },
      { stat: "CritRate", weight: 328 },
      { stat: "CritDMG", weight: 328 },
    ],
    ElementalMastery: [
      { stat: "FlatHP", weight: 560 },
      { stat: "FlatATK", weight: 560 },
      { stat: "FlatDEF", weight: 560 },
      { stat: "HPPercent", weight: 416 },
      { stat: "ATKPercent", weight: 416 },
      { stat: "DEFPercent", weight: 416 },
      { stat: "EnergyRecharge", weight: 416 },
      { stat: "CritRate", weight: 328 },
      { stat: "CritDMG", weight: 328 },
    ],
    EnergyRecharge: [
      { stat: "FlatHP", weight: 560 },
      { stat: "FlatATK", weight: 560 },
      { stat: "FlatDEF", weight: 560 },
      { stat: "HPPercent", weight: 416 },
      { stat: "ATKPercent", weight: 416 },
      { stat: "DEFPercent", weight: 416 },
      { stat: "ElementalMastery", weight: 416 },
      { stat: "CritRate", weight: 328 },
      { stat: "CritDMG", weight: 328 },
    ],
  },
  goblet: {
    HPPercent: [
      { stat: "FlatHP", weight: 560 },
      { stat: "FlatATK", weight: 560 },
      { stat: "FlatDEF", weight: 560 },
      { stat: "ATKPercent", weight: 416 },
      { stat: "DEFPercent", weight: 416 },
      { stat: "ElementalMastery", weight: 416 },
      { stat: "EnergyRecharge", weight: 416 },
      { stat: "CritRate", weight: 328 },
      { stat: "CritDMG", weight: 328 },
    ],
    ATKPercent: [
      { stat: "FlatHP", weight: 560 },
      { stat: "FlatATK", weight: 560 },
      { stat: "FlatDEF", weight: 560 },
      { stat: "HPPercent", weight: 416 },
      { stat: "DEFPercent", weight: 416 },
      { stat: "ElementalMastery", weight: 416 },
      { stat: "EnergyRecharge", weight: 416 },
      { stat: "CritRate", weight: 328 },
      { stat: "CritDMG", weight: 328 },
    ],
    DEFPercent: [
      { stat: "FlatHP", weight: 560 },
      { stat: "FlatATK", weight: 560 },
      { stat: "FlatDEF", weight: 560 },
      { stat: "HPPercent", weight: 416 },
      { stat: "ATKPercent", weight: 416 },
      { stat: "ElementalMastery", weight: 416 },
      { stat: "EnergyRecharge", weight: 416 },
      { stat: "CritRate", weight: 328 },
      { stat: "CritDMG", weight: 328 },
    ],
    ElementalMastery: [
      { stat: "FlatHP", weight: 560 },
      { stat: "FlatATK", weight: 560 },
      { stat: "FlatDEF", weight: 560 },
      { stat: "HPPercent", weight: 416 },
      { stat: "ATKPercent", weight: 416 },
      { stat: "DEFPercent", weight: 416 },
      { stat: "EnergyRecharge", weight: 416 },
      { stat: "CritRate", weight: 328 },
      { stat: "CritDMG", weight: 328 },
    ],
    PyroDMGBonus: [
      { stat: "FlatHP", weight: 512 },
      { stat: "FlatATK", weight: 512 },
      { stat: "FlatDEF", weight: 512 },
      { stat: "HPPercent", weight: 375 },
      { stat: "ATKPercent", weight: 375 },
      { stat: "DEFPercent", weight: 375 },
      { stat: "ElementalMastery", weight: 375 },
      { stat: "EnergyRecharge", weight: 375 },
      { stat: "CritRate", weight: 294 },
      { stat: "CritDMG", weight: 294 },
    ],
    ElectroDMGBonus: [
      { stat: "FlatHP", weight: 512 },
      { stat: "FlatATK", weight: 512 },
      { stat: "FlatDEF", weight: 512 },
      { stat: "HPPercent", weight: 375 },
      { stat: "ATKPercent", weight: 375 },
      { stat: "DEFPercent", weight: 375 },
      { stat: "ElementalMastery", weight: 375 },
      { stat: "EnergyRecharge", weight: 375 },
      { stat: "CritRate", weight: 294 },
      { stat: "CritDMG", weight: 294 },
    ],
    CryoDMGBonus: [
      { stat: "FlatHP", weight: 512 },
      { stat: "FlatATK", weight: 512 },
      { stat: "FlatDEF", weight: 512 },
      { stat: "HPPercent", weight: 375 },
      { stat: "ATKPercent", weight: 375 },
      { stat: "DEFPercent", weight: 375 },
      { stat: "ElementalMastery", weight: 375 },
      { stat: "EnergyRecharge", weight: 375 },
      { stat: "CritRate", weight: 294 },
      { stat: "CritDMG", weight: 294 },
    ],
    HydroDMGBonus: [
      { stat: "FlatHP", weight: 512 },
      { stat: "FlatATK", weight: 512 },
      { stat: "FlatDEF", weight: 512 },
      { stat: "HPPercent", weight: 375 },
      { stat: "ATKPercent", weight: 375 },
      { stat: "DEFPercent", weight: 375 },
      { stat: "ElementalMastery", weight: 375 },
      { stat: "EnergyRecharge", weight: 375 },
      { stat: "CritRate", weight: 294 },
      { stat: "CritDMG", weight: 294 },
    ],
    DendroDMGBonus: [
      { stat: "FlatHP", weight: 512 },
      { stat: "FlatATK", weight: 512 },
      { stat: "FlatDEF", weight: 512 },
      { stat: "HPPercent", weight: 375 },
      { stat: "ATKPercent", weight: 375 },
      { stat: "DEFPercent", weight: 375 },
      { stat: "ElementalMastery", weight: 375 },
      { stat: "EnergyRecharge", weight: 375 },
      { stat: "CritRate", weight: 294 },
      { stat: "CritDMG", weight: 294 },
    ],
    AnemoDMGBonus: [
      { stat: "FlatHP", weight: 512 },
      { stat: "FlatATK", weight: 512 },
      { stat: "FlatDEF", weight: 512 },
      { stat: "HPPercent", weight: 375 },
      { stat: "ATKPercent", weight: 375 },
      { stat: "DEFPercent", weight: 375 },
      { stat: "ElementalMastery", weight: 375 },
      { stat: "EnergyRecharge", weight: 375 },
      { stat: "CritRate", weight: 294 },
      { stat: "CritDMG", weight: 294 },
    ],
    GeoDMGBonus: [
      { stat: "FlatHP", weight: 512 },
      { stat: "FlatATK", weight: 512 },
      { stat: "FlatDEF", weight: 512 },
      { stat: "HPPercent", weight: 375 },
      { stat: "ATKPercent", weight: 375 },
      { stat: "DEFPercent", weight: 375 },
      { stat: "ElementalMastery", weight: 375 },
      { stat: "EnergyRecharge", weight: 375 },
      { stat: "CritRate", weight: 294 },
      { stat: "CritDMG", weight: 294 },
    ],
    PhysicalDMGBonus: [
      { stat: "FlatHP", weight: 512 },
      { stat: "FlatATK", weight: 512 },
      { stat: "FlatDEF", weight: 512 },
      { stat: "HPPercent", weight: 375 },
      { stat: "ATKPercent", weight: 375 },
      { stat: "DEFPercent", weight: 375 },
      { stat: "ElementalMastery", weight: 375 },
      { stat: "EnergyRecharge", weight: 375 },
      { stat: "CritRate", weight: 294 },
      { stat: "CritDMG", weight: 294 },
    ],
  },
  circlet: {
    HPPercent: [
      { stat: "FlatHP", weight: 560 },
      { stat: "FlatATK", weight: 560 },
      { stat: "FlatDEF", weight: 560 },
      { stat: "ATKPercent", weight: 407 },
      { stat: "DEFPercent", weight: 407 },
      { stat: "ElementalMastery", weight: 407 },
      { stat: "EnergyRecharge", weight: 407 },
      { stat: "CritRate", weight: 320 },
      { stat: "CritDMG", weight: 320 },
      { stat: "HealingBonus", weight: 294 },
    ],
    ATKPercent: [
      { stat: "FlatHP", weight: 560 },
      { stat: "FlatATK", weight: 560 },
      { stat: "FlatDEF", weight: 560 },
      { stat: "HPPercent", weight: 407 },
      { stat: "DEFPercent", weight: 407 },
      { stat: "ElementalMastery", weight: 407 },
      { stat: "EnergyRecharge", weight: 407 },
      { stat: "CritRate", weight: 320 },
      { stat: "CritDMG", weight: 320 },
      { stat: "HealingBonus", weight: 294 },
    ],
    DEFPercent: [
      { stat: "FlatHP", weight: 560 },
      { stat: "FlatATK", weight: 560 },
      { stat: "FlatDEF", weight: 560 },
      { stat: "HPPercent", weight: 407 },
      { stat: "ATKPercent", weight: 407 },
      { stat: "ElementalMastery", weight: 407 },
      { stat: "EnergyRecharge", weight: 407 },
      { stat: "CritRate", weight: 320 },
      { stat: "CritDMG", weight: 320 },
      { stat: "HealingBonus", weight: 294 },
    ],
    ElementalMastery: [
      { stat: "FlatHP", weight: 560 },
      { stat: "FlatATK", weight: 560 },
      { stat: "FlatDEF", weight: 560 },
      { stat: "HPPercent", weight: 407 },
      { stat: "ATKPercent", weight: 407 },
      { stat: "DEFPercent", weight: 407 },
      { stat: "EnergyRecharge", weight: 407 },
      { stat: "CritRate", weight: 320 },
      { stat: "CritDMG", weight: 320 },
      { stat: "HealingBonus", weight: 294 },
    ],
    CritRate: [
      { stat: "FlatHP", weight: 549 },
      { stat: "FlatATK", weight: 549 },
      { stat: "FlatDEF", weight: 549 },
      { stat: "HPPercent", weight: 407 },
      { stat: "ATKPercent", weight: 407 },
      { stat: "DEFPercent", weight: 407 },
      { stat: "ElementalMastery", weight: 407 },
      { stat: "EnergyRecharge", weight: 407 },
      { stat: "CritDMG", weight: 320 },
      { stat: "HealingBonus", weight: 294 },
    ],
    CritDMG: [
      { stat: "FlatHP", weight: 549 },
      { stat: "FlatATK", weight: 549 },
      { stat: "FlatDEF", weight: 549 },
      { stat: "HPPercent", weight: 407 },
      { stat: "ATKPercent", weight: 407 },
      { stat: "DEFPercent", weight: 407 },
      { stat: "ElementalMastery", weight: 407 },
      { stat: "EnergyRecharge", weight: 407 },
      { stat: "CritRate", weight: 320 },
      { stat: "HealingBonus", weight: 294 },
    ],
    HealingBonus: [
      { stat: "FlatHP", weight: 512 },
      { stat: "FlatATK", weight: 512 },
      { stat: "FlatDEF", weight: 512 },
      { stat: "HPPercent", weight: 375 },
      { stat: "ATKPercent", weight: 375 },
      { stat: "DEFPercent", weight: 375 },
      { stat: "ElementalMastery", weight: 375 },
      { stat: "EnergyRecharge", weight: 375 },
      { stat: "CritRate", weight: 294 },
      { stat: "CritDMG", weight: 294 },
    ],
  },
};

// Substat roll tier values (4 tiers per rarity: 1.0, 0.9, 0.8, 0.7)
export interface SubstatRollTiers {
  [rarity: number]: {
    [stat: string]: [number, number, number, number]; // [max, high, mid, low]
  };
}

export const SUBSTAT_ROLL_TIERS: SubstatRollTiers = {
  5: {
    FlatHP: [298.75, 268.88, 239.00, 209.13],
    FlatATK: [19.45, 17.51, 15.56, 13.62],
    FlatDEF: [23.15, 20.83, 18.52, 16.20],
    HPPercent: [0.0583, 0.0525, 0.0466, 0.0408],
    ATKPercent: [0.0583, 0.0525, 0.0466, 0.0408],
    DEFPercent: [0.0729, 0.0656, 0.0583, 0.0510],
    ElementalMastery: [23.31, 20.98, 18.65, 16.32],
    EnergyRecharge: [0.0648, 0.0583, 0.0518, 0.0453],
    CritRate: [0.0389, 0.0350, 0.0311, 0.0272],
    CritDMG: [0.0777, 0.0699, 0.0622, 0.0544],
    HealingBonus: [0.0473, 0.0426, 0.0379, 0.0332],
  },
  4: {
    FlatHP: [239.00, 215.10, 191.20, 167.30],
    FlatATK: [15.56, 14.00, 12.45, 10.89],
    FlatDEF: [18.52, 16.67, 14.82, 12.96],
    HPPercent: [0.0466, 0.0420, 0.0373, 0.0326],
    ATKPercent: [0.0466, 0.0420, 0.0373, 0.0326],
    DEFPercent: [0.0583, 0.0525, 0.0466, 0.0408],
    ElementalMastery: [18.65, 16.79, 14.92, 13.06],
    EnergyRecharge: [0.0518, 0.0466, 0.0414, 0.0363],
    CritRate: [0.0311, 0.0280, 0.0249, 0.0218],
    CritDMG: [0.0622, 0.0560, 0.0497, 0.0435],
    HealingBonus: [0.0380, 0.0342, 0.0304, 0.0266],
  },
  3: {
    FlatHP: [143.40, 129.06, 114.72, 100.38],
    FlatATK: [9.34, 8.40, 7.47, 6.54],
    FlatDEF: [11.11, 10.00, 8.89, 7.78],
    HPPercent: [0.0350, 0.0315, 0.0280, 0.0245],
    ATKPercent: [0.0350, 0.0315, 0.0280, 0.0245],
    DEFPercent: [0.0437, 0.0393, 0.0350, 0.0306],
    ElementalMastery: [13.99, 12.59, 11.19, 9.79],
    EnergyRecharge: [0.0389, 0.0350, 0.0311, 0.0272],
    CritRate: [0.0233, 0.0210, 0.0186, 0.0163],
    CritDMG: [0.0466, 0.0420, 0.0373, 0.0326],
    HealingBonus: [0.0284, 0.0256, 0.0227, 0.0199],
  },
  2: {
    FlatHP: [71.70, 60.95, 50.19, 29.88],
    FlatATK: [4.67, 3.97, 3.27, 1.95],
    FlatDEF: [5.56, 4.72, 3.89, 2.31],
    HPPercent: [0.0198, 0.0168, 0.0138, 0.0082],
    ATKPercent: [0.0198, 0.0168, 0.0138, 0.0082],
    DEFPercent: [0.0246, 0.0209, 0.0172, 0.0102],
    ElementalMastery: [7.93, 6.74, 5.55, 3.31],
    EnergyRecharge: [0.0221, 0.0188, 0.0155, 0.0092],
    CritRate: [0.0132, 0.0112, 0.0092, 0.0055],
    CritDMG: [0.0264, 0.0224, 0.0185, 0.0110],
    HealingBonus: [0.0161, 0.0137, 0.0113, 0.0067],
  },
  1: {
    FlatHP: [29.88, 23.90, 0, 0],
    FlatATK: [1.95, 1.56, 0, 0],
    FlatDEF: [2.31, 1.85, 0, 0],
    HPPercent: [0.0082, 0.0066, 0, 0],
    ATKPercent: [0.0082, 0.0066, 0, 0],
    DEFPercent: [0.0102, 0.0082, 0, 0],
    ElementalMastery: [3.31, 2.65, 0, 0],
    EnergyRecharge: [0.0092, 0.0074, 0, 0],
    CritRate: [0.0055, 0.0044, 0, 0],
    CritDMG: [0.0110, 0.0088, 0, 0],
    HealingBonus: [0.0067, 0.0054, 0, 0],
  },
};

// Initial substat count distribution by rarity
export interface InitialSubstatCount {
  [rarity: number]: {
    [count: number]: number; // count -> probability
  };
}

export const INITIAL_SUBSTAT_COUNTS: InitialSubstatCount = {
  5: { 3: 0.8, 4: 0.2 },
  4: { 2: 0.8, 3: 0.2 },
  3: { 1: 0.8, 2: 0.2 },
  2: { 0: 0.8, 1: 0.2 },
  1: { 0: 1.0 },
};

// Upgrade behavior: every 4 levels, add-or-upgrade
export const UPGRADE_INTERVAL = 4;

// When adding a new substat, uniform selection from available pool
// When upgrading existing substat, uniform selection from current substats
export const UPGRADE_TARGET_UNIFORM = true;

// Roll tier selection probabilities (for initial and upgrade rolls)
export interface RollTierProbabilities {
  [rarity: number]: [number, number, number, number]; // [max, high, mid, low] probabilities
}

export const ROLL_TIER_PROBABILITIES: RollTierProbabilities = {
  5: [0.25, 0.25, 0.25, 0.25], // 3★/4★/5★: uniform 25% each
  4: [0.25, 0.25, 0.25, 0.25],
  3: [0.25, 0.25, 0.25, 0.25],
  2: [0.333, 0.333, 0.333, 0], // 2★: 33.3% each for max/high/mid, 0% for low
  1: [0.5, 0.5, 0, 0], // 1★: 50% each for max/high, 0% for mid/low
};

// Upgrade roll count distribution (when upgrading existing substat)
export interface UpgradeRollCount {
  [count: number]: number; // count -> probability
}

export const UPGRADE_ROLL_COUNTS: UpgradeRollCount = {
  0: 0.2373,
  1: 0.3955,
  2: 0.2637,
  3: 0.0879,
  4: 0.0146,
  5: 0.0010,
};
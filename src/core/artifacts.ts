import { StatType, StatTable, Rotation } from "./stat";

export type { ArtifactPiece };

type ArtifacType = "flower" | "feather" | "sands" | "goblet" | "circlet";

type Artifact = {
  type: ArtifacType;
  main_stat: StatType;
  level: number;
  rarity: number;
  substats?: StatTable;
};

export type ArtifactRollQuality = "MAX" | "HIGH" | "MID" | "LOW" | "AVG";

type ArtifactPiece = {
  rarity: number;
  level: number;
  stat_type: StatType;
};

/** returns multiplier for a given roll quality */
function rollQualityMultiplier(quality: ArtifactRollQuality): number {
  switch (quality) {
    case "MAX":
      return 1.0;
    case "HIGH":
      return 0.9;
    case "MID":
      return 0.8;
    case "LOW":
      return 0.7;
    case "AVG":
      return (1.0 + 0.9 + 0.8 + 0.7) / 4.0;
    default:
      return 1.0;
  }
}

/** returns max number of rolls for a given artifact piece */
function maxRollsFor(artifact: ArtifactPiece): number {
  const baseSubstats = artifact.rarity - 1;
  const upgrades = Math.floor(artifact.level / 4);
  return baseSubstats + upgrades;
}

/** returns max number of rolls for a given artifact piece and substat type */
function maxRollsForGiven(
  artifact: ArtifactPiece,
  substatType: StatType,
  worseCase: boolean = false,
): number {
  if (artifact.stat_type === substatType) return 0;
  const upgrades = Math.floor(artifact.level / 4);
  return worseCase ? upgrades : upgrades + 1;
}

function isValidSubstatType(statType: StatType): boolean {
  return POSSIBLE_SUB_STATS.includes(statType);
}

const validate_artifact_pieces = (
  flower?: ArtifactPiece,
  feather?: ArtifactPiece,
  sands?: ArtifactPiece,
  goblet?: ArtifactPiece,
  circlet?: ArtifactPiece,
) => {
  if (flower && flower.stat_type !== "FlatHP")
    throw new Error("Flower must have FlatHP main stat");
  if (feather && feather.stat_type !== "FlatATK")
    throw new Error("Feather must have FlatATK main stat");
  if (sands && !POSSIBLE_SANDS_STATS.includes(sands.stat_type))
    throw new Error("Invalid sands main stat");
  if (goblet && !POSSIBLE_GOBLET_STATS.includes(goblet.stat_type))
    throw new Error("Invalid goblet main stat");
  if (circlet && !POSSIBLE_CIRCLE_STATS.includes(circlet.stat_type))
    throw new Error("Invalid circlet main stat");
};

export class ArtifactBuilder {
  flower?: ArtifactPiece;
  feather?: ArtifactPiece;
  sands?: ArtifactPiece;
  goblet?: ArtifactPiece;
  circlet?: ArtifactPiece;
  rolls: Map<[StatType, ArtifactRollQuality, number], number> = new Map();
  constraints: Map<[StatType, number], number> = new Map();
  rollLimit?: number;
  //general constructor to building any set of artifacts
  constructor(
    flower?: ArtifactPiece,
    feather?: ArtifactPiece,
    sands?: ArtifactPiece,
    goblet?: ArtifactPiece,
    circlet?: ArtifactPiece,
  ) {
    validate_artifact_pieces(flower, feather, sands, goblet, circlet);
    this.flower = flower;
    this.feather = feather;
    this.sands = sands;
    this.goblet = goblet;
    this.circlet = circlet;
    this.initConstraints();
  }

  private initConstraints() {
    for (const stat of POSSIBLE_SUB_STATS) {
      const pieces = [
        this.flower,
        this.feather,
        this.sands,
        this.goblet,
        this.circlet,
      ].filter((p) => p !== undefined) as ArtifactPiece[];
      for (const piece of pieces) {
        if (piece.stat_type !== stat) {
          const key: [StatType, number] = [stat, piece.rarity];
          const current = this.constraints.get(key) || 0;
          this.constraints.set(key, current + maxRollsForGiven(piece, stat));
        }
      }
    }
  }
  static kqmc(
    flower?: ArtifactPiece,
    feather?: ArtifactPiece,
    sands?: ArtifactPiece,
    goblet?: ArtifactPiece,
    circlet?: ArtifactPiece,
  ): ArtifactBuilder {
    validate_artifact_pieces(flower, feather, sands, goblet, circlet);
    const pieces = [flower, feather, sands, goblet, circlet].filter(
      (p) => p !== undefined,
    ) as ArtifactPiece[];

    //validate
    for (const piece of pieces) {
      if (piece.rarity <= 3) {
        throw new Error("Rarity must be > 3");
      }
      if (
        !(
          (piece.level === 20 && piece.rarity === 5) ||
          (piece.level === 16 && piece.rarity === 4)
        )
      ) {
        throw new Error("Invalid level/rarity combination");
      }
    }

    const rarities = new Set(pieces.map((p) => p.rarity));
    const rollRarity =
      rarities.size === 1 ? [...rarities][0] : Math.max(...rarities);

    const builder = new ArtifactBuilder(
      flower,
      feather,
      sands,
      goblet,
      circlet,
    );

    // Initialize constraints for KQMC (2 rolls per substat per artifact)
    for (const stat of POSSIBLE_SUB_STATS) {
      for (const piece of pieces) {
        if (piece.stat_type !== stat) {
          const key: [StatType, number] = [stat, piece.rarity];
          builder.constraints.set(key, (builder.constraints.get(key) || 0) + 2);
        }
      }
    }

    const base = pieces.reduce((sum, p) => sum + maxRollsFor(p), 0);
    const penalty = pieces.length;
    builder.rollLimit = base - penalty;

    // Roll 2 of each substat at AVG quality and rollRarity
    for (const stat of POSSIBLE_SUB_STATS) {
      builder.roll(stat, "AVG", rollRarity, 2);
      const key: [StatType, number] = [stat, rollRarity];
      builder.constraints.set(key, (builder.constraints.get(key) || 0) + 2);
    }

    return builder;
  }

  static kqmAll5Star(
    sandsMain: StatType,
    gobletMain: StatType,
    circletMain: StatType,
  ): ArtifactBuilder {
    return ArtifactBuilder.kqmc(
      { rarity: 5, level: 20, stat_type: "FlatHP" },
      { rarity: 5, level: 20, stat_type: "FlatATK" },
      { rarity: 5, level: 20, stat_type: sandsMain },
      { rarity: 5, level: 20, stat_type: gobletMain },
      { rarity: 5, level: 20, stat_type: circletMain },
    );
  }

  static kqmAll4Star(
    sandsMain: StatType,
    gobletMain: StatType,
    circletMain: StatType,
  ): ArtifactBuilder {
    const builder = ArtifactBuilder.kqmc(
      { rarity: 4, level: 16, stat_type: "FlatHP" },
      { rarity: 4, level: 16, stat_type: "FlatATK" },
      { rarity: 4, level: 16, stat_type: sandsMain },
      { rarity: 4, level: 16, stat_type: gobletMain },
      { rarity: 4, level: 16, stat_type: circletMain },
    );

    for (const stat of POSSIBLE_SUB_STATS) {
      builder.unroll(stat, "AVG", 5, 2);
      builder.roll(stat, "AVG", 4, 2);
    }

    return builder;
  }

  static kqmAll4StarWith5Star(
    sandsMain: StatType,
    gobletMain: StatType,
    circletMain: StatType,
    fiveStarIndex: number,
  ): ArtifactBuilder {
    if (fiveStarIndex < 0 || fiveStarIndex > 2)
      throw new Error("Invalid five star index");

    let sandsPiece: ArtifactPiece = {
      rarity: 4,
      level: 16,
      stat_type: sandsMain,
    };
    let gobletPiece: ArtifactPiece = {
      rarity: 4,
      level: 16,
      stat_type: gobletMain,
    };
    let circletPiece: ArtifactPiece = {
      rarity: 4,
      level: 16,
      stat_type: circletMain,
    };

    switch (fiveStarIndex) {
      case 0:
        sandsPiece = { rarity: 5, level: 20, stat_type: sandsMain };
        break;
      case 1:
        gobletPiece = { rarity: 5, level: 20, stat_type: gobletMain };
        break;
      case 2:
        circletPiece = { rarity: 5, level: 20, stat_type: circletMain };
        break;
    }

    const builder = ArtifactBuilder.kqmc(
      { rarity: 4, level: 16, stat_type: "FlatHP" },
      { rarity: 4, level: 16, stat_type: "FlatATK" },
      sandsPiece,
      gobletPiece,
      circletPiece,
    );

    for (const stat of POSSIBLE_SUB_STATS) {
      builder.unroll(stat, "AVG", 5, 2);
      builder.roll(stat, "AVG", 4, 2);
    }

    return builder;
  }

  build(): StatTable {
    const sum = this.mainStats();
    for (const [stat, value] of this.subStats()) {
      sum.add(stat, value);
    }
    return sum;
  }

  mainStats(): StatTable {
    const res = new StatTable();
    const pieces = [
      this.flower,
      this.feather,
      this.sands,
      this.goblet,
      this.circlet,
    ].filter((p) => p !== undefined) as ArtifactPiece[];
    for (const piece of pieces) {
      const value = getMainStatValue(piece.stat_type);
      res.add(piece.stat_type, value);
    }
    return res;
  }

  subStats(): StatTable {
    const res = new StatTable();
    for (const [[stat, quality, rarity], num] of this.rolls) {
      const baseValue = getSubStatValue(rarity, stat);
      const value = baseValue * rollQualityMultiplier(quality) * num;
      res.add(stat, value);
    }
    return res;
  }

  roll(
    substatValue: StatType,
    quality: ArtifactRollQuality,
    rarity: number,
    num: number,
  ): void {
    if (!isValidSubstatType(substatValue))
      throw new Error("Invalid substat type");
    const current = this.currentRollsForGiven(substatValue, quality, rarity);
    if (current + num > this.substatConstraint(substatValue, rarity))
      throw new Error("Exceeds constraint");

    const key: [StatType, ArtifactRollQuality, number] = [
      substatValue,
      quality,
      rarity,
    ];
    this.rolls.set(key, (this.rolls.get(key) || 0) + num);
  }

  unroll(
    substatValue: StatType,
    quality: ArtifactRollQuality,
    rarity: number,
    num: number,
  ): void {
    if (!isValidSubstatType(substatValue))
      throw new Error("Invalid substat type");

    const key: [StatType, ArtifactRollQuality, number] = [
      substatValue,
      quality,
      rarity,
    ];
    const current = this.rolls.get(key) || 0;
    if (current >= num) {
      const newValue = current - num;
      if (newValue === 0) {
        this.rolls.delete(key);
      } else {
        this.rolls.set(key, newValue);
      }
    }
  }

  currentRolls(): number {
    return Array.from(this.rolls.values()).reduce((sum, v) => sum + v, 0);
  }

  currentRollsForGiven(
    statType: StatType,
    quality: ArtifactRollQuality,
    rarity: number,
  ): number {
    const key: [StatType, ArtifactRollQuality, number] = [
      statType,
      quality,
      rarity,
    ];
    return this.rolls.get(key) || 0;
  }

  maxRolls(): number {
    if (this.rollLimit !== undefined) return this.rollLimit;

    const pieces = [
      this.flower,
      this.feather,
      this.sands,
      this.goblet,
      this.circlet,
    ].filter((p) => p !== undefined) as ArtifactPiece[];
    return pieces.reduce((sum, p) => sum + maxRollsFor(p), 0);
  }

  substatConstraint(statType: StatType, rarity: number): number {
    const key: [StatType, number] = [statType, rarity];
    return this.constraints.get(key) || 0;
  }

  rollsLeft(): number {
    return this.maxRolls() - this.currentRolls();
  }

  rollsLeftForGiven(
    statType: StatType,
    quality: ArtifactRollQuality,
    rarity: number,
  ): number {
    return (
      this.substatConstraint(statType, rarity) -
      this.currentRollsForGiven(statType, quality, rarity)
    );
  }
}

export function optimalMainStats(
  stats: StatTable,
  rotation: Rotation,
): [StatType, StatType, StatType] {
  return globalKqmcArtifactMainStatOptimizer(stats, rotation);
}

// Constants for possible main stats
const POSSIBLE_SANDS_STATS: StatType[] = [
  "HPPercent",
  "ATKPercent",
  "DEFPercent",
  "ElementalMastery",
  "EnergyRecharge",
];

const POSSIBLE_GOBLET_STATS: StatType[] = [
  "HPPercent",
  "ATKPercent",
  "DEFPercent",
  "ElementalMastery",
  "PyroDMGBonus",
  "CryoDMGBonus",
  "GeoDMGBonus",
  "DendroDMGBonus",
  "ElectroDMGBonus",
  "HydroDMGBonus",
  "AnemoDMGBonus",
  "PhysicalDMGBonus",
];

const POSSIBLE_CIRCLE_STATS: StatType[] = [
  "HPPercent",
  "ATKPercent",
  "DEFPercent",
  "ElementalMastery",
  "CritRate",
  "CritDMG",
  "HealingBonus",
];

const POSSIBLE_SUB_STATS: StatType[] = [
  "HPPercent",
  "FlatHP",
  "ATKPercent",
  "FlatATK",
  "DEFPercent",
  "FlatDEF",
  "ElementalMastery",
  "CritRate",
  "CritDMG",
  "EnergyRecharge",
];

// Function to get main stat value for 5-star level 20 artifacts
function getMainStatValue(stat: StatType): number {
  const mainStatValues: Record<StatType, number> = {
    BaseHP: 0,
    FlatHP: 4780,
    HPPercent: 0.466,
    BaseATK: 0,
    FlatATK: 311,
    ATKPercent: 0.466,
    BaseDEF: 0,
    FlatDEF: 0,
    DEFPercent: 0.583,
    ElementalMastery: 186.5,
    CritRate: 0.311,
    CritDMG: 0.622,
    EnergyRecharge: 0.518,
    DMGBonus: 0.466,
    ElementalDMGBonus: 0.466,
    PyroDMGBonus: 0.466,
    CryoDMGBonus: 0.466,
    GeoDMGBonus: 0.466,
    DendroDMGBonus: 0.466,
    ElectroDMGBonus: 0.466,
    HydroDMGBonus: 0.466,
    AnemoDMGBonus: 0.466,
    PhysicalDMGBonus: 0.466,
    NormalATKDMGBonus: 0.466,
    ChargeATKDMGBonus: 0.466,
    PlungeATKDMGBonus: 0.466,
    SkillDMGBonus: 0.466,
    BurstDMGBonus: 0.466,
    HealingBonus: 0.359,
    None: 0,
    ReactionBonus: 0,
    DefReduction: 0,
    DefIgnore: 0,
    PyroResistanceReduction: 0,
    HydroResistanceReduction: 0,
    ElectroResistanceReduction: 0,
    CryoResistanceReduction: 0,
    AnemoResistanceReduction: 0,
    GeoResistanceReduction: 0,
    DendroResistanceReduction: 0,
    PhysicalResistanceReduction: 0,
  };
  return mainStatValues[stat] || 0;
}

function getSubStatValue(rarity: number, stat: StatType): number {
  // Placeholder: implement based on actual values
  const subStatValues: Record<string, Partial<Record<StatType, number>>> = {
    "5": {
      HPPercent: 0.0583,
      FlatHP: 298.75,
      ATKPercent: 0.0583,
      FlatATK: 19.45,
      DEFPercent: 0.0729,
      FlatDEF: 23.15,
      ElementalMastery: 23.31,
      CritRate: 0.0389,
      CritDMG: 0.0777,
      EnergyRecharge: 0.0648,
    },
    "4": {
      HPPercent: 0.0466,
      FlatHP: 239,
      ATKPercent: 0.0466,
      FlatATK: 15.56,
      DEFPercent: 0.0583,
      FlatDEF: 18.52,
      ElementalMastery: 18.65,
      CritRate: 0.0311,
      CritDMG: 0.0622,
      EnergyRecharge: 0.0518,
    },
  };
  return subStatValues[rarity.toString()]?.[stat] || 0;
}

// Computes gradients of stats based on slopes
function statGradients(
  base: StatTable,
  target: Rotation,
  slopes: Map<StatType, number>,
): Map<StatType, number> {
  const gradients = new Map<StatType, number>();
  for (const [stat, delta] of slopes) {
    const direction = new StatTable([stat, delta]);
    const adjusted = base.clone();
    for (const [s, v] of direction) {
      adjusted.add(s, v);
    }
    const before = target.execute(base);
    const after = target.execute(adjusted);
    const gradient = (after - before) / delta;
    gradients.set(stat, gradient);
  }
  return gradients;
}

// Finds stats that increase target value based on gradients
function reluHeuristic(
  base: StatTable,
  target: Rotation,
  slopes: Map<StatType, number>,
): Set<StatType> {
  const gradients = statGradients(base, target, slopes);
  const effectiveSet = new Set<StatType>();
  for (const [stat, gradient] of gradients) {
    if (gradient > 0) {
      effectiveSet.add(stat);
    }
  }
  return effectiveSet;
}

// Finds best artifact main stat combo for given stats and rotation
function globalKqmcArtifactMainStatOptimizer(
  stats: StatTable,
  target: Rotation,
): [StatType, StatType, StatType] {
  const sandsStats = new Set(POSSIBLE_SANDS_STATS);
  const gobletStats = new Set(POSSIBLE_GOBLET_STATS);
  const circletStats = new Set(POSSIBLE_CIRCLE_STATS);
  const pool = new Set([...sandsStats, ...gobletStats, ...circletStats]);

  // Heuristic: check which stats actually increase target value
  const slopes = new Map<StatType, number>();
  for (const stat of pool) {
    slopes.set(stat, 1.0);
  }
  const effectiveSet = reluHeuristic(stats, target, slopes);

  // Intersect with valid stats for each piece
  const sandsSubset = new Set(
    [...effectiveSet].filter((s) => sandsStats.has(s)),
  );
  const gobletSubset = new Set(
    [...effectiveSet].filter((s) => gobletStats.has(s)),
  );
  const circletSubset = new Set(
    [...effectiveSet].filter((s) => circletStats.has(s)),
  );

  let bestCombo: [StatType, StatType, StatType] = ["None", "None", "None"];
  let bestValue = 0;

  // N^3 global search to find best combo
  for (const sands of sandsSubset) {
    for (const goblet of gobletSubset) {
      for (const circlet of circletSubset) {
        const combo: [StatType, StatType, StatType] = [sands, goblet, circlet];
        // Create combined stats with main stats
        const combined = stats.clone();
        combined.add(sands, getMainStatValue(sands));
        combined.add(goblet, getMainStatValue(goblet));
        combined.add(circlet, getMainStatValue(circlet));
        const value = target.execute(combined);
        if (value > bestValue) {
          bestValue = value;
          bestCombo = combo;
        }
      }
    }
  }
  return bestCombo;
}

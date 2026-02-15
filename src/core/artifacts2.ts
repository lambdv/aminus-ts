import { StatType, StatTable, Rotation } from "./stat";
import { Rng, defaultRng } from "./rng";
import { MAIN_AFFIX_WEIGHTS, MAIN_STAT_VALUES, Slot } from "../data/main-affix";
import {
  SUBSTAT_WEIGHTS,
  SUBSTAT_ROLL_TIERS,
  INITIAL_SUBSTAT_COUNTS,
  ROLL_TIER_PROBABILITIES,
  UPGRADE_ROLL_COUNTS,
  UPGRADE_INTERVAL,
  SubstatWeight,
} from "../data/substats";

export { RollQuality };

type ArtifacType = "flower" | "feather" | "sands" | "goblet" | "circlet";

export type Artifact = {
  type: ArtifacType;
  main_stat: StatType;
  level: number;
  rarity: number;
  substats?: StatTable;
};

export type ArtifactRollQuality = "MAX" | "HIGH" | "MID" | "LOW" | "AVG";

enum RollQuality {
  MAX,
  HIGH,
  MID,
  LOW,
  AVG, // Average of MAX, HIGH, MID, LOW
}

export type ArtifactPiece = {
  type?: ArtifacType;
  main_stat: StatType;
  level: number;
  rarity: number;
};

export class Artifacts {
  static readonly POSSIBLE_SANDS_STATS: StatType[] = [
    "HPPercent",
    "ATKPercent",
    "DEFPercent",
    "ElementalMastery",
    "EnergyRecharge",
  ];

  static readonly POSSIBLE_GOBLET_STATS: StatType[] = [
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

  static readonly POSSIBLE_CIRCLE_STATS: StatType[] = [
    "HPPercent",
    "ATKPercent",
    "DEFPercent",
    "ElementalMastery",
    "CritRate",
    "CritDMG",
    "HealingBonus",
  ];

  static readonly POSSIBLE_SUB_STATS: StatType[] = [
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

  /** returns multiplier for a given roll quality */
  static rollQualityMultiplier(quality: RollQuality): number {
    switch (quality) {
      case RollQuality.MAX:
        return 1.0;
      case RollQuality.HIGH:
        return 0.9;
      case RollQuality.MID:
        return 0.8;
      case RollQuality.LOW:
        return 0.7;
      case RollQuality.AVG:
        return (1.0 + 0.9 + 0.8 + 0.7) / 4.0;
      default:
        return 1.0;
    }
  }

  /**
   * Canonical main stat value lookup (compatibility wrapper).
   * If rarity and level are provided, uses fixture MAIN_STAT_VALUES.
   * Otherwise delegates to legacy single-arg baseline.
   */
  static getMainStatValue(
    stat: StatType,
    rarity?: number,
    level?: number,
  ): number {
    if (rarity !== undefined && level !== undefined) {
      const rarityTable = (MAIN_STAT_VALUES as any)[rarity];
      if (!rarityTable)
        throw new Error(`No main stat values for rarity ${rarity}`);

      const availableLevels = Object.keys(rarityTable)
        .map(Number)
        .sort((a, b) => a - b);
      let targetLevel = level;
      for (const lvl of availableLevels) {
        if (lvl <= level) targetLevel = lvl;
        else break;
      }
      const levelTable = rarityTable[targetLevel];
      if (!levelTable)
        throw new Error(`No main stat values for level ${targetLevel}`);
      return levelTable[stat] || 0;
    }

    // Fallback to legacy baseline (5* lvl20)
    return Artifacts.getMainStatValueLegacy(stat);
  }

  static pickWeighted<T extends { weight: number }>(
    items: T[],
    rng: Rng = defaultRng,
  ): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = rng.nextFloat() * totalWeight;

    for (const item of items) {
      random -= item.weight;
      if (random <= 0) {
        return item;
      }
    }

    return items[items.length - 1];
  }

  static selectMainStat(slot: Slot, rng: Rng = defaultRng): StatType {
    const weights = MAIN_AFFIX_WEIGHTS[slot];
    if (!weights) {
      throw new Error(`No main stat weights defined for slot: ${slot}`);
    }
    return Artifacts.pickWeighted(weights, rng).stat;
  }

  static getAvailableSubstats(slot: Slot, mainStat: StatType): SubstatWeight[] {
    const slotWeights = SUBSTAT_WEIGHTS[slot];
    if (!slotWeights) {
      throw new Error(`No substat weights for slot: ${slot}`);
    }

    const mainStatWeights = slotWeights[mainStat];
    if (!mainStatWeights) {
      const keys = Object.keys(slotWeights);
      if (keys.length === 1) {
        return slotWeights[keys[0]];
      }
      throw new Error(
        `No substat weights for main stat ${mainStat} in slot ${slot}`,
      );
    }

    return mainStatWeights.filter((weight) => weight.stat !== mainStat);
  }

  static selectInitialSubstatCount(
    rarity: number,
    rng: Rng = defaultRng,
  ): number {
    const counts = INITIAL_SUBSTAT_COUNTS[rarity];
    if (!counts) {
      throw new Error(`No initial substat counts for rarity ${rarity}`);
    }

    const options = Object.entries(counts).map(([count, prob]) => ({
      value: parseInt(count, 10),
      weight: prob * 1000,
    }));

    return Artifacts.pickWeighted(options, rng).value;
  }

  static selectRollTier(rarity: number, rng: Rng = defaultRng): number {
    const probs = ROLL_TIER_PROBABILITIES[rarity];
    if (!probs) {
      throw new Error(`No roll tier probabilities for rarity ${rarity}`);
    }

    const cumulative: number[] = [];
    let sum = 0;
    for (const prob of probs) {
      sum += prob;
      cumulative.push(sum);
    }

    const random = rng.nextFloat();
    for (let i = 0; i < cumulative.length; i++) {
      if (random < cumulative[i]) {
        return i;
      }
    }

    return 0;
  }

  static getSubstatRollValue(
    stat: StatType,
    rarity: number,
    tier: number,
  ): number {
    const rarityTiers = SUBSTAT_ROLL_TIERS[rarity];
    if (!rarityTiers) {
      throw new Error(`No substat roll tiers for rarity ${rarity}`);
    }

    const statTiers = rarityTiers[stat];
    if (!statTiers) {
      throw new Error(`No roll tiers for stat ${stat} at rarity ${rarity}`);
    }

    return statTiers[tier];
  }

  static selectUpgradeRollCount(rng: Rng = defaultRng): number {
    const options = Object.entries(UPGRADE_ROLL_COUNTS).map(
      ([count, prob]) => ({
        value: parseInt(count, 10),
        weight: prob * 10000,
      }),
    );

    return Artifacts.pickWeighted(options, rng).value;
  }

  static getSlotFromMainStat(mainStat: StatType): Slot {
    if (mainStat === "FlatHP") return "flower";
    if (mainStat === "FlatATK") return "feather";
    if (
      [
        "HPPercent",
        "ATKPercent",
        "DEFPercent",
        "ElementalMastery",
        "EnergyRecharge",
      ].includes(mainStat as string)
    )
      return "sands";
    if (
      [
        "HPPercent",
        "ATKPercent",
        "DEFPercent",
        "ElementalMastery",
        "PyroDMGBonus",
        "ElectroDMGBonus",
        "CryoDMGBonus",
        "HydroDMGBonus",
        "DendroDMGBonus",
        "AnemoDMGBonus",
        "GeoDMGBonus",
        "PhysicalDMGBonus",
      ].includes(mainStat as string)
    )
      return "goblet";
    return "circlet";
  }

  static generateSubstats(
    piece: Artifact,
    rng: Rng = defaultRng,
  ): Array<{ stat: StatType; value: number }> {
    const slot = Artifacts.getSlotFromMainStat(piece.main_stat);
    const availableSubstats = Artifacts.getAvailableSubstats(
      slot,
      piece.main_stat,
    );

    const initialCount = Artifacts.selectInitialSubstatCount(piece.rarity, rng);
    const substats: Map<StatType, number> = new Map();

    while (substats.size < initialCount) {
      const selected = Artifacts.pickWeighted(availableSubstats, rng);
      if (!substats.has(selected.stat)) {
        const tier = Artifacts.selectRollTier(piece.rarity, rng);
        const value = Artifacts.getSubstatRollValue(
          selected.stat,
          piece.rarity,
          tier,
        );
        substats.set(selected.stat, value);
      }
    }

    const upgradeLevels = Math.floor(piece.level / UPGRADE_INTERVAL);
    for (let upgrade = 0; upgrade < upgradeLevels; upgrade++) {
      if (substats.size < 4) {
        const availableForNew = availableSubstats.filter(
          (weight) => !substats.has(weight.stat),
        );
        if (availableForNew.length > 0) {
          const selected = Artifacts.pickWeighted(availableForNew, rng);
          const tier = Artifacts.selectRollTier(piece.rarity, rng);
          const value = Artifacts.getSubstatRollValue(
            selected.stat,
            piece.rarity,
            tier,
          );
          substats.set(
            selected.stat,
            (substats.get(selected.stat) || 0) + value,
          );
        }
        continue;
      }

      const existingStats = Array.from(substats.keys());
      const randomIndex = rng.nextInt(existingStats.length);
      const statToUpgrade = existingStats[randomIndex];

      const rollCount = Artifacts.selectUpgradeRollCount(rng);
      for (let i = 0; i < rollCount; i++) {
        const tier = Artifacts.selectRollTier(piece.rarity, rng);
        const value = Artifacts.getSubstatRollValue(
          statToUpgrade,
          piece.rarity,
          tier,
        );
        substats.set(statToUpgrade, (substats.get(statToUpgrade) || 0) + value);
      }
    }

    return Array.from(substats.entries()).map(([stat, value]) => ({
      stat,
      value,
    }));
  }

  static generateArtifact(
    slot: Slot,
    rarity: number,
    level: number,
    rng: Rng = defaultRng,
  ): {
    piece: Artifact;
    substats: Array<{ stat: StatType; value: number }>;
  } {
    if (rarity < 1 || rarity > 5) {
      throw new Error(`Invalid rarity: ${rarity}`);
    }
    if (level < 0 || level > 20) {
      throw new Error(`Invalid level: ${level}`);
    }

    const mainStat = Artifacts.selectMainStat(slot, rng);
    const piece: Artifact = { type: slot, rarity, level, main_stat: mainStat };
    const substats = Artifacts.generateSubstats(piece, rng);

    return { piece, substats };
  }

  /** returns max number of rolls for a given artifact piece */
  static maxRollsFor(artifact: ArtifactPiece): number {
    const baseSubstats = artifact.rarity - 1;
    const upgrades = Math.floor(artifact.level / 4);
    return baseSubstats + upgrades;
  }

  /** returns max number of rolls for a given artifact piece and substat type */
  static maxRollsForGiven(
    artifact: ArtifactPiece,
    substatType: StatType,
    worseCase: boolean = false,
  ): number {
    if (artifact.main_stat === substatType) return 0;
    const upgrades = Math.floor(artifact.level / 4);
    return worseCase ? upgrades : upgrades + 1;
  }

  static isValidSubstatType(statType: StatType): boolean {
    return Artifacts.POSSIBLE_SUB_STATS.includes(statType);
  }

  static validate_artifact_pieces(
    flower?: ArtifactPiece,
    feather?: ArtifactPiece,
    sands?: ArtifactPiece,
    goblet?: ArtifactPiece,
    circlet?: ArtifactPiece,
  ) {
    if (flower && flower.main_stat !== "FlatHP")
      throw new Error("Flower must have FlatHP main stat");
    if (feather && feather.main_stat !== "FlatATK")
      throw new Error("Feather must have FlatATK main stat");
    if (sands && !Artifacts.POSSIBLE_SANDS_STATS.includes(sands.main_stat))
      throw new Error("Invalid sands main stat");
    if (goblet && !Artifacts.POSSIBLE_GOBLET_STATS.includes(goblet.main_stat))
      throw new Error("Invalid goblet main stat");
    if (circlet && !Artifacts.POSSIBLE_CIRCLE_STATS.includes(circlet.main_stat))
      throw new Error("Invalid circlet main stat");
  }

  // Function to get main stat value for 5-star level 20 artifacts (legacy)
  static getMainStatValueLegacy(stat: StatType): number {
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

  static getSubStatValue(rarity: number, stat: StatType): number {
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
  static statGradients(
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
  static reluHeuristic(
    base: StatTable,
    target: Rotation,
    slopes: Map<StatType, number>,
  ): Set<StatType> {
    const gradients = Artifacts.statGradients(base, target, slopes);
    const effectiveSet = new Set<StatType>();
    for (const [stat, gradient] of gradients) {
      if (gradient > 0) {
        effectiveSet.add(stat);
      }
    }
    return effectiveSet;
  }

  // Finds best artifact main stat combo for given stats and rotation
  static globalKqmcArtifactMainStatOptimizer(
    stats: StatTable,
    target: Rotation,
  ): [StatType, StatType, StatType] {
    const sandsStats = new Set(Artifacts.POSSIBLE_SANDS_STATS);
    const gobletStats = new Set(Artifacts.POSSIBLE_GOBLET_STATS);
    const circletStats = new Set(Artifacts.POSSIBLE_CIRCLE_STATS);
    const pool = new Set([...sandsStats, ...gobletStats, ...circletStats]);

    // Heuristic: check which stats actually increase target value
    const slopes = new Map<StatType, number>();
    for (const stat of pool) {
      slopes.set(stat, 1.0);
    }
    const effectiveSet = Artifacts.reluHeuristic(stats, target, slopes);

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
          const combo: [StatType, StatType, StatType] = [
            sands,
            goblet,
            circlet,
          ];
          // Create combined stats with main stats
          const combined = stats.clone();
          combined.add(sands, Artifacts.getMainStatValue(sands));
          combined.add(goblet, Artifacts.getMainStatValue(goblet));
          combined.add(circlet, Artifacts.getMainStatValue(circlet));
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

  static optimalMainStats(
    stats: StatTable,
    rotation: Rotation,
    constraints?: MainStatConstraints,
  ): [StatType, StatType, StatType] {
    return Artifacts.globalKqmcArtifactMainStatOptimizer(stats, rotation);
  }

  static ArtifactBuilder = class {
    flower?: ArtifactPiece;
    feather?: ArtifactPiece;
    sands?: ArtifactPiece;
    goblet?: ArtifactPiece;
    circlet?: ArtifactPiece;
    rolls: Map<[StatType, RollQuality, number], number> = new Map();
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
      Artifacts.validate_artifact_pieces(
        flower,
        feather,
        sands,
        goblet,
        circlet,
      );
      this.flower = flower;
      this.feather = feather;
      this.sands = sands;
      this.goblet = goblet;
      this.circlet = circlet;
      this.initConstraints();
    }

    initConstraints() {
      for (const stat of Artifacts.POSSIBLE_SUB_STATS) {
        const pieces = [
          this.flower,
          this.feather,
          this.sands,
          this.goblet,
          this.circlet,
        ].filter((p) => p !== undefined) as ArtifactPiece[];
        for (const piece of pieces) {
          if (piece.main_stat !== stat) {
            const key: [StatType, number] = [stat, piece.rarity];
            const current = this.constraints.get(key) || 0;
            this.constraints.set(
              key,
              current + Artifacts.maxRollsForGiven(piece, stat),
            );
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
    ): typeof Artifacts.ArtifactBuilder.prototype {
      Artifacts.validate_artifact_pieces(
        flower,
        feather,
        sands,
        goblet,
        circlet,
      );
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

      const builder = new Artifacts.ArtifactBuilder(
        flower,
        feather,
        sands,
        goblet,
        circlet,
      );

      // Initialize constraints for KQMC (2 rolls per substat per artifact)
      for (const stat of Artifacts.POSSIBLE_SUB_STATS) {
        for (const piece of pieces) {
          if (piece.main_stat !== stat) {
            const key: [StatType, number] = [stat, piece.rarity];
            builder.constraints.set(
              key,
              (builder.constraints.get(key) || 0) + 2,
            );
          }
        }
      }

      const base = pieces.reduce((sum, p) => sum + Artifacts.maxRollsFor(p), 0);
      const penalty = pieces.length;
      builder.rollLimit = base - penalty;

      // Roll 2 of each substat at AVG quality and rollRarity
      for (const stat of Artifacts.POSSIBLE_SUB_STATS) {
        builder.roll(stat, RollQuality.AVG, rollRarity, 2);
        const key: [StatType, number] = [stat, rollRarity];
        builder.constraints.set(key, (builder.constraints.get(key) || 0) + 2);
      }

      return builder;
    }

    static kqmAll5Star(
      sandsMain: StatType,
      gobletMain: StatType,
      circletMain: StatType,
    ): typeof Artifacts.ArtifactBuilder.prototype {
      return Artifacts.ArtifactBuilder.kqmc(
        { rarity: 5, level: 20, main_stat: "FlatHP" },
        { rarity: 5, level: 20, main_stat: "FlatATK" },
        { rarity: 5, level: 20, main_stat: sandsMain },
        { rarity: 5, level: 20, main_stat: gobletMain },
        { rarity: 5, level: 20, main_stat: circletMain },
      );
    }

    static kqmAll4Star(
      sandsMain: StatType,
      gobletMain: StatType,
      circletMain: StatType,
    ): typeof Artifacts.ArtifactBuilder.prototype {
      const builder = Artifacts.ArtifactBuilder.kqmc(
        { rarity: 4, level: 16, main_stat: "FlatHP" },
        { rarity: 4, level: 16, main_stat: "FlatATK" },
        { rarity: 4, level: 16, main_stat: sandsMain },
        { rarity: 4, level: 16, main_stat: gobletMain },
        { rarity: 4, level: 16, main_stat: circletMain },
      );

      for (const stat of Artifacts.POSSIBLE_SUB_STATS) {
        builder.unroll(stat, RollQuality.AVG, 5, 2);
        builder.roll(stat, RollQuality.AVG, 4, 2);
      }

      return builder;
    }

    static kqmAll4StarWith5Star(
      sandsMain: StatType,
      gobletMain: StatType,
      circletMain: StatType,
      fiveStarIndex: number,
    ): typeof Artifacts.ArtifactBuilder.prototype {
      if (fiveStarIndex < 0 || fiveStarIndex > 2)
        throw new Error("Invalid five star index");

      let sandsPiece: ArtifactPiece = {
        rarity: 4,
        level: 16,
        main_stat: sandsMain,
      };
      let gobletPiece: ArtifactPiece = {
        rarity: 4,
        level: 16,
        main_stat: gobletMain,
      };
      let circletPiece: ArtifactPiece = {
        rarity: 4,
        level: 16,
        main_stat: circletMain,
      };

      switch (fiveStarIndex) {
        case 0:
          sandsPiece = { rarity: 5, level: 20, main_stat: sandsMain };
          break;
        case 1:
          gobletPiece = { rarity: 5, level: 20, main_stat: gobletMain };
          break;
        case 2:
          circletPiece = { rarity: 5, level: 20, main_stat: circletMain };
          break;
      }

      const builder = Artifacts.ArtifactBuilder.kqmc(
        { rarity: 4, level: 16, main_stat: "FlatHP" },
        { rarity: 4, level: 16, main_stat: "FlatATK" },
        sandsPiece,
        gobletPiece,
        circletPiece,
      );

      for (const stat of Artifacts.POSSIBLE_SUB_STATS) {
        builder.unroll(stat, RollQuality.AVG, 5, 2);
        builder.roll(stat, RollQuality.AVG, 4, 2);
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
        const value = Artifacts.getMainStatValue(piece.main_stat);
        res.add(piece.main_stat, value);
      }
      return res;
    }

    subStats(): StatTable {
      const res = new StatTable();
      for (const [[stat, quality, rarity], num] of this.rolls) {
        const baseValue = Artifacts.getSubStatValue(rarity, stat);
        const value =
          baseValue * Artifacts.rollQualityMultiplier(quality) * num;
        res.add(stat, value);
      }
      return res;
    }

    roll(
      substatValue: StatType,
      quality: RollQuality,
      rarity: number,
      num: number,
    ): void {
      if (!Artifacts.isValidSubstatType(substatValue))
        throw new Error("Invalid substat type");
      const current = this.currentRollsForGiven(substatValue, quality, rarity);
      if (current + num > this.substatConstraint(substatValue, rarity))
        throw new Error("Exceeds constraint");

      const key: [StatType, RollQuality, number] = [
        substatValue,
        quality,
        rarity,
      ];
      this.rolls.set(key, (this.rolls.get(key) || 0) + num);
    }

    unroll(
      substatValue: StatType,
      quality: RollQuality,
      rarity: number,
      num: number,
    ): void {
      if (!Artifacts.isValidSubstatType(substatValue))
        throw new Error("Invalid substat type");

      const key: [StatType, RollQuality, number] = [
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
      quality: RollQuality,
      rarity: number,
    ): number {
      const key: [StatType, RollQuality, number] = [statType, quality, rarity];
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
      return pieces.reduce((sum, p) => sum + Artifacts.maxRollsFor(p), 0);
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
      quality: RollQuality,
      rarity: number,
    ): number {
      return (
        this.substatConstraint(statType, rarity) -
        this.currentRollsForGiven(statType, quality, rarity)
      );
    }
  };
}

type MainStatConstraints = {
  flower: {
    rarity?: number;
    type?: ArtifacType;
    level?: number;
  };
  feather: {
    rarity?: number;
    type?: ArtifacType;
    level?: number;
  };
  sands: {
    rarity?: number;
    type?: ArtifacType;
    level?: number;
  };
  goblet: {
    rarity?: number;
    type?: ArtifacType;
    level?: number;
  };
  circlet: {
    rarity?: number;
    type?: ArtifacType;
    level?: number;
  };
};

// Backward compatibility exports
export const optimalMainStats = Artifacts.optimalMainStats;
export const ArtifactBuilder = Artifacts.ArtifactBuilder;
export const getMainStatValue = Artifacts.getMainStatValue;
export const pickWeighted = Artifacts.pickWeighted;
export const selectMainStat = Artifacts.selectMainStat;
export const getAvailableSubstats = Artifacts.getAvailableSubstats;
export const selectInitialSubstatCount = Artifacts.selectInitialSubstatCount;
export const selectRollTier = Artifacts.selectRollTier;
export const getSubstatRollValue = Artifacts.getSubstatRollValue;
export const selectUpgradeRollCount = Artifacts.selectUpgradeRollCount;
export const generateSubstats = Artifacts.generateSubstats;
export const generateArtifact = Artifacts.generateArtifact;

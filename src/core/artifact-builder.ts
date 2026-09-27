import { StatType, StatTable } from "./stat.js";
import type { ArtifactRollQuality } from "./artifacts.js";
import {
  POSSIBLE_SUB_STATS,
  Artifact,
  maxRollsFor,
  maxRollsForGiven,
  isValidSubstatType,
  validate_artifact_pieces,
  getMainStatValue,
  getSubStatTierValue,
  KQMC_SUBSTAT_VALUES,
} from "./artifact-constants.js";

/**
 * Way to build 1-5 artifact and distrubte substats accordingly
 */
export class ArtifactBuilder {
  flower?: Artifact;
  feather?: Artifact;
  sands?: Artifact;
  goblet?: Artifact;
  circlet?: Artifact;
  rolls: Map<[StatType, ArtifactRollQuality, number], number> = new Map();
  constraints: Map<string, number> = new Map();
  rollLimit?: number;
  private kqmcMode = false;
  private kqmcScalar = 1;

  private findRollKey(
    statType: StatType,
    quality: ArtifactRollQuality,
    rarity: number,
  ): [StatType, ArtifactRollQuality, number] | undefined {
    for (const key of this.rolls.keys()) {
      if (key[0] === statType && key[1] === quality && key[2] === rarity) {
        return key;
      }
    }
    return undefined;
  }

  private getConstraint(statType: StatType, rarity: number): number {
    return this.constraints.get(`${statType}:${rarity}`) ?? 0;
  }

  private addConstraint(statType: StatType, rarity: number, amount: number): void {
    this.constraints.set(`${statType}:${rarity}`, amount);
  }
  //general constructor to building any set of artifacts
  constructor(
    flower?: Artifact,
    feather?: Artifact,
    sands?: Artifact,
    goblet?: Artifact,
    circlet?: Artifact,
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
      ].filter((p) => p !== undefined) as Artifact[];
      for (const piece of pieces) {
        if (piece.main_stat !== stat) {
          const current = this.getConstraint(stat, piece.rarity);
          this.addConstraint(
            stat,
            piece.rarity,
            current + maxRollsForGiven(piece, stat),
          );
        }
      }
    }
  }
  static kqmc(
    flower?: Artifact,
    feather?: Artifact,
    sands?: Artifact,
    goblet?: Artifact,
    circlet?: Artifact,
    manualCaps: Partial<Record<StatType, number>> = {},
  ): ArtifactBuilder {
    validate_artifact_pieces(flower, feather, sands, goblet, circlet);
    const pieces = [flower, feather, sands, goblet, circlet].filter(
      (p) => p !== undefined,
    ) as Artifact[];

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

    if (pieces.length !== 5) throw new Error("KQMC requires five artifacts");
    const fourStarCount = pieces.filter((p) => p.rarity === 4).length;
    const rollRarity = Math.max(...pieces.map((p) => p.rarity));

    const builder = new ArtifactBuilder(
      flower,
      feather,
      sands,
      goblet,
      circlet,
    );

    builder.kqmcMode = true;
    builder.kqmcScalar = (5 - fourStarCount + fourStarCount * 0.8) / 5;
    builder.constraints.clear();
    builder.rollLimit = 40 - 2 * fourStarCount;

    // The cap includes two fixed rolls, plus two distributed rolls per eligible piece.
    for (const stat of POSSIBLE_SUB_STATS) {
      const eligible = pieces.filter((piece) => piece.main_stat !== stat).length;
      const cap = Math.min(2 + 2 * eligible, manualCaps[stat] ?? Infinity);
      if (!Number.isInteger(cap) || cap < 2)
        throw new Error(`Invalid KQMC cap for ${stat}`);
      builder.addConstraint(stat, rollRarity, cap);
    }

    // Roll 2 of each substat at AVG quality and rollRarity
    for (const stat of POSSIBLE_SUB_STATS) {
      builder.roll(stat, "AVG", rollRarity, 2);
    }

    return builder;
  }

  static kqmAll5Star(
    sandsMain: StatType,
    gobletMain: StatType,
    circletMain: StatType,
  ): ArtifactBuilder {
    return ArtifactBuilder.kqmc(
      { type: "flower", rarity: 5, level: 20, main_stat: "FlatHP" },
      { type: "feather", rarity: 5, level: 20, main_stat: "FlatATK" },
      { type: "sands", rarity: 5, level: 20, main_stat: sandsMain },
      { type: "goblet", rarity: 5, level: 20, main_stat: gobletMain },
      { type: "circlet", rarity: 5, level: 20, main_stat: circletMain },
    );
  }

  static kqmAll4Star(
    sandsMain: StatType,
    gobletMain: StatType,
    circletMain: StatType,
  ): ArtifactBuilder {
    return ArtifactBuilder.kqmc(
      { type: "flower", rarity: 4, level: 16, main_stat: "FlatHP" },
      { type: "feather", rarity: 4, level: 16, main_stat: "FlatATK" },
      { type: "sands", rarity: 4, level: 16, main_stat: sandsMain },
      { type: "goblet", rarity: 4, level: 16, main_stat: gobletMain },
      { type: "circlet", rarity: 4, level: 16, main_stat: circletMain },
    );

  }

  static kqmAll4StarWith5Star(
    sandsMain: StatType,
    gobletMain: StatType,
    circletMain: StatType,
    fiveStarIndex: number,
  ): ArtifactBuilder {
    if (fiveStarIndex < 0 || fiveStarIndex > 2)
      throw new Error("Invalid five star index");

    let sandsPiece: Artifact = {
      type: "sands",
      rarity: 4,
      level: 16,
      main_stat: sandsMain,
    };
    let gobletPiece: Artifact = {
      type: "goblet",
      rarity: 4,
      level: 16,
      main_stat: gobletMain,
    };
    let circletPiece: Artifact = {
      type: "circlet",
      rarity: 4,
      level: 16,
      main_stat: circletMain,
    };

    switch (fiveStarIndex) {
      case 0:
        sandsPiece = {
          type: "sands",
          rarity: 5,
          level: 20,
          main_stat: sandsMain,
        };
        break;
      case 1:
        gobletPiece = {
          type: "goblet",
          rarity: 5,
          level: 20,
          main_stat: gobletMain,
        };
        break;
      case 2:
        circletPiece = {
          type: "circlet",
          rarity: 5,
          level: 20,
          main_stat: circletMain,
        };
        break;
    }

    return ArtifactBuilder.kqmc(
      { type: "flower", rarity: 4, level: 16, main_stat: "FlatHP" },
      { type: "feather", rarity: 4, level: 16, main_stat: "FlatATK" },
      sandsPiece,
      gobletPiece,
      circletPiece,
    );

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
    ].filter((p) => p !== undefined) as Artifact[];
    for (const piece of pieces) {
      const value = this.kqmcMode && piece.rarity === 4 && piece.level === 16
        ? getMainStatValue(piece.main_stat) * 0.8
        : this.kqmcMode
          ? getMainStatValue(piece.main_stat)
          : getMainStatValue(piece.main_stat, piece.rarity, piece.level);
      res.add(piece.main_stat, value);
    }
    return res;
  }

  subStats(): StatTable {
    const res = new StatTable();
    for (const [[stat, quality, rarity], num] of this.rolls) {
      const value = this.kqmcMode
        ? (KQMC_SUBSTAT_VALUES[stat] ?? 0) * this.kqmcScalar * num
        : getSubStatTierValue(rarity, stat, quality) * num;
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
    if (!Number.isInteger(num) || num < 0) throw new Error("Roll count must be a nonnegative integer");
    if (num === 0) return;
    if (this.kqmcMode && quality !== "AVG")
      throw new Error("KQMC uses average roll quality");
    if (this.currentRolls() + num > this.maxRolls())
      throw new Error("Exceeds total roll budget");
    const current = this.kqmcMode
      ? this.countStatRolls(substatValue)
      : this.currentRollsForGiven(substatValue, quality, rarity);
    if (current + num > this.substatConstraint(substatValue, rarity))
      throw new Error("Exceeds constraint");

    const existingKey = this.findRollKey(substatValue, quality, rarity);
    if (existingKey) {
      this.rolls.set(existingKey, (this.rolls.get(existingKey) || 0) + num);
      return;
    }
    const key: [StatType, ArtifactRollQuality, number] = [substatValue, quality, rarity];
    this.rolls.set(key, num);
  }

  unroll(
    substatValue: StatType,
    quality: ArtifactRollQuality,
    rarity: number,
    num: number,
  ): void {
    if (!isValidSubstatType(substatValue))
      throw new Error("Invalid substat type");

    const key = this.findRollKey(substatValue, quality, rarity);
    if (!key) return;

    const current = this.rolls.get(key) || 0;
    if (this.kqmcMode && this.countStatRolls(substatValue) - num < 2)
      throw new Error("Cannot remove KQMC fixed rolls");
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
    const key = this.findRollKey(statType, quality, rarity);
    if (!key) return 0;
    return this.rolls.get(key) || 0;
  }

  private countStatRolls(statType: StatType): number {
    let count = 0;
    for (const [[stat], rolls] of this.rolls)
      if (stat === statType) count += rolls;
    return count;
  }

  maxRolls(): number {
    if (this.rollLimit !== undefined) return this.rollLimit;

    const pieces = [
      this.flower,
      this.feather,
      this.sands,
      this.goblet,
      this.circlet,
    ].filter((p) => p !== undefined) as Artifact[];
    return pieces.reduce((sum, p) => sum + maxRollsFor(p), 0);
  }

  substatConstraint(statType: StatType, rarity: number): number {
    if (this.kqmcMode) return this.getConstraint(statType, Math.max(...this.pieces().map((p) => p.rarity)));
    return this.getConstraint(statType, rarity);
  }

  private pieces(): Artifact[] {
    return [this.flower, this.feather, this.sands, this.goblet, this.circlet]
      .filter((piece): piece is Artifact => piece !== undefined);
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
      (this.kqmcMode ? this.countStatRolls(statType) : this.currentRollsForGiven(statType, quality, rarity))
    );
  }
}

export type { Artifact } from "./artifact-constants.js";

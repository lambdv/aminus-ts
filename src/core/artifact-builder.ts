import { StatType, StatTable } from "./stat";
import { ArtifactRollQuality } from "./artifacts";
import {
  POSSIBLE_SUB_STATS,
  Artifact,
  rollQualityMultiplier,
  maxRollsFor,
  maxRollsForGiven,
  isValidSubstatType,
  validate_artifact_pieces,
  getMainStatValue,
  getSubStatValue,
} from "./artifact-constants";

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
  constraints: Map<[StatType, number], number> = new Map();
  rollLimit?: number;

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
    let sum = 0;
    for (const [[stat, r], count] of this.constraints.entries()) {
      if (stat === statType && r === rarity) {
        sum += count;
      }
    }
    return sum;
  }

  private addConstraint(statType: StatType, rarity: number, amount: number): void {
    const key: [StatType, number] = [statType, rarity];
    this.constraints.set(key, amount);
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
        if (piece.main_stat !== stat) {
          const current = builder.getConstraint(stat, piece.rarity);
          builder.addConstraint(stat, piece.rarity, current + 2);
        }
      }
    }

    const base = pieces.reduce((sum, p) => sum + maxRollsFor(p), 0);
    const penalty = pieces.length;
    builder.rollLimit = base - penalty;

    // Roll 2 of each substat at AVG quality and rollRarity
    for (const stat of POSSIBLE_SUB_STATS) {
      builder.roll(stat, "AVG", rollRarity, 2);
      const current = builder.getConstraint(stat, rollRarity);
      builder.addConstraint(stat, rollRarity, current + 2);
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
    const builder = ArtifactBuilder.kqmc(
      { type: "flower", rarity: 4, level: 16, main_stat: "FlatHP" },
      { type: "feather", rarity: 4, level: 16, main_stat: "FlatATK" },
      { type: "sands", rarity: 4, level: 16, main_stat: sandsMain },
      { type: "goblet", rarity: 4, level: 16, main_stat: gobletMain },
      { type: "circlet", rarity: 4, level: 16, main_stat: circletMain },
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

    const builder = ArtifactBuilder.kqmc(
      { type: "flower", rarity: 4, level: 16, main_stat: "FlatHP" },
      { type: "feather", rarity: 4, level: 16, main_stat: "FlatATK" },
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
    ].filter((p) => p !== undefined) as Artifact[];
    for (const piece of pieces) {
      const value = getMainStatValue(piece.main_stat);
      res.add(piece.main_stat, value);
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
    return this.getConstraint(statType, rarity);
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

export type { Artifact } from "./artifact-constants";

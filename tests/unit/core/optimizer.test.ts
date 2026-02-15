import {
  optimalMainStats,
  gradient5StarKqmcArtifactSubstatOptimizer,
  optimalKqmc5ArtifactsStats,
} from "@/core/optimizer";
import { dmg_formula } from "@/core/formulas";
import { ArtifactBuilder } from "@/core/artifact-builder";
import { getMainStatValue, Artifact } from "@/core/artifact-constants";
import { Rotation, StatTable } from "@/core/stat";

const atkRotation = () => {
  const rotation = new Rotation([]);
  rotation.add(["atk", dmg_formula("Pyro", "Normal", 1.0)]);
  return rotation;
};

const defaultPieces = (): [Artifact, Artifact, Artifact, Artifact, Artifact] => [
  { type: "flower", rarity: 5, level: 20, main_stat: "FlatHP" },
  { type: "feather", rarity: 5, level: 20, main_stat: "FlatATK" },
  { type: "sands", rarity: 5, level: 20, main_stat: "ATKPercent" },
  { type: "goblet", rarity: 5, level: 20, main_stat: "PyroDMGBonus" },
  { type: "circlet", rarity: 5, level: 20, main_stat: "CritRate" },
];

describe("Optimizer", () => {
  it("finds performance-improving main stats for atk scaling", () => {
    const stats = new StatTable(
      ["BaseATK", 100],
      ["ATKPercent", 0.5],
      ["FlatATK", 100],
      ["CritRate", 0.05],
      ["CritDMG", 0.5],
      ["ElementalMastery", 100],
    );
    const target = atkRotation();

    const before = target.execute(stats);
    const [sands, goblet, circlet] = optimalMainStats(stats, target);

    const afterStats = stats.clone();
    afterStats.add(sands, getMainStatValue(sands));
    afterStats.add(goblet, getMainStatValue(goblet));
    afterStats.add(circlet, getMainStatValue(circlet));

    expect(target.execute(afterStats)).toBeGreaterThan(before);
  });

  it("returns non-empty substat distribution within roll budget", () => {
    const stats = new StatTable(
      ["BaseATK", 844.85],
      ["ATKPercent", 0.2],
      ["FlatATK", 1000.0],
      ["CritRate", 0.05],
      ["CritDMG", 0.5],
      ["EnergyRecharge", 1.0],
    );
    const target = atkRotation();
    const [flower, feather, sands, goblet, circlet] = defaultPieces();

    const res = gradient5StarKqmcArtifactSubstatOptimizer(
      stats,
      target,
      flower,
      feather,
      sands,
      goblet,
      circlet,
      1.0,
    );

    const totalRolls = Array.from(res.values()).reduce((sum, x) => sum + x, 0);
    const maxRolls = ArtifactBuilder.kqmc(
      flower,
      feather,
      sands,
      goblet,
      circlet,
    ).maxRolls();

    expect(res.size).toBeGreaterThan(0);
    expect(totalRolls).toBeLessThanOrEqual(maxRolls);
  });

  it("throws when energy recharge target cannot be met", () => {
    const stats = new StatTable(
      ["BaseATK", 106.0],
      ["BaseHP", 15552.0],
      ["BaseDEF", 876.0],
      ["CritRate", 0.05],
      ["CritDMG", 0.5],
      ["EnergyRecharge", 1.0],
    );
    const target = atkRotation();
    const [flower, feather, sands, goblet, circlet] = defaultPieces();

    expect(() =>
      gradient5StarKqmcArtifactSubstatOptimizer(
        stats,
        target,
        flower,
        feather,
        sands,
        goblet,
        circlet,
        3.0,
      ),
    ).toThrow("Energy Recharge requirements cannot be met with substats alone");
  });

  it("meets ER target when base stats and mains are sufficient", () => {
    const stats = new StatTable(
      ["BaseATK", 337.0],
      ["BaseHP", 12907.0],
      ["BaseDEF", 789.0],
      ["CritRate", 0.05],
      ["CritDMG", 0.5],
      ["EnergyRecharge", 1.32 + 0.459],
      ["FlatATK", 900.0],
    );
    const target = atkRotation();
    const flower: Artifact = {
      type: "flower",
      rarity: 5,
      level: 20,
      main_stat: "FlatHP",
    };
    const feather: Artifact = {
      type: "feather",
      rarity: 5,
      level: 20,
      main_stat: "FlatATK",
    };
    const sands: Artifact = {
      type: "sands",
      rarity: 5,
      level: 20,
      main_stat: "EnergyRecharge",
    };
    const goblet: Artifact = {
      type: "goblet",
      rarity: 5,
      level: 20,
      main_stat: "ElectroDMGBonus",
    };
    const circlet: Artifact = {
      type: "circlet",
      rarity: 5,
      level: 20,
      main_stat: "CritRate",
    };

    const res = gradient5StarKqmcArtifactSubstatOptimizer(
      stats,
      target,
      flower,
      feather,
      sands,
      goblet,
      circlet,
      2.0,
    );

    const finalStats = stats.clone();
    const built = ArtifactBuilder.kqmc(
      flower,
      feather,
      sands,
      goblet,
      circlet,
    ).build();
    for (const [s, v] of built) {
      finalStats.add(s, v);
    }

    expect(finalStats.get("EnergyRecharge")).toBeGreaterThanOrEqual(2.0);
    expect(res.size).toBeGreaterThan(0);
  });

  it("improves damage in end-to-end 5-star optimization", () => {
    const stats = new StatTable(
      ["BaseATK", 106.0 + 454.0],
      ["BaseHP", 15552.0],
      ["BaseDEF", 876.0],
      ["CritRate", 0.05],
      ["CritDMG", 0.5],
      ["EnergyRecharge", 1.0],
      ["ElementalMastery", 221.0],
    );
    const target = atkRotation();

    const before = target.execute(stats);
    const afterStats = optimalKqmc5ArtifactsStats(stats, target, 1.0);
    const after = target.execute(afterStats);

    expect(after).toBeGreaterThan(before);
  });
});

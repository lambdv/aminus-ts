import { StatTable, Rotation } from "@/core/stat";
import { calculate_damage } from "@/core/formulas";
import {
  optimalMainStats,
  ArtifactBuilder,
  Artifact,
} from "@/core/artifacts";

describe("optimalMainStats", () => {
  it("should find the best main stats for a basic ATK-focused character", () => {
    const stats = new StatTable(
      ["BaseATK", 100.0],
      ["ATKPercent", 0.5],
      ["FlatATK", 100.0],
      ["CritRate", 0.05],
      ["CritDMG", 0.5],
    );

    const target = new Rotation([
      [
        "atk1",
        (s: StatTable) =>
          calculate_damage(
            "Pyro",
            "Normal",
            "ATK",
            "None",
            1.0,
            1.0,
            s,
            undefined,
          ),
      ],
    ]);

    const result = optimalMainStats(stats, target);
    expect(result).toEqual(["ATKPercent", "PyroDMGBonus", "ATKPercent"]);
  });

  it("should handle empty stats", () => {
    const stats = new StatTable();
    const target = new Rotation([
      [
        "atk1",
        (s: StatTable) =>
          calculate_damage(
            "Pyro",
            "Normal",
            "ATK",
            "None",
            1.0,
            1.0,
            s,
            undefined,
          ),
      ],
    ]);

    const result = optimalMainStats(stats, target);
    // Should return some valid combination
    expect(result).toBeDefined();
    expect(result.length).toBe(3);
  });
});

describe("ArtifactBuilder", () => {
  it("should create a basic artifact builder", () => {
    const flower: Artifact = { type: "flower", rarity: 5, level: 20, main_stat: "FlatHP" };
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
      main_stat: "ATKPercent",
    };
    const goblet: Artifact = {
      type: "goblet",
      rarity: 5,
      level: 20,
      main_stat: "PyroDMGBonus",
    };
    const circlet: Artifact = {
      type: "circlet",
      rarity: 5,
      level: 20,
      main_stat: "CritRate",
    };

    const builder = new ArtifactBuilder(
      flower,
      feather,
      sands,
      goblet,
      circlet,
    );

    expect(builder.flower).toEqual(flower);
    expect(builder.feather).toEqual(feather);
    expect(builder.sands).toEqual(sands);
    expect(builder.goblet).toEqual(goblet);
    expect(builder.circlet).toEqual(circlet);
  });

  it("should create builder with correct main stats", () => {
    const bob = new ArtifactBuilder(
      { type: "flower", rarity: 5, level: 20, main_stat: "FlatHP" },
      { type: "feather", rarity: 5, level: 20, main_stat: "FlatATK" },
      { type: "sands", rarity: 5, level: 20, main_stat: "EnergyRecharge" },
      { type: "goblet", rarity: 5, level: 20, main_stat: "ATKPercent" },
      { type: "circlet", rarity: 5, level: 20, main_stat: "ATKPercent" },
    );

    const expected = new StatTable(
      ["FlatHP", 4780.0],
      ["FlatATK", 311.0],
      ["EnergyRecharge", 0.518],
      ["ATKPercent", 0.466],
      ["ATKPercent", 0.466],
    );

    expect(bob.mainStats()).toEqual(expected);
  });
});

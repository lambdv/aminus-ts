import { StatTable } from "@/core/stat";
import { ArtifactBuilder, Artifact } from "@/core/artifacts";

describe("ArtifactBuilder", () => {
  it("should create a basic artifact builder", () => {
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

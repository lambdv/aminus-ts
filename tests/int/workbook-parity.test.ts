import { character_damage, reaction_damage, transformativeBaseDamage, additiveReactionBase, amplify } from "@/core/formulas";
import { StatTable } from "@/core/stat";

// DamageTemplate.xlsx Template!P93:P104 and cached R111, R112, U113, R116.
const workbookCharacter = () => new StatTable(
  ["BaseATK", 735.1292053],
  ["ATKPercent", 0.6954860014],
  ["FlatATK", 344.08],
  ["CritRate", 0.671255108],
  ["CritDMG", 1.2944],
  ["ElementalMastery", 135.64],
);

describe("DamageTemplate calculation modes", () => {
  it("matches an ordinary talent hit", () => {
    const hit = character_damage({
      element: "Physical", damageType: "Normal", motionValue: 0.7724585,
    });
    expect(hit(workbookCharacter())).toBeCloseTo(1006.734427, 5);
  });

  it("matches additive talent damage before amplification", () => {
    const hit = character_damage({
      element: "Physical", damageType: "Normal",
      motionValue: 0, additiveDamage: 1000,
    });
    expect(hit(workbookCharacter())).toBeCloseTo(819.4287605, 5);
  });

  it("documents updated reaction expectations independently of Kol's old constants", () => {
    // KQM TCL 2026-09-27: precise level-90 curve and post-5.2 Superconduct factor.
    // Old cached R116=1312.758703 used factor .5 and rounded level base 1446.9.
    expect(transformativeBaseDamage(90)).toBe(1446.8535);
    const em = 135.64;
    expect(additiveReactionBase("Aggravate", workbookCharacter()))
      .toBeCloseTo(1.15 * 1446.8535 * (1 + 5 * em / (1200 + em)), 8);
    expect(reaction_damage({ kind: "Superconduct", element: "Cryo" })(workbookCharacter()))
      .toBeCloseTo(1.5 * 1446.8535 * (1 + 16 * em / (2000 + em)) * .9, 8);
  });

  it("applies partial amplification and configurable resistance", () => {
    const hit = character_damage({
      element: "Physical", damageType: "Normal", motionValue: 0.7724585,
    });
    const amp = 1.5 * (1 + 2.78 * 135.64 / (1400 + 135.64));
    expect(amplify(hit, 1.5, { uptime: 0.5 })(workbookCharacter()))
      .toBeCloseTo(1006.734427 * (0.5 + 0.5 * amp), 5);
    expect(character_damage({
      element: "Physical", damageType: "None",
      motionValue: 0, additiveDamage: 1000, enemyResistance: { Physical: 0.9 },
    })(new StatTable(["CritRate", 0]))).toBeCloseTo(1000 / (1 + 4 * .9) * (190 / 390), 8);
  });

  it("supports the canonical transformative reaction names", () => {
    const reactions = ["Burning", "Superconduct", "Swirl",
      "Electro-Charged", "Shattered", "Overloaded", "Bloom", "Burgeon", "Hyperbloom"] as const;
    for (const kind of reactions) {
      const value = reaction_damage({ kind, element: "Physical" })(workbookCharacter());
      expect(value).toBeGreaterThan(0);
      expect(Number.isFinite(value)).toBe(true);
    }
  });
});

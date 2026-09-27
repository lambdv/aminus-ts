import { StatTable, character_damage, characterDamageBreakdown, additiveReactionBase,
  amplify, reaction_damage, res_multiplier, def_multiplier, transformativeBaseDamage, scalingValue } from "@/index";

// Independent arithmetic: KQM TCL damage/transformative/additive reaction formulas,
// retrieved 2026-09-27. See README's evidence links and intentional parity differences.
const stats = () => new StatTable(["BaseATK", 1000], ["ATKPercent", .5], ["FlatATK", 100],
  ["CritRate", .5], ["CritDMG", 1], ["ElementalMastery", 200]);
const hit = { element: "Electro" as const, damageType: "Skill" as const, motionValue: 2 };
it("applies base multipliers before additive damage and then all hit factors", () => {
  const s = stats();
  s.set("ElectroDMGBonus", .2); s.set("SkillDMGBonus", .3);
  const result = characterDamageBreakdown({ ...hit, baseDamageMultiplier: 1.4,
    additiveDamage: 500, damageBonus: .1, damageReduction: .05, instances: 3,
    percentScalingBonus: .1, flatScalingBonus: 20, critRateBonus: .1, critDamageBonus: .2,
    resistanceReduction: .3, defenseReduction: .2, defenseIgnore: .1 }, s);
  expect(result.scalingValue).toBe(1720);
  expect(result.baseDamage).toBe(1720 * 2 * 1.4 + 500);
  expect(result.total).toBeCloseTo((1720 * 2 * 1.4 + 500) * (1 + .6 * 1.2) * 1.55
    * 1.1 * (190 / (190 + 200 * .8 * .9)) * 3, 8);
});
it("supports pure flat damage and all scaling stats", () => {
  const s = new StatTable(["BaseATK",100], ["ATKPercent",.5], ["FlatATK",10],
    ["BaseHP",1000], ["HPPercent",.2], ["FlatHP",100],
    ["BaseDEF",200], ["DEFPercent",.3], ["FlatDEF",20], ["ElementalMastery",50]);
  expect(["ATK", "HP", "DEF", "BaseATK", "EM"].map(kind => scalingValue(s, kind as "ATK")))
    .toEqual([160,1300,280,100,50]);
  expect(character_damage({ element: "Physical", damageType: "None", additiveDamage: 100 })(s))
    .toBeCloseTo(100 * .9 * 190 / 390, 10);
});
it.each([[-.2,1.1],[0,1],[.1,.9],[.749,.251],[.75,.25],[.9,1/4.6]])(
  "uses the piecewise resistance formula at %s", (res, expected) => expect(res_multiplier(res,0)).toBeCloseTo(expected,12));
it("caps crit rate and excludes elemental-only bonuses from Physical and None", () => {
  for (const element of ["Physical", "None"] as const) {
    const s = stats(); s.set("ElementalDMGBonus", 100);
    s.set("CritRate", -1);
    expect(characterDamageBreakdown({ ...hit, element }, s).critMultiplier).toBe(1);
    s.set("CritRate", 2);
    const result = characterDamageBreakdown({ ...hit, element }, s);
    expect(result.critMultiplier).toBe(2);
    expect(result.damageMultiplier).toBe(1);
  }
});
it("composes additive reactions before direct-hit modifiers", () => {
  const s = stats(), base = 1.15 * 1446.8535 * (1 + 5 * 200 / 1400);
  expect(additiveReactionBase("Aggravate", s)).toBeCloseTo(base,10);
  expect(additiveReactionBase("Spread", s)).toBeCloseTo(base * 1.25 / 1.15,10);
  expect(character_damage({ ...hit, additiveDamage: additiveReactionBase("Aggravate", s) })(s))
    .toBeCloseTo((3200 + base) * 1.5 * .9 * 190 / 390,8);
});
it.each([["Burning",.25],["Superconduct",1.5],["Swirl",.6],["Electro-Charged",2],
  ["Shattered",3],["Overloaded",2.75],["Bloom",2],["Burgeon",3],["Hyperbloom",3]] as const)(
  "uses current %s multiplier and ignores direct-hit bonuses", (kind, factor) => {
    const s = stats(); s.set("DMGBonus",100); s.set("DefReduction",1);
    expect(reaction_damage({ kind, element: "Electro", reactionBonus: .4, instances: 2 })(s))
      .toBeCloseTo(factor * 1446.8535 * (1 + 16 * 200 / 2200 + .4) * .9 * 2,8);
  });
it("uses precise level data through 100 and validates levels", () => {
  expect(transformativeBaseDamage(1)).toBe(17.165606);
  expect(transformativeBaseDamage(90)).toBe(1446.8535);
  expect(transformativeBaseDamage(95)).toBe(1561.468);
  expect(transformativeBaseDamage(100)).toBe(1674.8092);
  expect(def_multiplier(100,100,0,0)).toBe(.5);
  expect(def_multiplier(90,100,2,0)).toBe(1);
  for (const level of [0,101,1.5,NaN,Infinity]) expect(() => transformativeBaseDamage(level)).toThrow();
});
it("supports partial amplification without applying buffs or instances twice", () => {
  const s=stats(); const base=character_damage({ ...hit, instances: 3 });
  for (const uptime of [0,.5,1]) expect(amplify(base,1.5,{ uptime })(s))
    .toBeCloseTo(3200 * 1.5 * .9 * 190 / 390 * 3 * (1-uptime+uptime*1.5*(1+2.78*200/1600)),8);
  for (const uptime of [-1,2,NaN,Infinity]) expect(() => amplify(base,1.5,{ uptime })).toThrow();
});
it("does not mutate stats or buffs across repeat calls", () => {
  const s=stats(), buffs=new StatTable(["FlatATK",100]);
  const before=[...s], beforeBuffs=[...buffs];
  const compute=character_damage({ ...hit, buffs });
  expect(compute(s)).toBe(compute(s));
  reaction_damage({ kind: "Bloom", element: "Dendro", buffs })(s);
  expect([...s]).toEqual(before); expect([...buffs]).toEqual(beforeBuffs);
});
it("handles zero instances and rejects invalid counts and base values", () => {
  expect(character_damage({ ...hit, instances: 0 })(stats())).toBe(0);
  for (const instances of [-1,NaN,Infinity]) {
    expect(() => character_damage({ ...hit, instances })(stats())).toThrow();
    expect(() => reaction_damage({ kind: "Bloom", element: "Dendro", instances })).toThrow();
  }
  expect(() => character_damage({ ...hit, additiveDamage: NaN })(stats())).toThrow();
});

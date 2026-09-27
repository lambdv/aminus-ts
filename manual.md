# Aminus

A small Genshin Impact stat, damage, and artifact optimization library. Supply character, talent, weapon, artifact set, and team effects as numbers. Percentages are fractions: `0.4` means 40%. The main entry point is `aminus`; the optional team aggregator is `aminus/team`.

## Calculate and combine hits

```ts
import { StatTable, Rotation, character_damage, amplify,
  additiveReactionBase, reaction_damage } from "aminus";
import { aggregateTeam } from "aminus/team";

// Include character, weapon, artifact and active buff stats explicitly.
const ayaka = new StatTable(
  ["BaseATK", 950.03], ["ATKPercent", 0.466], ["FlatATK", 311.234],
  ["CritRate", 0.45], ["CritDMG", 2.168],
);
const plunge = character_damage({
  element: "Dendro", damageType: "Plunging", motionValue: 1.2786 * 1.837,
});
const rotation = new Rotation([["plunge", plunge]]);
const damage = rotation.execute(ayaka);
const team = aggregateTeam([{ id: "plunge", owner: "ayaka", damage }], 20);
// team.teamDpr ≈ 3466.876375; team.teamDps ≈ 173.3438187
```

`character_damage(options)` returns a `(stats: StatTable) => number` function. Supply `motionValue`, `scaling` (`ATK`, `HP`, `DEF`, `BaseATK`, or `EM`), `baseDamageMultiplier`, `additiveDamage`, `instances`, enemy context, and per-hit modifiers as needed. `additiveDamage` is added after multiplying the talent base. Omit `motionValue` for a pure flat-base hit. `characterDamageBreakdown(options, stats)` exposes the factors used to calculate a hit. The functions never modify the input stats.

`amplify(hit, 1.5, { uptime: 0.5 })` applies an amplifying reaction to half of a calculated hit. `additiveReactionBase("Aggravate", stats)` returns base damage to pass as `additiveDamage` on the triggering hit. `reaction_damage({ kind: "Hyperbloom", element: "Dendro" })` returns a separate transformative damage function. Supply reaction bonuses explicitly; no weapon, set, or character name has special treatment. Electro-Charged returns one tick; callers decide how many ticks occur.

`Rotation` is a named sum of damage functions. `compose(...functions)` produces the same sum without a class. Construct different `StatTable` values for different buff windows and evaluate each hit with the appropriate table.

## Optimize artifacts

```ts
import { optimizeKqmcArtifacts, character_damage } from "aminus";
const hit = character_damage({ element: "Cryo", damageType: "Burst", motionValue: 2.86 });
const result = optimizeKqmcArtifacts({
  stats: ayaka,
  score: hit,
  energyRechargeRequirement: 1.3,
});
// result.artifactStats is the selected allocation; result.totalStats includes ayaka.
```

`score` receives combined base and candidate artifact stats. To optimize a team, calculate any dependent buffs and full team damage inside `score`. Each call receives an isolated copy of the candidate stats. The ER requirement is checked against the combined stats supplied to the optimizer; transformations of ER inside `score` are outside that constraint. Optional `mainStats`, `rarities`, and `manualCaps` control the KQMC search. KQMC uses its own average-roll and mixed-rarity approximation; ordinary `ArtifactBuilder` uses the artifact value tables.

For weapon or artifact comparisons, map candidates to their explicit stats, recalculate their buffs and damage, then compare the resulting scores. The library does not resolve names or choose a rotation for a candidate.

```ts
const candidates = [
  { name: "first", weaponATK: 600 },
  { name: "second", weaponATK: 700 },
];
const ranked = candidates.map(candidate => {
  const stats = ayaka.clone();
  stats.set("BaseATK", 342.03); // Character base without the original weapon.
  stats.add("BaseATK", candidate.weaponATK);
  // Recalculate any teammate buffs and event damage using this candidate's stats.
  return { name: candidate.name, damage: rotation.execute(stats) };
});
```

`aggregateTeam(contributions, rotationSeconds)` accepts already calculated `{ id, owner, damage }` rows and reports per-owner DPR, DPS, and share plus team totals. The caller chooses the owner, including for donated damage. Healing is kept outside the damage rows. Empty input returns zero totals; non-finite damage and nonpositive duration are rejected.

## Migrate from the local Kol integration

| Before | Now |
| --- | --- |
| `CharacterBuild` and `resolveBuild` | Supply resolved `StatTable` values. |
| Catalog talent, weapon, set, and character names | Supply numeric multipliers, stats, reaction bonuses, and conditional effects. |
| `DamageScenario` / `evaluateTeam` event kinds | Call core damage functions and pass their results to `aggregateTeam` from `aminus/team`. |
| `compareBuilds`, `compareWeapons`, `compareArtifacts` | Map candidates and recalculate stats, buffs, and score in caller code. |
| `optimizeArtifactsForScenario` | Pass a team-aware `score` callback to `optimizeKqmcArtifacts`. |
| `character_damage({ mode: "Talent" })` | Omit `mode`; supply `motionValue`. |
| `character_damage({ mode: "AdditiveTalent" })` | Omit `mode`; supply `additiveDamage`. |
| `reaction_damage({ kind: "Amplifying" })` | Use `amplify(baseDamage, factor, options)`. |
| Additive `reaction_damage` | Use `additiveReactionBase` in a direct hit. |
| Negative workbook defense shred / resistance adjustment | Supply positive `defenseReduction`, `defenseIgnore`, or `resistanceReduction`. |

The old positional `dmg_formula`, `calculate_damage`, and optimizer wrappers were removed. `Rotation` takes one array of named `[id, compute]` pairs.

## Numerical scope and evidence

The Kol v5.0.1 workbook fixtures (`Kol's Calc Template.xlsx`, SHA-256 `8456a9721cd043c94c8554856fc1b2b97adcf7dbf558adae1c06a30f10b5683b`) retain independent expected values for `Single Char!Q47/C7/C8` and `Team!Q88/Q90/Q157/Q226/Q295/C8:F8/G10:G11`. The library bundles no Kol catalog. The fixture inputs are explicit resolved stats and talent multipliers, so these tests verify arithmetic and aggregation rather than character or gear lookup.

| Deliberate difference | Reason |
| --- | --- |
| Precise level curve, including levels 91-100 | The older workbook rounds the level-90 factor to 1446.9. The core uses the [KQM TCL player curve](https://github.com/KQM-git/TCL/blob/master/src/data/elemental_curves/player.json), retrieved 2026-09-27. |
| Superconduct 1.5, Electro-Charged 2 per tick, Shattered 3, Overloaded 2.75 | Current [KQM transformative reaction multipliers](https://library.keqingmains.com/combat-mechanics/elemental-effects/transformative-reactions), checked 2026-09-27, differ from Kol's saved version. |
| High resistance uses `1 / (4 * resistance + 1)` from 75% upward | The [KQM damage formula](https://library.keqingmains.com/combat-mechanics/damage/damage-formula), checked 2026-09-27, differs from Kol's linear branch. |
| Aggravate and Spread return additive base damage | Their base damage is added to the triggering hit before its crit, damage, defense, and resistance factors. The workbook has an inconsistent transformative Spread selector. |
| No character/set-specific calculation | Weapon passives, artifact set effects, constellations, donor scaling, healing, Clam, and buff timing are caller calculations. Kol's healing and weapon-proc rows also contain inconsistent references. |

The universal artifact tables remain in core. The ordinary four-star main-stat table was corrected from [Genshin Optimizer's maintained data](https://github.com/frzyc/genshin-optimizer/blob/master/libs/gi/stats/Data/Artifacts/artifact_main.json), retrieved 2026-09-27. KQMC's 80% four-star approximation remains confined to its optimization path. Lunar reactions and gauge/timing simulation are outside this library's current formula coverage.

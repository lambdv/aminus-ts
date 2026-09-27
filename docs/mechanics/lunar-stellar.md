# Lunar and Stellar damage: first implementation slice

Retrieved 2026-09-27. Primary source: [Damage § Lunar and Stellar Glimmer Reaction Damage](https://genshin-impact.fandom.com/wiki/Damage#Lunar_and_Stellar_Glimmer_Reaction_Damage). Reaction lifecycle pages: [Lunar](https://genshin-impact.fandom.com/wiki/Lunar_Reaction), [Stellar](https://genshin-impact.fandom.com/wiki/Stellar_Glimmer_Reaction), [Lunar-Charged](https://genshin-impact.fandom.com/wiki/Lunar-Charged), [Lunar-Bloom](https://genshin-impact.fandom.com/wiki/Lunar-Bloom), [Lunar-Crystallize](https://genshin-impact.fandom.com/wiki/Lunar-Crystallize), [Stellar-Conduct](https://genshin-impact.fandom.com/wiki/Stellar-Conduct), [Stellar Swirl](https://genshin-impact.fandom.com/wiki/Stellar_Swirl). Exact page revision was not recorded; recheck when game rules change. Numerical tests here use hand-calculated examples from the stated formula, not independently measured in-game data.

## Implemented as pure kernels

`directReactionBreakdown`: `(coefficient × ability × scaling × base multiplier × (1 + reaction base bonus) × (1 + 6EM/(EM+2000) + reaction bonus) + additive reaction base damage) × (1 + elevation) × RES × CRIT`. Coefficients: Lunar-Charged 3, Lunar-Bloom 1, Lunar-Crystallize 1.6, Stellar-Conduct 1–2 (field count), Stellar Swirl 1. The caller supplies the talent coefficient, calculated scaling stat, talent-specific multiplier, damage element, field count if applicable, and applicable buffs. This does **not** simulate talent conditions.

`indirectReactionBreakdown`: individual `coefficient × level multiplier × (1 + reaction base bonus) × (1 + 6EM/(EM+2000) + reaction bonus) × (1 + elevation) × RES × CRIT`; rank each result and apply weights 0.6, 0.3, 0.05, 0.05, with absent ranks omitted. Indirect coefficients: Lunar-Charged 3, Lunar-Crystallize 1.6, Stellar Swirl initial Anemo 0.75, vortex Cryo level 1/2 respectively 2/3. Expected damage enumerates the CRIT outcome of each contributor before ranking (at most four contributors). `weightedDamage` is the expected weighted contribution, not an assertion of in-game ownership. For non-expected modes, all contributors are forced to the chosen CRIT outcome. The returned breakdown does not yet mark whether the highest outcome CRIT, which matters for on-CRIT passives.

`resolveReaction` only converts eligible base reactions when a matching party enabler is explicitly provided; it does not resolve enabler passives, party stats, or simultaneous aura applications.

`stellarConductCoefficient` and `polestarElementalBonus` accept a **sampled** 0–12 count; counting applications and tracking field membership are not yet implemented. The creating hit must be excluded by the caller. Ordinary damage bonuses and defense do not enter these reaction damage equations. `ReactionBonus` on a character still contributes to the reaction bonus term; additional scoped modifiers are supplied per call.

## Unsupported / next decisions

- No team effect engine, stacking/uniqueness resolution, resource lifecycle, aura/ICD simulation, or timeline yet. A Lunar-Bloom or Stellar-Conduct **trigger** should not be fed to the direct kernel as though it dealt damage; direct damage is from a classified talent.
- Indirect contributor selection is caller-supplied; validate correct Hydro/Electro, Hydro/Geo, or Cryo/Anemo applications externally. Wiki note 7 on Cryo Stellar Swirl contributors and chain reaction edge cases need dedicated fixtures.
- Damage element of direct hits is talent-specific; caller supplies it. No general-purpose elemental compatibility restriction is inferred.
- Verify individual buff stacking, snapshot rules, resistance behavior of special edge cases, rank ties, and exact level-table provenance against independent evidence before treating these kernels as parity certified.
- Add team-resolution and runtime state per `LUNAR_STELLAR_ROADMAP.md`; avoid adapting the old transformative `reaction_damage` formula.

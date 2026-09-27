# Aminus: Lunar and Stellar mechanics roadmap

Planning baseline: 2026-09-27; current package version: 3.0.0.

## Goal

Extend Aminus into a source-backed reaction and team-damage library with five new reaction types, explainable calculations, deterministic timed effects, and optimizer integration.

Recommended architecture: pure damage formulas → party/conversion resolution → optional event timeline. Keep each layer independently usable.

## Current code and gaps

| Existing surface | Capability | Required extension |
| --- | --- | --- |
| `src/core/formulas.ts` | Direct, transformative, additive, and amplified damage | Dedicated Lunar/Stellar formulas and breakdowns |
| `src/core/stat.ts` | `StatTable`, single-character `DamageCompute`, summed `Rotation` | Scoped reaction modifiers, party inputs, separate timed rotation API |
| `src/core/multipliers.ts` | Average CRIT, DEF, RES, amplification | Reusable explicit CRIT modes and verified family-specific factors |
| `src/team.ts` | Aggregates caller-calculated damage by owner | Team evaluation and multi-contributor attribution |
| `src/core/optimizer.ts` | Scores a candidate through `DamageCompute` | Recompute team buffs and shared reactions for every candidate |
| `src/data/reaction-levels.ts` | Level-dependent transformative bases | Versioned reaction rules with source provenance |
| `README.md`, `manual.md`, `src/index.ts` | Documentation and public exports | Working public-package examples and new exports |

`reaction_damage` currently assumes transformative EM scaling and ignores CRIT, ordinary damage bonuses, and DEF. `character_damage` applies ordinary damage bonuses and DEF. Neither is a safe default implementation for the new families. `ReactionBonus` is currently a single undifferentiated stat. `Rotation` has no timing or reaction ownership model. The README still references `dmg_formula`, which is absent from the inspected formula implementation.

## Mechanics inventory

The following describes the retrieved wiki pages; exact numerical damage formulas still require source verification.

| Reaction | Conversion | Outputs and state to model |
| --- | --- | --- |
| Lunar-Charged | Electro-Charged, with an appropriate party enabler | Electro thundercloud damage; multiple elemental contributors; independently support direct talent damage classified as Lunar-Charged |
| Lunar-Bloom | Bloom, with an appropriate party enabler | Produces normal/Bountiful cores plus Verdant Dew; trigger itself does no Lunar-Bloom damage; talents consume/use resources to deal it |
| Lunar-Crystallize | **Hydro** Crystallize only | Three Moondrifts; every third trigger initiates Harmony projectiles; shared contributors and separate direct talent damage |
| Stellar-Conduct | Superconduct, with an appropriate party enabler | Trigger itself does no damage; Starlight Prism/Polestar Field; direct talent damage can be Cryo or Electro |
| Stellar Swirl | **Cryo** Swirl only | Initial Anemo damage, delayed Cryo vortex explosion, vortex levels, and direct talent damage |

Important state details from the retrieved pages:

- Lunar-Charged: cloud lasts 6 seconds, refreshed by triggers; standard damage cadence is 2 seconds; aura eligibility and consumption matter. The page marks a radius claim as needing verification.
- Lunar-Bloom: Verdant Dew generation uses a 2.5-second window/cadence, with a capacity of 3. Generation refresh and exact boundary ordering need explicit fixtures. Core damage retains its own classification.
- Lunar-Crystallize: distinguish trigger count, Harmony activation, and its three projectiles. Moondrifts also count as Geo constructs.
- Stellar-Conduct: Prism lasts 7 seconds. Every 4 seconds, recorded qualifying Cryo/Electro applications determine a 4-second buff. Exclude the initial Prism-creating hit and hits blocked by application ICD. For recorded count `n`, capped at 12, the listed coefficient is `1` at zero and `1.4 + 0.05*n` otherwise. Listed Cryo/Electro DMG Bonus is `0.20` at zero and `0.28 + 0.01*n` otherwise; field Physical RES reduction is `0.40`.
- Stellar Swirl: listed vortex lifetime is 3 seconds; third trigger raises it to level 2; three additional triggers cause immediate explosion. Radiance: Stellar Swirl lasts 8 seconds. The page is explicitly incomplete; verify ownership, range, refresh, and simultaneous-trigger behavior.
- Conversion capability, Moonsign level, Radiance state, and a talent's damage classification are separate concepts. An enabler need not own the resulting damage.

## Phase 0 — Freeze a mechanics specification

Deliver `docs/mechanics/lunar-stellar.md` and source-backed numerical fixtures before implementing formulas.

1. Record source URL, page revision where available, retrieval date, applicable game version, and verification status for every rule.
2. Verify direct versus reaction-generated formulas separately: base coefficients, level scaling, EM curves, CRIT rules, DEF treatment, ordinary bonus eligibility, resistance element, additive damage ordering, Base DMG increases, and Elevation.
3. Verify shared-contributor eligibility, ranking/weighting, snapshots, and CRIT aggregation for Lunar-Charged and Lunar-Crystallize. Do not assume that sorting expected damage gives the correct expected result when CRIT can affect ranking.
4. Resolve multiple-enabler stacking and caps; verify whether stat-derived bonuses update dynamically or snapshot.
5. Verify Stellar Swirl's initial hit and explosion formulas independently, including ownership and level-dependent coefficients.
6. Obtain independently calculated expected values or corroborating theorycrafting/in-game evidence. Existing workbook parity is a legacy regression baseline, not proof of new mechanics.

Exit: each supported output has a complete formula, attribution rule, and independently derived example. Incomplete rules remain explicitly unsupported rather than receiving guessed constants.

## Phase 1 — Typed reaction and modifier model

Suggested new modules under `src/core/reactions/`: `types.ts`, `modifiers.ts`, `conversion.ts`, `lunar.ts`, `stellar.ts`, and `breakdown.ts`.

- Define reaction identity separately from element and attack category. Lunar/Stellar are not new elements or ordinary attack types.
- Use discriminated input types for direct talent damage, generated shared reaction damage, and resource/state-only triggers.
- Identify actor, enabler, contributors, and target independently with stable IDs.
- Introduce structured modifiers scoped by family, reaction, output component, recipient, and source. Separate reaction DMG Bonus, Base DMG increase, additive base damage, CRIT modifiers, and Elevation.
- Keep effect provenance and stacking rules in structured records; a flat stat total cannot represent uniqueness, duration, or owner restrictions.
- Define resolved party capabilities with reaction-specific conversions and explicit Moonsign state. Radiance belongs to per-character runtime state.
- Validate finite values, supported elements, contributor IDs, resource bounds, and component-specific options.

Exit: invalid combinations are rejected; ordinary Swirl/Crystallize variants do not accidentally convert; old formula APIs retain their current behavior.

## Phase 2 — Pure formula kernels

Implement verified kernels with explicit inputs and no hidden state.

Suggested API names (design proposals):

- `lunarDamageBreakdown(input, context)`
- `stellarDamageBreakdown(input, context)`
- `lunar_damage(options): DamageCompute` and `stellar_damage(options): DamageCompute` for single-owner direct damage
- `evaluateSharedReaction(input, party, target)` for multi-contributor generated damage

Breakdowns should expose component, damage element, owner/contributors, raw base, EM factor, eligible modifiers, CRIT policy, resistance factor, DEF treatment, aggregation weights, instance count, and final total. Support non-CRIT, CRIT, and expected damage where mathematically meaningful; shared outcomes must describe their CRIT policy explicitly.

Implement in order: direct Lunar damage → shared Lunar-Charged → Lunar-Crystallize Harmony → direct Stellar-Conduct → Stellar Swirl initial/explosion/direct components. Formula kernels may accept already-resolved field coefficients and resource state; callers can calculate spreadsheet-style rotations immediately.

Exit: each kernel passes Phase 0 fixtures, modifier isolation checks, and boundary checks. Formula evaluation must not mutate caller stats.

## Phase 3 — Party resolution and effects

Extend the optional team surface with a `TeamContext` and `evaluateTeam` API. Keep `aggregateTeam` useful as the final reporting utility.

- Resolve conversion passives from party membership and current stats.
- Evaluate capped ATK/DEF/HP/EM-derived Base DMG bonuses with verified stacking policies.
- Resolve self, active-character, and party buffs; source uniqueness; conditional Moonsign/Radiance effects; and snapshot policy.
- Represent effect triggers distinctly: reaction triggered, reaction damage dealt, elemental application, and ordinary hit.
- Produce one canonical damage event with an attribution breakdown. Ensure owner shares sum to the event total and never count one shared event once per contributor.
- Start with small curated effect definitions that cover the mechanics: a conversion passive, direct reaction talent, shared reaction, unique party artifact buff, and capped stat-derived bonus. Expand character/weapon/artifact coverage through the same effect contracts.

Exit: mixed Lunar/Stellar parties resolve correctly; duplicate sources obey verified stacking; changing an enabler's stats updates downstream damage.

## Phase 4 — Deterministic event timeline

Add an optional `src/core/timeline/` layer with ordered events, a clock, explicit state, and replayable traces. Retain the existing summed `Rotation` for fixed-count calculations.

First accept caller-supplied elemental applications, trigger events, target IDs, and field membership. Add automatic aura/gauge/ICD simulation as a subsequent milestone with its own specification.

State machines:

1. Thundercloud creation, refresh, target eligibility, scheduled ticks, and contributor tracking.
2. Verdant Dew generation/cap/consumption plus independent core lifecycle.
3. Moondrift creation, trigger counter, Harmony and projectile emission.
4. Polestar lifetime, qualifying application counts, sampling windows, buff expiry, and Radiance membership.
5. Stellar Vortex lifetime, trigger count/level, early explosion, and Radiance refresh.
6. Character effect durations, stacks, source uniqueness, and on/off-field transitions.

Specify same-time ordering for application, trigger, damage, buff creation, resource consumption, and expiry. Scope fields to encounters/targets so unrelated enemies cannot share counts accidentally. Resolve overlap and refresh behavior from sources.

Exit: deterministic replay, exact-boundary tests, no duplicate explosions/ticks, and inspectable resource/buff transitions.

## Phase 5 — Optimizer and usability

- Adapt a team objective into `DamageCompute`: replace the optimized actor's candidate stats, resolve affected buffs/contributors again, and score total team damage.
- Include teammates' damage changes caused by candidate-dependent buffs. Avoid closures that freeze the optimized actor's initial ATK/EM/CRIT or contributor ranking.
- Cache only candidate-independent work; reset timeline state between evaluations.
- Check capped buffs and changing contributor ranks against exhaustive small search cases. Current greedy-plus-one-roll-repair search should not be presented as globally optimal for these objectives.
- Add examples for direct Lunar hits, shared Lunar-Charged, Lunar-Bloom with ordinary cores, Lunar-Crystallize Harmony, Polestar sampling, and both Stellar Swirl damage elements.
- Refresh README/manual and public exports. Add proposed optional subpath exports only when their module boundaries are stable.

Exit: candidate-order-independent team scores, runnable public-package examples, and documented support levels: formula-only, resolved-party, or timed simulation.

## Validation and release gates

- Preserve existing formula, KQMC, workbook, Kol, and team regression suites.
- Numerical fixtures cover zero/high EM, CRIT clamping, negative/high RES, level limits, zero instances, Base DMG caps, additive ordering, and eligible/ineligible modifiers.
- Conversion fixtures cover missing enablers, multiple enablers, Hydro-only Crystallize, Cryo-only Swirl, and simultaneous family availability.
- Shared-reaction fixtures cover contributor permutations, ties, changed ranking, distinct levels/stats, and attribution conservation.
- State fixtures cover resource caps, third/sixth trigger boundaries, Prism's excluded first hit, 0/1/12 recorded applications, expiry/refresh boundaries, and repeated scoring.
- Run `npm test -- --runInBand` and `npm run build` for implementation milestones; compile consumer examples against package exports.
- Additive APIs can ship incrementally in 3.x if compatible. Reserve 4.0 for actual breaking changes to existing reaction/stat/rotation semantics.

Recommended first delivery: Phase 0 + Phase 1 + verified direct Lunar formulas. Then shared Lunar damage and party resolution, followed by Stellar kernels and timeline state. This gives useful calculator support before the larger simulation layer is complete.

## Sources and unresolved evidence

Retrieved for this plan:

- https://genshin-impact.fandom.com/wiki/Lunar_Reaction
- https://genshin-impact.fandom.com/wiki/Lunar-Charged
- https://genshin-impact.fandom.com/wiki/Lunar-Bloom
- https://genshin-impact.fandom.com/wiki/Lunar-Crystallize
- https://genshin-impact.fandom.com/wiki/Stellar_Glimmer_Reaction
- https://genshin-impact.fandom.com/wiki/Stellar-Conduct
- https://genshin-impact.fandom.com/wiki/Stellar_Swirl

The linked `Damage` article's relevant formula sections were not successfully retrieved during this review. Exact family damage equations, shared weighting, and modifier ordering therefore remain Phase 0 verification work. Stellar Swirl's page also declares missing information. The timings above are planning inputs from these pages, not a claim of independent in-game verification.

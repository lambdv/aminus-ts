2026-02-15T00:00:00Z - Decisions log (appended)

Duplication inventory decisions:

1) Main stat value tables
  - Owner: tests/fixtures/main-affix.ts (canonical)
  - Decision: canonicalize in artifacts module by importing MAIN_STAT_VALUES from fixtures. Reason: fixtures contain full rarity+level tables and are the authoritative snapshot used by tests; using them avoids numeric drift and ensures coverage for all rarity/level combinations.

2) Substat roll tiers and values
  - Owner: tests/fixtures/substats.ts (canonical)
  - Decision: artifacts.ts will delegate substat roll tiers and roll values to SUBSTAT_ROLL_TIERS and helper getSubstatRollValue from fixtures. Reason: fixtures provide explicit tier arrays and cover rarities 1-5 with exact numeric tiers.

3) Roll tier selection probabilities and upgrade counts
  - Owner: tests/fixtures/substats.ts (canonical)
  - Decision: Keep ROLL_TIER_PROBABILITIES and UPGRADE_ROLL_COUNTS in fixtures as ground truth; artifact generation code will consume these constants for selection logic. Reason: statistical tests depend on these distributions.

4) Roll quality vs tier mapping
  - Owner: src/core/artifacts.ts (canonical conversion utilities)
  - Decision: Implement an explicit conversion helper in artifacts.ts mapping tier indices (0..3) to RollQuality (MAX..LOW) and multiplier. Reason: artifacts.ts already exposes RollQuality enum and builder logic that uses multipliers; centralized mapping maintains backward compatibility and correctness.

5) Max-rolls / upgrade scheduling heuristics
  - Owner: src/core/artifacts.ts (canonical)
  - Decision: Keep heuristics and builder constraint logic in artifacts.ts but source numeric parameters (upgrade interval, initial counts) from fixtures. Reason: builder semantics are internal behavior; artifacts.ts is the natural owner for constraints, but should not hardcode numeric constants that live in fixtures.

6) API compatibility
  - Owner: src/core/artifact-generator.ts (compatibility facade)
  - Decision: artifact-generator.ts will remain a thin wrapper that re-exports/delegates to artifacts.ts canonical implementation. Reason: tests and external consumers rely on legacy import paths.

Justifications summary:
- Coverage: fixtures are more complete for numeric tables, ensure no loss of detail.
- Correctness: tests are written against fixture values; using fixtures avoids regression.
- Compatibility: artifacts.ts provides higher-level builder semantics; keep it as owner of builder/constraint heuristics and conversion utilities.

If any conflict arises where both module and fixtures contain differing numeric values, priority order will be: fixtures (highest), artifacts.ts adapter, artifact-generator facade (delegation only).

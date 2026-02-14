2026-02-15T00:00:00Z - Appended findings

Notable caveats and operational learnings from duplication inventory:

- Artifact data is split between runtime code (src/core/artifacts.ts) and frozen fixtures (tests/fixtures/*). Rely on fixtures for authoritative numeric tables during migration to avoid test drift.

- artifacts.ts currently contains placeholder and partial implementations for substat/main stat values (getSubStatValue, getMainStatValue) which diverge from fixtures in coverage and some numeric entries. These must be reconciled by delegating to fixture-backed tables or collapsing fixtures into a canonical src-side resource.

- Roll quality semantics are represented differently: artifact-generator treats roll tiers as ordinal indices (0=max..3=low) with probabilistic selection, while artifacts.ts exposes a RollQuality enum (MAX/HIGH/MID/LOW/AVG) and multiplier. Mapping between these is required and should be documented as a conversion utility (tier->RollQuality multiplier) in canonical module.

- Upgrade behavior (upgrade interval, upgrade roll counts, and upgrade selection) is fully specified in fixtures (UPGRADE_INTERVAL, UPGRADE_ROLL_COUNTS, UPGRADE_TARGET_UNIFORM). artifacts.ts implements constraints/max-roll heuristics for builder utilities; ensure these heuristics use fixture constants rather than independently-coded numbers.

- Export ownership: tests import fixtures and artifact-generator directly. Migration must preserve artifact-generator API as a compatibility façade while making artifacts.ts canonical owner of logic. Tests remain the ultimate guardrail.

- Implementation caveat: some naming differences exist (e.g., MAIN_STAT_VALUES vs internal mainStatValues). Migration must normalize symbol names but keep compatibility façade names intact.

- Suggested immediate next steps (non-blocking behavioural changes):
  - Add a thin adapter in artifacts.ts to import fixture tables and expose canonical getters (getMainStatValue(stat, rarity, level), getSubstatRollValue(stat, rarity, tier)).
  - Add conversion utils: rollTierIndex -> RollQuality and RollQuality -> multiplier; centralize in artifacts.ts.
  - Keep artifact-generator.ts exporting legacy functions but delegate to artifacts.ts implementations.

Appendix: timestamps and provenance
- Source inspected: src/core/artifacts.ts, src/core/artifact-generator.ts, tests/fixtures/main-affix.ts, tests/fixtures/substats.ts

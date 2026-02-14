# Artifacts Logic Unification Plan

## TL;DR

> **Quick Summary**: Consolidate artifact generation/stat logic into `src/core/artifacts.ts` as the canonical implementation while preserving the existing `artifact-generator` public API first through a compatibility layer.
>
> **Deliverables**:
> - Single source of truth for generation logic in artifacts module
> - Backward-compatible `@/core/artifact-generator` API (tests unchanged)
> - Removed duplicated value/roll logic between modules
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 -> Task 2 -> Task 4 -> Task 6 -> Task 8

---

## Context

### Original Request
Create a plan to merge logic differences between artifact generation modules so `artifact-generator` is no longer required as a separate logic owner, with previous API compatibility as top priority. Artifact-generator tests can stay.

### Interview Summary
**Key Discussions**:
- Compatibility-first migration is required.
- Preferred architecture is artifacts module owning logic.
- Existing artifact-generator tests should remain and continue passing.

**Research Findings**:
- Duplication exists across stat values, roll tiers/quality, and upgrade behavior.
- Public API currently exports `./core/artifact-generator.js` from `src/index.ts`.
- Tests import `@/core/artifact-generator` directly.

### Metis Review
**Identified Gaps (addressed in this plan)**:
- Need explicit guardrails to prevent API breakage during consolidation.
- Need explicit no-test-edit boundary.
- Need explicit verification for export parity and behavior parity.
- Need staged migration sequence (consolidate -> shim -> verify -> optional removal).

---

## Work Objectives

### Core Objective
Make `src/core/artifacts.ts` the canonical home for artifact generation logic and eliminate duplicated implementations while preserving current external API and test behavior.

### Concrete Deliverables
- Canonical generation/stat selection/value lookup/upgrade logic in `src/core/artifacts.ts`.
- Compatibility re-exports from `src/core/artifact-generator.ts` to keep imports working.
- Stable package-level exports in `src/index.ts`.
- Passing unit and integration suites without changing artifact-generator tests.

### Definition of Done
- [ ] `npm test` passes with no test-file edits.
- [ ] Imports from `@/core/artifact-generator` still resolve and behave identically for covered scenarios.
- [ ] Duplicated stat/roll logic removed or delegated to canonical artifacts implementation.

### Must Have
- API compatibility first (function names, argument contracts, result shapes, and export paths).
- No behavior regressions for existing deterministic/statistical tests.
- Clear ownership: artifacts module is source of truth.

### Must NOT Have (Guardrails)
- Do not modify `tests/unit/core/artifact-generation.test.ts` or `tests/int/core/artifact-distribution.test.ts` for migration convenience.
- Do not change wiki fixture semantics in `tests/fixtures/main-affix.ts` or `tests/fixtures/substats.ts`.
- Do not remove `src/core/artifact-generator.ts` in same step as logic migration unless full parity is proven and imports are migrated.
- Do not introduce new public API names unless optional and non-breaking.

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> All acceptance criteria are agent-executable (commands/assertions only).

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: Tests-after
- **Framework**: Jest (`npm test`)

### Agent-Executed QA Scenarios (MANDATORY)

Scenario: Export parity for compatibility surface
  Tool: Bash
  Preconditions: TypeScript compiles
  Steps:
    1. Run `npm run build`
    2. Run `node -e "import('./dist/index.js').then(m=>console.log(Object.keys(m).sort().join('\n')))"`
    3. Assert expected artifact-generator symbols are present in output
  Expected Result: Legacy export names remain available
  Failure Indicators: Missing symbol names or runtime import error
  Evidence: Terminal output capture

Scenario: Legacy import path still works
  Tool: Bash
  Preconditions: Build completed
  Steps:
    1. Run `node -e "import('./dist/core/artifact-generator.js').then(m=>console.log(typeof m.generateArtifact, typeof m.selectMainStat))"`
    2. Assert output equals `function function`
  Expected Result: Compatibility module exports callable functions
  Failure Indicators: Type mismatch, module-not-found, or throw during import
  Evidence: Terminal output capture

Scenario: Statistical regression guard
  Tool: Bash
  Preconditions: Test environment available
  Steps:
    1. Run `npm test -- tests/int/core/artifact-distribution.test.ts`
    2. Assert exit code 0
  Expected Result: Distribution tests still pass within tolerance
  Failure Indicators: Any failing statistical assertions
  Evidence: Jest output

Scenario: Deterministic behavior guard
  Tool: Bash
  Preconditions: Test environment available
  Steps:
    1. Run `npm test -- tests/unit/core/artifact-generation.test.ts`
    2. Assert exit code 0
  Expected Result: Deterministic rule tests pass with no test modifications
  Failure Indicators: Failing deterministic assertions
  Evidence: Jest output

---

## Execution Strategy

### Parallel Execution Waves

Wave 1 (Start Immediately):
- Task 1: Build API/behavior parity map
- Task 3: Build duplication inventory and ownership matrix

Wave 2 (After Wave 1):
- Task 2: Define canonical artifacts API contract
- Task 4: Implement canonical logic moves in artifacts module

Wave 3 (After Wave 2):
- Task 5: Convert artifact-generator into compatibility facade
- Task 6: Stabilize index exports and import graph
- Task 7: Run full verification suite
- Task 8: Cleanup deprecated internals/document migration notes

Critical Path: 1 -> 2 -> 4 -> 5 -> 7
Parallel Speedup: ~30-40% vs strict sequential execution

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|----------------------|
| 1 | None | 2, 4, 5 | 3 |
| 2 | 1 | 4, 5 | None |
| 3 | None | 4 | 1 |
| 4 | 1, 2, 3 | 5, 7 | None |
| 5 | 2, 4 | 6, 7 | None |
| 6 | 5 | 7 | None |
| 7 | 4, 5, 6 | 8 | None |
| 8 | 7 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|--------------------|
| 1 | 1, 3 | `task(category="quick", load_skills=["git-master"], run_in_background=false)` |
| 2 | 2, 4 | `task(category="unspecified-high", load_skills=["git-master"], run_in_background=false)` |
| 3 | 5, 6, 7, 8 | `task(category="quick", load_skills=["git-master"], run_in_background=false)` |

---

## TODOs

 - [x] 1. Build compatibility baseline map

  **What to do**:
  - Enumerate current exports and signatures from `src/core/artifact-generator.ts`, `src/core/artifacts.ts`, and `src/index.ts`.
  - Record current result-shape contracts (`GeneratedArtifact`, substat arrays, slot/stat types).
  - Freeze a baseline list of behavior-critical test expectations from existing unit/integration tests.

  **Must NOT do**:
  - Do not change any implementation yet.

  **Recommended Agent Profile**:
  - **Category**: `quick` (inventory and mapping task)
  - **Skills**: `git-master` (safe repo inspection and change isolation)
  - **Skills Evaluated but Omitted**: `playwright` (no browser flow)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 3)
  - **Blocks**: 2, 4, 5
  - **Blocked By**: None

  **References**:
  - `src/core/artifact-generator.ts` - legacy API and current generation internals.
  - `src/core/artifacts.ts` - destination module and existing builder logic.
  - `src/index.ts` - package public export surface.
  - `tests/unit/core/artifact-generation.test.ts` - deterministic compatibility expectations.
  - `tests/int/core/artifact-distribution.test.ts` - statistical compatibility expectations.

  **Acceptance Criteria**:
  - [ ] A written parity checklist exists in implementation notes with symbol-level mapping.
  - [ ] No source files modified in this task.

- [ ] 2. Define canonical artifacts contract (compatibility-first)

  **What to do**:
  - Define which functions/types move to `artifacts.ts` as canonical owners.
  - Keep existing external names/signatures intact for compatibility.
  - Define facade policy for `artifact-generator.ts` (re-export/delegate only).

  **Must NOT do**:
  - Do not introduce breaking renames.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (API design with compatibility constraints)
  - **Skills**: `git-master`
  - **Skills Evaluated but Omitted**: `frontend-ui-ux` (irrelevant domain)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: 4, 5
  - **Blocked By**: 1

  **References**:
  - `src/core/artifact-generator.ts` - source signatures that must stay stable.
  - `src/core/artifacts.ts` - target ownership boundary.
  - `tests/unit/core/artifact-generation.test.ts` - consumer-visible behavior contract.

  **Acceptance Criteria**:
  - [ ] Explicit mapping table exists: legacy symbol -> canonical implementation location.
  - [ ] Mapping contains zero breaking signature changes.

 - [x] 3. Build duplication inventory and resolve precedence

  **What to do**:
  - Identify every duplicated rule/value path: main stat values, substat tiers, roll quality/tier conversions, upgrade count logic.
  - Choose canonical source for each (prefer fixture-backed logic where coverage is broader).

  **Must NOT do**:
  - Do not alter fixtures.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `git-master`
  - **Skills Evaluated but Omitted**: `dev-browser` (not web automation)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: 4
  - **Blocked By**: None

  **References**:
  - `tests/fixtures/main-affix.ts` - authoritative table for main stat weights/values.
  - `tests/fixtures/substats.ts` - authoritative table for substat/roll behavior.
  - `src/core/artifacts.ts` - existing hardcoded duplicated subsets.
  - `src/core/artifact-generator.ts` - fixture-backed implementations to preserve.

  **Acceptance Criteria**:
  - [ ] Duplication matrix documents each overlap with chosen owner.
  - [ ] Chosen owner for each overlap is justified by coverage/accuracy.

- [ ] 4. Consolidate canonical logic into artifacts module

  **What to do**:
  - Move/delegate generation internals into `src/core/artifacts.ts` as canonical implementations.
  - Replace duplicated hardcoded value paths in artifacts with canonical lookup functions.
  - Ensure `ArtifactBuilder.generate` delegates to canonical local logic (no separate logic fork).

  **Must NOT do**:
  - Do not break existing `ArtifactBuilder` public methods.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `git-master`
  - **Skills Evaluated but Omitted**: `playwright` (not UI)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: 5, 7
  - **Blocked By**: 1, 2, 3

  **References**:
  - `src/core/artifacts.ts` - destination for canonical logic.
  - `src/core/artifact-generator.ts` - source behavior to preserve.
  - `tests/fixtures/main-affix.ts` - keep value/weight parity.
  - `tests/fixtures/substats.ts` - keep roll and upgrade parity.

  **Acceptance Criteria**:
  - [ ] Artifacts module contains canonical generation logic paths.
  - [ ] No remaining duplicated hardcoded value logic where canonical helper exists.

- [ ] 5. Convert artifact-generator into compatibility facade

  **What to do**:
  - Refactor `src/core/artifact-generator.ts` to export the previous API by delegating/re-exporting from `src/core/artifacts.ts`.
  - Keep type exports and function names unchanged for tests and external consumers.

  **Must NOT do**:
  - Do not delete `artifact-generator.ts` in this phase.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `git-master`
  - **Skills Evaluated but Omitted**: `frontend-ui-ux`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: 6, 7
  - **Blocked By**: 2, 4

  **References**:
  - `src/core/artifact-generator.ts` - compatibility surface to preserve.
  - `src/core/artifacts.ts` - canonical implementation provider.
  - `tests/unit/core/artifact-generation.test.ts` - no import path changes allowed.

  **Acceptance Criteria**:
  - [ ] Imports from `@/core/artifact-generator` still work without test edits.
  - [ ] Exported symbol names/signatures remain unchanged.

- [ ] 6. Stabilize package exports and import graph

  **What to do**:
  - Keep `src/index.ts` export behavior stable.
  - Remove cyclical or redundant imports introduced by consolidation.
  - Ensure artifacts and compatibility facade compile cleanly.

  **Must NOT do**:
  - Do not change external import paths used by existing consumers.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `git-master`
  - **Skills Evaluated but Omitted**: `dev-browser`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: 7
  - **Blocked By**: 5

  **References**:
  - `src/index.ts` - public barrel exports.
  - `src/core/artifacts.ts` - canonical source.
  - `src/core/artifact-generator.ts` - compatibility facade.

  **Acceptance Criteria**:
  - [ ] Build succeeds with stable export surface.
  - [ ] No unresolved imports or circular runtime errors.

- [ ] 7. Verify behavior parity with automated checks

  **What to do**:
  - Run targeted artifact tests and full test suite.
  - Run API smoke checks for legacy import and package export parity.

  **Must NOT do**:
  - Do not accept partial pass results.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `git-master`
  - **Skills Evaluated but Omitted**: `playwright`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: 8
  - **Blocked By**: 4, 5, 6

  **References**:
  - `tests/unit/core/artifact-generation.test.ts`
  - `tests/int/core/artifact-distribution.test.ts`
  - `package.json` - canonical test/build commands.

  **Acceptance Criteria**:
  - [ ] `npm run build` exits 0.
  - [ ] `npm test -- tests/unit/core/artifact-generation.test.ts` exits 0.
  - [ ] `npm test -- tests/int/core/artifact-distribution.test.ts` exits 0.
  - [ ] `npm test` exits 0.
  - [ ] Legacy API smoke command succeeds.

- [ ] 8. Cleanup and deprecation posture (non-breaking)

  **What to do**:
  - Remove dead duplicated helpers no longer used.
  - Add concise deprecation note (if desired) indicating `artifact-generator` is now facade-only.
  - Document follow-up path for future major version to remove facade if wanted.

  **Must NOT do**:
  - Do not remove compatibility facade in this compatibility-first milestone.

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: `git-master`
  - **Skills Evaluated but Omitted**: `frontend-ui-ux`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: None
  - **Blocked By**: 7

  **References**:
  - `src/core/artifacts.ts`
  - `src/core/artifact-generator.ts`
  - `README.md` (optional note location)

  **Acceptance Criteria**:
  - [ ] No duplicate dead logic remains in active code paths.
  - [ ] Compatibility status is documented for maintainers.

---

## Task-Level QA Matrix (Agent-Executed)

Scenario: Task 1 parity map completeness
  Tool: Bash
  Preconditions: Working tree contains target files
  Steps:
    1. Run `node -e "import('fs');import('path');"` (env sanity)
    2. Run `npm run build`
    3. Assert no symbol mismatch notes remain in parity checklist artifact
  Expected Result: Parity map covers all public symbols
  Failure Indicators: Missing mapped symbols in checklist
  Evidence: Checklist file + terminal output

Scenario: Task 2 contract lock
  Tool: Bash
  Preconditions: Contract mapping doc prepared
  Steps:
    1. Run `npm run build`
    2. Run legacy API smoke import command
    3. Assert exported symbol names match pre-migration list
  Expected Result: Contract remains non-breaking
  Failure Indicators: Missing/renamed symbol
  Evidence: Symbol list diff output

Scenario: Task 3 duplication matrix validity
  Tool: Bash
  Preconditions: Duplication matrix completed
  Steps:
    1. Run `npm run build`
    2. Run `npm test -- tests/unit/core/artifact-generation.test.ts`
    3. Assert tests still pass before consolidation
  Expected Result: Baseline behavior stable before refactor
  Failure Indicators: Baseline test failure
  Evidence: Jest output

Scenario: Task 4 canonical logic integration
  Tool: Bash
  Preconditions: Consolidation changes applied
  Steps:
    1. Run `npm run build`
    2. Run `npm test -- tests/unit/core/artifact-generation.test.ts`
    3. Assert deterministic tests pass
  Expected Result: Canonical logic in artifacts preserves deterministic behavior
  Failure Indicators: Build failure or unit regression
  Evidence: Build + Jest output

Scenario: Task 5 compatibility facade behavior
  Tool: Bash
  Preconditions: Facade changes applied
  Steps:
    1. Run `npm run build`
    2. Run `node -e "import('./dist/core/artifact-generator.js').then(m=>console.log(typeof m.generateArtifact, typeof m.selectMainStat, typeof m.generateSubstats))"`
    3. Assert output contains only `function` entries
  Expected Result: Legacy module path remains fully callable
  Failure Indicators: Import/runtime/type mismatch
  Evidence: Terminal output

Scenario: Task 6 package export stability
  Tool: Bash
  Preconditions: Index/export updates complete
  Steps:
    1. Run `npm run build`
    2. Run `node -e "import('./dist/index.js').then(m=>console.log(['generateArtifact','selectMainStat','ArtifactBuilder'].every(k=>k in m)))"`
    3. Assert output is `true`
  Expected Result: Public barrel export remains stable
  Failure Indicators: Missing public symbol
  Evidence: Terminal output

Scenario: Task 7 statistical parity
  Tool: Bash
  Preconditions: Consolidation + facade complete
  Steps:
    1. Run `npm test -- tests/int/core/artifact-distribution.test.ts`
    2. Assert exit code 0
    3. Run `npm test -- tests/unit/core/artifact-generation.test.ts`
    4. Assert exit code 0
  Expected Result: Distribution and deterministic suites both pass
  Failure Indicators: Any failed assertion
  Evidence: Jest output

Scenario: Task 8 cleanup safety
  Tool: Bash
  Preconditions: Cleanup complete
  Steps:
    1. Run `npm run build`
    2. Run `npm test`
    3. Assert all tests pass and no API break
  Expected Result: Cleanup does not change behavior
  Failure Indicators: Build/test regression
  Evidence: Build + full Jest output

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 4 | `refactor(artifacts): centralize generation logic` | `src/core/artifacts.ts` | targeted artifact unit tests |
| 5-6 | `refactor(api): make artifact-generator a compatibility facade` | `src/core/artifact-generator.ts`, `src/index.ts` | build + API smoke checks |
| 7-8 | `test(core): verify parity and clean duplicate internals` | test/config/doc touchpoints only if needed | full `npm test` |

---

## Success Criteria

### Verification Commands
```bash
npm run build
npm test -- tests/unit/core/artifact-generation.test.ts
npm test -- tests/int/core/artifact-distribution.test.ts
npm test
node -e "import('./dist/core/artifact-generator.js').then(m=>console.log(typeof m.generateArtifact, typeof m.selectMainStat))"
```

### Final Checklist
- [ ] All compatibility-first requirements satisfied.
- [ ] Artifacts module is canonical logic owner.
- [ ] artifact-generator remains available as facade for previous API.
- [ ] Artifact generator tests remain unchanged and passing.
- [ ] No human/manual verification required.

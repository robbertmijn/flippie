# Genealogy model guide

Phase 3 is implemented in [`src/genealogy/model.ts`](../../src/genealogy/model.ts). This guide records the model's public contract, behavior, and verification procedure. The canonical data, traversal, privacy, and performance requirements remain in [`../requirements.md`](../requirements.md); milestone status is tracked in [`../milestones.md`](../milestones.md).

## Model boundary

The genealogy layer consumes the normalized `people`, `places`, and `families` produced by the CSV importer. It is independent of React and CSV column names, so later analysis and visualization features can use it without coupling themselves to the import format.

Call `buildGenealogyIndexes(importResult)` once for a dataset. It creates:

- `peopleById` and `placesById` for direct record lookup;
- `familiesById` for family/union lookup;
- `parentsByChildId`, derived from family-child membership, for ancestor traversal;
- `familiesByParentId` for finding every family in which a person is a parent.

If malformed input assigns a child to more than one biological family, the index retains the first family encountered. This makes traversal deterministic; import validation is responsible for reporting conflicting source data. A person listed in both parent roles is added to a family's parent index only once.

## Ancestor traversal

Use `traverseAncestors(indexes, rootPersonId, maxGeneration)` to expand a root person's ancestry. The depth is inclusive: generation `0` contains the root, generation `1` contains two parent slots, and every subsequent generation contains twice as many slots. Depth must be an integer from `0` through `20`; the upper bound prevents accidental creation of an unmanageably large result.

The result contains a flat `slots` array and the same records grouped in `slotsByGeneration`. Each `AncestorSlot` provides:

- an Ahnentafel-style `slot` number (`1` for the root, `2` and `3` for its parents);
- its zero-based `generation` and the `parent1`/`parent2` path used to reach it;
- optional person and family identifiers plus the resolved person record;
- a `cycle` flag when following that path would revisit a person already on it.

Traversal is slot-based rather than person-based. Missing ancestors remain explicit empty slots through the requested depth, which allows Phase 4 to calculate completeness without reconstructing gaps. Similarly, the same person reached by two legitimate paths occupies both slots; this preserves pedigree collapse for later analysis.

Cycle tracking is local to each path. A cyclic slot is returned and marked, but that branch is not followed any further. Other branches continue normally. `cyclePersonIds` summarizes the people encountered at cyclic slots for that traversal. Use `findAncestorCycles(indexes)` when every person participating in any ancestor cycle in the full dataset is needed, independent of a selected root or depth.

## Verification coverage

The focused model tests verify:

- person lookup plus child-parent and parent-family relationship indexes;
- normalized CSV import data flowing into traversal;
- parents and grandparents, including a repeated ancestor in separate slots;
- missing ancestor slots propagated through deeper generations;
- finite traversal and diagnostics for cyclic ancestry;
- rejection of invalid or unsafe traversal depths.

Run the focused suite while changing the model, then run all project checks:

```bash
npx vitest run src/genealogy/model.test.ts
npm run typecheck
npm run lint
npm test
npm run build
```

Generation completeness, unique-person statistics, and user-facing root selection are intentionally Phase 4 concerns. Consumers should derive those values from the slot result instead of changing traversal to deduplicate people or omit missing slots.

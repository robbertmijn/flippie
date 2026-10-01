# Genealogy model implementation guide

This is the implementation and test plan for Phase 3. Follow the canonical model, traversal, privacy, and performance requirements in [`../requirements.md`](../requirements.md); record completion only in [`../milestones.md`](../milestones.md).

## Intended structure

Build the genealogy layer downstream of import so views never depend on CSV headers. It should expose indexed canonical data and pure traversal results suitable for later analysis and visualization.

At minimum construct:

- `peopleById` and `placesById` for direct record lookup;
- `familiesById` for family/union lookup;
- `parentsByChildId` derived through family-child membership;
- `familiesByParentId` for partner and child navigation.

Do not duplicate imported relationships as mutable parent fields on people. Define how multiple parent-family claims are reported rather than silently choosing one.

## Implementation sequence

1. Add typed index builders that consume a normalized imported dataset.
2. Add tests for two-parent families, each missing-parent case, multiple children, and absent references.
3. Define an ancestor-slot result containing generation, path/slot identity, optional person ID, and repeat/cycle metadata.
4. Traverse parent relationships by slot rather than deduplicating by person ID. The same person in two paths must occupy two filled slots.
5. Track the active path to stop cycles. A cycle finding is not the same as legitimate pedigree collapse on another branch.
6. Add generation summaries with expected slots (`2^g`), filled slots, missing slots, and unique people. Keep unique-person count separate from completeness.
7. Keep the traversal functions pure and independent of React so Phase 4 analysis can reuse them.

Prefer indexed lookup over scanning every family or person at each traversal step. Avoid global mutable caches; memoization, if needed, must be scoped to a dataset and traversal configuration.

## Required test scenarios

Create small, explicit fictional graphs and assert slot paths as well as aggregate counts:

- known parents and grandparents;
- a missing father and a missing mother;
- several generations of missing slots;
- siblings in a multi-child family;
- one ancestor reached through two different paths (pedigree collapse);
- a self-parent cycle and a longer ancestor cycle;
- a requested depth of zero and a deeper traversal;
- an unresolved reference that cannot become a known slot.

For pedigree collapse, assert that filled-slot count includes both occurrences while unique-person count includes the person once. For cycles, assert finite output and an explicit diagnostic.

## Verification

Run focused model tests as they are added, followed by:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Phase 3 is complete only when every exit criterion in [`../milestones.md`](../milestones.md) is implemented and verified. Update that tracker in the same change; do not mark completion based only on scaffolding or types.

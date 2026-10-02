# Core analysis guide

Phase 4 turns the slot-based genealogy traversal into user-facing completeness information. The analysis stays independent of React so it can also support future charts and exports.

## Root-person workflow

After an import, the application shows a locally filtered person search. Selecting a result stores the person's canonical ID in component state; names and IDs are never added to the URL. The root can be changed at any time, and changing it recalculates the dashboard.

The generation control requests one through eight ancestor generations from the genealogy model. This is deliberately below the model's safety limit because the dashboard renders every generation at once.

## Completeness semantics

`analyzeCompleteness()` consumes an `AncestorTraversal` and reports:

- expected, filled, and missing slots for every generation;
- unique people separately from filled slots, preserving pedigree-collapse semantics;
- birth/death date and place availability among known people;
- day, month, year, and unknown date precision;
- approximate date counts, based on imported date qualifiers.

Generation coverage uses slots, including repeated people. Overall record and precision figures use unique people so pedigree collapse does not weight one person's record multiple times. Missing ancestor slots are excluded from record completeness; they are not people with incomplete records.

## Verification

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Analysis unit tests cover pedigree collapse, missing slots, field availability, qualifiers, and date precision. The application test covers root searching, selection, and dashboard rendering.

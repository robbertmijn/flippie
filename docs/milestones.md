# Flippie implementation milestones

**Current milestone:** Phase 6 — Geography

**Last reviewed:** 2026-10-02

This document is the status tracker for the implementation plan. Requirements and acceptance criteria live in [`requirements.md`](requirements.md); implementation procedures live in [`guides/`](guides/).

## Status legend

- ✅ Complete: exit criteria are implemented and verified.
- 🚧 Next: the next planned implementation phase.
- ⬜ Planned: not started or not yet verified.

## Roadmap

### Phase 1 — Foundation ✅ Complete

- Vite, React, and TypeScript application foundation.
- Unit-test framework, linting, and type checking.
- GitHub Actions CI and GitHub Pages deployment workflows.
- Static build supports both a custom domain and repository-relative hosting.

**Verification:** CI runs type checking, linting, tests, and a production build. Deployment publishes `dist/` after successful checks. See the [deployment guide](guides/github-pages-deployment.md).

### Phase 2 — Import ✅ Complete

- Multi-section CSV reader and four-section import adapter.
- Canonical ID normalization and preservation of raw values.
- Import validation, report, dataset replacement, and clearing.
- Fictional valid and malformed-reference fixtures with automated tests.

**Verification:** Import tests cover CSV structure, normalization, dates, relationships, and findings. See the [CSV import guide](guides/csv-import.md).

### Phase 3 — Genealogy model ✅ Complete

- Relationship indexes for people, places, and families.
- Efficient parent and family lookups.
- Ancestor-slot traversal with missing slots.
- Cycle detection and pedigree-collapse handling.

**Verification:** Model tests cover canonical indexes, normalized imported data, parents and grandparents, deep missing slots, repeated people in distinct slots, cycle protection, and traversal depth validation. See the [genealogy model guide](guides/genealogy-model.md).

### Phase 4 — Core analysis ✅ Complete

- Searchable root-person selection.
- Generation completeness and unique-person statistics.
- Record completeness and date-precision analysis.

**Verification:** Analysis and application tests cover root search and replacement, slot-based generation coverage, unique-person counts, record availability, qualifiers, and date precision. See the [core analysis guide](guides/core-analysis.md).

### Phase 5 — Visualization ✅ Complete

- Interactive ancestor tree.
- Radial fan chart.
- Person detail interactions.

**Verification:** Layout and application tests cover tree and fan rendering, missing and repeated ancestor treatment, view switching, and person details. See the [visualization guide](guides/visualizations.md).

### Phase 6 — Geography 🚧 Next

- Coordinate-based ancestor map and generation/branch filters.
- Grouped places and unresolved-location handling.
- No automatic online geocoding.

### Phase 7 — Export ⬜ Planned

- Vector SVG and PDF output.
- PNG output with explicit DPI and memory warnings.
- Page dimensions and detailed layout controls.

### Phase 8 — Polish ⬜ Planned

- Performance for datasets of several thousand people.
- Responsive layout and accessibility review.
- User and contributor documentation review.

Later phases must not work around incomplete foundations in earlier phases. Update this file in the same change that completes a phase, and link evidence such as tests or the relevant implementation guide.

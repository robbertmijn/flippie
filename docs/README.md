# Flippie documentation

The documentation is split so that product intent, delivery status, and implementation procedures do not drift into one large planning file.

## Product and planning

| Document | Purpose | Update when |
| --- | --- | --- |
| [Requirements](requirements.md) | Product scope, architecture constraints, data model, and acceptance criteria | Agreed behavior or scope changes |
| [Milestones](milestones.md) | Current phase, completed work, remaining deliverables, and exit criteria | Work starts, completes, or changes order |
| [CSV format](csv-format.md) | Input contract and parsing semantics | Import format support changes |

The requirements are the source of truth for **what** Flippie must do. The milestone tracker records **when** it will be delivered. A checked milestone does not override a requirement.

## Implementation guides

Guides describe **how** to implement and verify bounded areas of work. They are not substitutes for requirements or status tracking.

| Guide | Related milestone |
| --- | --- |
| [GitHub Pages deployment](guides/github-pages-deployment.md) | Phase 1 |
| [CSV import](guides/csv-import.md) | Phase 2 |
| [Genealogy model](guides/genealogy-model.md) | Phase 3 |
| [Core analysis](guides/core-analysis.md) | Phase 4 |
| [Ancestor visualizations](guides/visualizations.md) | Phase 5 |
| [Testing](guides/testing.md) | All phases |

When adding a substantial milestone, add or update a focused guide with its design boundaries, implementation sequence, and milestone-specific verification steps. Keep completion state only in `milestones.md`.

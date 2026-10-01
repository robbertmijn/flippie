# CSV import implementation guide

This guide records the design boundaries and verification procedure for Phase 2. The supported file contract is documented separately in [`../csv-format.md`](../csv-format.md).

## Implementation boundaries

1. Read the selected file only with browser APIs.
2. Parse the complete document as CSV before dividing it at completely empty rows. Splitting raw text first would corrupt quoted line breaks.
3. Map recognized `Place`, `Person`, `Marriage`, and `Family` sections through the import adapter in `src/import/importGenealogy.ts`.
4. Normalize bracketed IDs consistently while retaining imported values and raw records.
5. Model marriage rows as families/unions and attach all child-link rows to `childIds`; accept either missing parent.
6. Preserve genealogy date text and precision instead of coercing it to a JavaScript `Date`.
7. Validate references after records have been constructed. Report errors, warnings, and information separately; do not invent referenced records.
8. Return a complete replacement dataset. Never merge it implicitly with data already loaded in the UI.

Unknown sections should produce an informational finding. No import path may upload data, invoke an online geocoder, add identifiers to a URL, or persist it remotely.

## Automated verification

Run the focused import suite while developing:

```bash
npm test -- src/import/importGenealogy.test.ts
```

Before considering the milestone verified, run the complete checks described in [testing.md](testing.md). The tests and fictional fixtures should cover:

- different section widths, blank separators, quoted commas, and quoted line breaks;
- an unknown extra section;
- complete and missing coordinates;
- name prefixes and a missing surname;
- full, partial, qualified, and malformed dates;
- two-parent and one-parent families;
- multiple children for a family;
- missing people, places, or family references;
- duplicate IDs and required-section failures.

Use only fictional data in tests and examples. Never copy records from a real genealogy export into the repository, snapshots, logs, or issue output.

## Manual verification

1. Run `npm run dev` and load `sample-data/fictional-family.csv`.
2. Compare the displayed people, places, families, relationship, event, coordinate, warning, and error counts with the fixture.
3. Load `sample-data/malformed-references.csv` and confirm broken references are visible as findings without a crash.
4. Replace the current file and verify all derived state belongs to the replacement.
5. Clear the data and verify the application returns to its no-data state.
6. Use the browser Network panel to confirm neither file produces genealogy-bearing requests.

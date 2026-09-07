# Flippie CSV format

Flippie imports one CSV document containing four tables separated by completely blank rows. Its built-in standards-compliant reader parses the entire document first, so quoted commas, escaped quotes, quoted line breaks, CRLF line endings, and a UTF-8 byte-order mark are preserved, and only then divides the parsed rows into sections. The importer has no runtime CSV-library dependency.

| Section | Purpose |
| --- | --- |
| `Place` | Location definitions and optional coordinates |
| `Person` | Individual records and life events |
| `Marriage` | Parent/family (union) definitions |
| `Family` | Family-to-child links |

The first row of each section is its header. Sections have different column counts. Unknown sections are ignored with an informational finding; all four recognized sections are required.

## IDs and references

Imported IDs normally use square brackets, such as `[I0001]`, `[P0001]`, and `[F0001]`. Flippie preserves that imported value but consistently removes the surrounding brackets for internal references. `Person` event places refer to `Place` IDs. `Marriage` husband and wife values refer to `Person` IDs. Each `Family` row links its family ID to one child person ID.

A family can occur in multiple `Family` rows and therefore can have multiple children. Either parent in a `Marriage` record can be blank; these partial families are valid. Broken references produce warnings rather than inventing records.

## Missing values

An empty field means that value is unknown. Missing event fields do not create an event. A known place with missing latitude or longitude remains a valid place and is reported as geographically unresolved. Flippie does not send its name to a geocoding service.

## Dates

Dates are retained as their original text and parsed without converting them into JavaScript `Date` objects. Supported forms are `YYYY-MM-DD`, `YYYY-MM`, and `YYYY`, optionally preceded by `about`, `before`, or `after` (common abbreviations are accepted). This preserves day, month, or year precision. Unrecognized dates remain available as original text and produce a warning.

## Coordinates

Latitude and longitude are decimal numbers. Both must be present and numeric for a place to count as mapped. A malformed value produces a warning; an incomplete pair produces an informational unresolved-coordinate finding.

## Safe sample files

`sample-data/fictional-family.csv` is a deliberately fictional valid example that can be loaded in the application. `sample-data/malformed-references.csv` is intended for validation tests. Never add a real genealogy export to the repository.

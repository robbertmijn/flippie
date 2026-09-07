# Flippie

Flippie is a privacy-first genealogy web application for exploring family-history data through ancestor trees, fan charts, completeness analysis, maps, and publication-quality exports. It is designed as a fully client-side React application hosted with GitHub Pages.

> [!IMPORTANT]
> Genealogy files are processed locally in the browser. Flippie has no application backend, account system, cloud database, analytics, or automatic geocoding. **Never commit a real genealogy dataset to this repository.**

## Project status

**Phase 3 — Genealogy model is complete.** Imported people, places, and families are exposed through canonical relationship indexes. Ancestor traversal preserves missing and repeated ancestor slots, and safely detects cycles. Development can now proceed with Phase 4 root selection and completeness analysis.

## Supported CSV structure

The importer supports a non-rectangular CSV export made of four tables separated by blank rows:

1. `Place` — location definitions and optional coordinates;
2. `Person` — individual records and life events;
3. `Marriage` — family/union and parent definitions;
4. `Family` — family-to-child links.

Each section has its own header and column count. The file will be parsed as standards-compliant CSV before it is divided at empty rows; it will not be split as plain text or treated as one flat table.

## Local development

Requires Node.js 22 or newer.

```bash
npm ci
npm run dev
```

Vite prints the local development URL. No secrets or API keys are required.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Pull requests and pushes to `main` run every check in GitHub Actions.

## Production build and GitHub Pages

```bash
npm run build
npm run preview
```

The production files are written to `dist/`. Vite emits relative asset paths so the build works at both a root domain and a GitHub Pages repository path. A successful push to `main` builds and deploys `dist/` through the official GitHub Pages Actions workflow. Enable **GitHub Actions** as the Pages source in the repository settings before the first deployment.

## Example data

A small, fictional CSV fixture is available at `sample-data/fictional-family.csv`. Choose **Load a genealogy CSV** in the application to try it. Format details are documented in [`docs/csv-format.md`](docs/csv-format.md). Real genealogy exports can contain sensitive personal information and must stay outside version control.

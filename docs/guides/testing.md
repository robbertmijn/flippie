# Testing guide

Use Node.js 22 or newer. Install the exact locked dependencies before validating a clean checkout:

```bash
npm ci
```

## Standard quality gate

Run every command before merging:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

These commands match `.github/workflows/ci.yml`. Tests must be deterministic and must not require genealogy services, online geocoding, secrets, or real personal data.

## During development

Use `npm run test:watch` for rapid feedback or pass a test path to `npm test --`, for example:

```bash
npm test -- src/import/importGenealogy.test.ts
```

Add tests alongside the source they cover using the `*.test.ts` or `*.test.tsx` convention. Prefer focused fictional fixtures that demonstrate one behavior. Check observable outputs and diagnostics rather than private implementation details.

## Manual browser checks

For user-facing milestone changes:

1. Start `npm run dev`.
2. Exercise the no-data, success, warning, failure, replacement, and clear states affected by the change.
3. Check keyboard use, narrow and wide layouts, and readable error feedback.
4. Inspect browser console errors and network requests.
5. Confirm genealogy data remains local and does not appear in URLs, logs, requests, screenshots, or committed fixtures.

For deployment-specific checks, also follow [`github-pages-deployment.md`](github-pages-deployment.md). Each milestone guide should list its additional fixtures and assertions.

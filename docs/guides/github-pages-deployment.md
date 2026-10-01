# GitHub Pages deployment guide

This guide describes how to maintain and verify Phase 1 deployment. Flippie is a static application: GitHub Pages serves the built assets, and no genealogy data is sent to an application server.

## Repository configuration

1. In **Settings → Pages**, select **GitHub Actions** as the deployment source.
2. Keep the workflow at `.github/workflows/deploy-pages.yml` enabled.
3. Grant only `contents: read`, `pages: write`, and `id-token: write` permissions.
4. If a custom domain is used, put only the hostname in the root `CNAME` file and configure its DNS records with the domain provider.
5. Do not add deployment secrets: the production application requires no API keys or server environment variables.

## Build implementation

- `npm run build` must create the deployable `dist/` directory.
- Keep Vite's `base` repository-path-safe. The current relative base (`./`) works with the custom domain and a `username.github.io/repository/` path.
- Keep navigation in React state or use hash routing. GitHub Pages cannot rewrite arbitrary browser-history routes to `index.html`.
- Reference application assets through imports or base-aware paths; do not assume the site is mounted at `/`.

The deployment workflow runs the same checks as CI, uploads only `dist/` with `actions/upload-pages-artifact`, and deploys that artifact with `actions/deploy-pages` after the build job succeeds.

## Local verification

From a clean checkout using Node.js 22 or newer:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

Open the preview URL and verify that the initial screen loads and the fictional sample can be imported. In browser developer tools, confirm that loading a file causes no request containing genealogy data.

To catch root-path assumptions, serve the contents of `dist/` beneath a nested path or inspect the generated `dist/index.html` and confirm built asset URLs are relative.

## Production verification

After merging to `main`:

1. Confirm both the **CI** and **Deploy GitHub Pages** workflows succeeded.
2. Open the deployment URL from the workflow summary.
3. Hard-refresh the page and check that scripts and styles load without 404 responses.
4. Import `sample-data/fictional-family.csv`, review the counts, then clear it.
5. Confirm the Network panel contains no request carrying the file, names, person IDs, places, or derived genealogy information.

If deployment fails, diagnose the workflow or Pages configuration rather than adding a runtime server or switching hosting providers.

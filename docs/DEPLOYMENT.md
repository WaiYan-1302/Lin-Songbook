# Deployment

## Production build

```bash
npm ci
npm test
npm run build
```

The output is `dist/`. The build copies `index.html` to `404.html` for static hosts. Cloudflare Workers uses the committed `wrangler.jsonc` SPA fallback; no `_redirects` rule is needed.

## Cloudflare Pages

- Build command: `npm run build`
- Output: `dist`
- Node version: 20 or later
- Secrets: none

Wrangler reads `wrangler.jsonc`, where the Worker serves the built assets and handles the `/api/songs` cloud-sync API. Apply D1 migrations before the first deployment with `npx wrangler d1 migrations apply lin-songbook-data --remote`. The asset binding keeps `single-page-application` fallback behavior, so `/songbook/demo-1` still resolves to the SPA.

## GitHub Pages

Build with the repository base path:

```bash
npm run build -- --base=/YOUR_REPOSITORY_NAME/
```

Publish `dist`. `BrowserRouter` uses `import.meta.env.BASE_URL`, and `404.html` supplies deep-link fallback behavior.

## Vercel

Use the Vite preset, `npm run build`, and `dist`. Configure a catch-all rewrite to `/index.html` in the Vercel project if its Vite preset does not add one automatically.

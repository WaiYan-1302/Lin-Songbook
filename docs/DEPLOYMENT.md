# Deployment

## Production build

```bash
npm ci
npm test
npm run build
```

The output is `dist/`. The build copies `index.html` to `404.html` for static hosts and includes Cloudflare’s `_redirects` file.

## Cloudflare Pages

- Build command: `npm run build`
- Output: `dist`
- Node version: 20 or later
- Secrets: none

Cloudflare reads `_redirects`, so `/songbook/demo-1` resolves to the SPA and React Router handles it.

## GitHub Pages

Build with the repository base path:

```bash
npm run build -- --base=/YOUR_REPOSITORY_NAME/
```

Publish `dist`. `BrowserRouter` uses `import.meta.env.BASE_URL`, and `404.html` supplies deep-link fallback behavior.

## Vercel

Use the Vite preset, `npm run build`, and `dist`. Configure a catch-all rewrite to `/index.html` in the Vercel project if its Vite preset does not add one automatically.

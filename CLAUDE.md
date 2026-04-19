# cutlistwizard

A web-based cut list optimizer for woodworkers and fabricators.

## Stack

- **Vite** + React + TypeScript
- **Tailwind CSS**
- **Vercel** for deployment (static site, no backend)
- Optimizer algorithm runs entirely client-side

## Dev

```bash
npm install
npm run dev
```

## Build & Deploy

**Before every push**, run a clean build to catch TypeScript errors that the local cache may hide:

```bash
rm -rf node_modules/.tmp && npm run build
```

If the build fails, fix all errors before pushing. Vercel deploys from the committed git files on push to `main` — errors invisible locally (due to stale `.tsbuildinfo` cache) will fail the Vercel build.

Deploys automatically via Vercel on push to `main`.

## Project Structure

```
src/
  components/   UI components
  lib/          Optimizer algorithm and utilities
  pages/        Route-level components (if using react-router)
```

## Algorithm

2D bin-packing (cutting stock problem). Pieces are rectangular; stock sheets are fixed size. Constraints include grain direction (restricts rotation) and kerf width (saw blade thickness subtracted from each cut).

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

```bash
npm run build
```

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

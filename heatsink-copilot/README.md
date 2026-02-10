# Heatsink Copilot

Offline-capable heatsink design PWA using Vue 3 + Quasar.

## Setup

```bash
npm install
npm run dev
```

## Node.js version

Use Node.js 18+ (LTS recommended) to match Quasar + Vite + Vitest requirements.

## Build

```bash
npm run build
```

## Tests

```bash
npm run test:unit
npm run test:e2e
npm test
```

### E2E dependencies

Playwright is not installed by default in this repository. Install it explicitly before running `npm run test:e2e`:

```bash
npm install -D @playwright/test
```

## Troubleshooting installs

If `npm install` fails with a `403 Forbidden` fetching `@quasar/app-vite` (or similar), that indicates a registry or network policy restriction in the environment rather than an issue in the project code. In that case, use an allowed registry or install from a network with access. 

## Offline notes

The first load requires a network connection to cache the app shell. After that, the app works offline via Workbox precaching in the custom service worker.

## Run history

Use the **Save run** button to store a snapshot in localStorage. Export and import runs as JSON using the buttons in the Results page.

## Model notes

- Internal-channel-only area `A_eff` is used for thermal performance.
- Darcy–Weisbach pressure drop in channels with a configurable minor loss `K_sum`.
- MVP Nu correlation is piecewise.
- Operating point uses 3-iteration calibration followed by bisection for robustness.

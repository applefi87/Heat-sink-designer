# Heatsink Copilot

Offline-capable heatsink design PWA using Vue 3 + Quasar.

## Setup

```bash
npm install
npm run dev
```

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

## Offline notes

The first load requires a network connection to cache the app shell. After that, the app works offline via Workbox precaching in the custom service worker.

## Run history

Use the **Save run** button to store a snapshot in localStorage. Export and import runs as JSON using the buttons in the Results page.

## Model notes

- Internal-channel-only area `A_eff` is used for thermal performance.
- Darcy–Weisbach pressure drop in channels with a configurable minor loss `K_sum`.
- MVP Nu correlation is piecewise.
- Operating point uses 3-iteration calibration followed by bisection for robustness.

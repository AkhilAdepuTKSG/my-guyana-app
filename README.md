# My Guyana

A React (Vite) rebuild of the "My Guyana" whole-of-government mobile app design (`My Guyana - Mobile C.dc.html`, exported from Claude Design). A single citizen account unifying services from NIS (National Insurance Scheme), MoPS (Ministry of Public Service), and GPL (Guyana Power & Light), built around a digital identity (e-ID) account.

This is a visual/interaction rebuild with mock data — there is no real backend. All data lives in `src/state/mockData.js`; async steps (OTP, document checks, "matching..." spinners) are simulated with short delays rather than real integrations.

## Running it

```
npm install
npm run dev
```

## Structure

- `src/styles/tokens.css` — design tokens (colors, type scale, radii, shadows, motion) ported from the source design's `colors_and_type.css`.
- `src/state/AppStateContext.jsx` — global navigation state: which primary screen is active, which overlay(s) are open, and the active "View as" persona.
- `src/state/mockData.js` — all mock/fixture data (personas, agencies, applications, notifications, etc).
- `src/components/ui/` — shared primitives (Button, Surface, ListRow, Sheet, PageOverlay, StatusPill, StepProgress, SegmentedTabs, RingProgress, Icon, Toast).
- `src/components/shell/` — the app shell: mobile container, bottom tab bar + Ask Gov FAB, and the shared agency-hub header.
- `src/screens/` — the 9 primary tab-reachable screens (Home, NIS, MoPS, GPL, Vault, Wallet, Services, Calendar, Applications).
- `src/overlays/` — every full-screen flow and bottom sheet (identity verification/sign-in, e-ID application, NIS registration, benefit claims, GPL flows, onboarding, tracking, Ask Gov, payments, ID cards, profile, etc), one folder per feature area.

## Notable decisions

- No iOS device-frame chrome — the source wrapped everything in a decorative iPhone bezel for the design-tool preview; this rebuild is a plain responsive mobile web app.
- The prototype's designer-only scaffolding (fixed dev toolbar, journey-jump chips, "reset demo" button) was dropped entirely.
- The "View as" persona switcher (Nicole Persaud / Aaliyah Persaud) was kept — it's in the profile sheet.
- One navy primary color app-wide, per the source's own override; individual agencies keep a small colored identity mark (`--agency-mark`) rather than full theming.

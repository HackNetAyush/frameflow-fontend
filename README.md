# Xplainer — frontend

Type a topic, get a narrated, illustrated 1080p explainer video. The AI stages
run on the [Express backend](../frameflow-backend); **the video itself is
rendered and encoded in the browser**, so there is no render server to pay for
and no video file on anyone else's disk.

A full write-up of the pipeline lives in the app itself, at
[`/how-it-works`](src/pages/HowItWorks.jsx) — it is a public page, so it can be
shared with anyone.

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
```

One frontend environment variable in `.env`:

| Variable | What it is |
| --- | --- |
| `VITE_SERVER_URL` | HTTPS origin of the backend in production (`http://localhost:3000` locally) |

Sign-in is handled by Better Auth on the backend. The backend requires MongoDB
and a `BETTER_AUTH_SECRET` in production. `/how-it-works` is public.

## Routes

| Route | Access |
| --- | --- |
| `/` | Public — landing page |
| `/how-it-works` | Public — pipeline documentation |
| `/sign-in`, `/sign-up` | Public — email/password and optional Google sign-in |
| `/app`, `/app/videos` | Protected by `RequireAuth`; unauthenticated visits redirect with a return URL |

## Layout

```
src/
  pages/            Landing, HowItWorks, AuthPage, Studio, Account, NotFound
  components/
    Landing/        Marketing sections, hero product shot, FAQ, footer
    Docs/           Docs primitives: chapters, callouts, code blocks, diagrams
    Layout/         AppShell, Sidebar, Brand, ThemeToggle, LoadingScreen
    Home/ Video/    Studio UI: prompt bar, hero, cards, player, progress
    Auth/           RequireAuth route guard
  render/           The slide engine: markdown → blocks → measured layout → canvas ops
  video/            WebCodecs H.264 encode, with an ffmpeg.wasm fallback
  hooks/            useVideoGenerator (the conductor), useVideos, useTheme
  theme/            One theme value shared by the UI
  lib/              Better Auth browser client and video options
```

## Notes

- **Design tokens.** Every colour is a CSS variable in `src/index.css`; light
  mode is a pure token swap.
- **Cross-origin isolation.** `COOP: same-origin` + `COEP: credentialless` are
  set in `vite.config.js` and `public/staticwebapp.config.json`. Vite copies the
  latter into `dist/` for Azure Static Web Apps. The isolation is what
  makes `SharedArrayBuffer` (and therefore the ffmpeg.wasm fallback) available;
  `credentialless` rather than `require-corp` because the stricter mode also
  blocks third-party assets.
- **Video library.** Finished videos are object URLs held in this tab's memory.
  Download files before closing or refreshing the tab.
- **Scripts.** `npm run verify:render` checks that no composed slide can be
  taller than its frame; `npm run preview:slides` renders sessions to a static
  preview page.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build into `dist/` |
| `npm run lint` | ESLint over `src/` |
| `npm run verify:render` | Headless layout assertions |
| `npm run preview:slides` | Render generated sessions to `preview.html` |

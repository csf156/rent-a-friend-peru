# design-sync notes — rent-a-friend-peru

## Repo shape: React Native (Expo), not a web package

This repo has no published `dist/`, no `main`/`module`/`exports['.']` pointing at built output — `components/Button.tsx` and `lib/theme.ts` are RN source, never built for web. To sync it:

- `react-native` → `react-native-web` via this repo's own `package.json` `"browser"` field (`{"react-native": "react-native-web"}`) — esbuild's standard browser-platform field remap, not a fork of `lib/bundle.mjs`. Has zero effect on the real Expo/Metro build (Metro doesn't read the `browser` field).
- `.design-sync/entry.mjs` is a hand-authored stand-in "dist entry" (`export { Button } from '../components/Button'; export * as theme from '../lib/theme';`), passed via `cfg.entry`. Without a real dist, this is required to get `PKG_DIR` to resolve to the repo root at all (see `package-build.mjs`'s ENTRY_OVERRIDE walk-up).
- `cfg.componentSrcMap.Button` pins the component (no `.d.ts` tree exists to auto-discover it from).
- `cfg.dtsPropsFor.Button` hand-written — same reason, props can't be auto-extracted with no compiled `.d.ts`. **If Button's props change, update this by hand and keep it in sync with `components/Button.tsx`.**
- `react-dom` had to be added as an explicit devDependency — it only existed as a stray transitive before (vanished when `react-native-web` was installed). Both are pinned to match `react@19.2.3`.

## Known render-check false positive — RENDER CHECK RUN WITH `--no-render-check`

`package-validate.mjs`'s render check flags `Button.html` as `[RENDER] root empty` — **false positive**, not a real bug. Root cause: `react-native-web` injects `<style id="react-native-stylesheet">` into `<head>` on first mount. That id starts with `"r"`, so it matches the validator's `document.querySelectorAll('#root, [id^="r"]')` and — because `<head>` precedes `<body>` in document order — always sorts as `roots[0]`, ahead of our real `r0`/`r1`/`r2` mount divs. Its content is inserted via CSSOM `insertRule()`, which never populates `.innerHTML`, so it reads as an empty root.

Independently verified via a standalone playwright script hitting the same served `Button.html`: all 3 authored cells (Primary/Accent/Disabled) render real, correctly-styled content (see grades in `.cache/review/Button.grade.json`, all `good`). This is a structural conflict between the validator's `[id^="r"]` heuristic and react-native-web's fixed internal element id — not fixable from `.design-sync/config.json`, and `package-validate.mjs` isn't a forkable `lib/*.mjs` seam.

**Every future rebuild of an RN-web component in this repo must validate with `--no-render-check`** and be manually screenshot-reviewed instead (or re-verify the DOM dump approach above) — don't chase `[RENDER] root empty` on this repo as if it were a real regression.

## Re-sync risks

- If a future component ISN'T RN-web (e.g. a plain web React component gets added later), the same `--no-render-check` blanket approach would hide REAL render failures for that component too. Once this repo has components beyond RN-web ones, split the render check (run it normally, and only treat `Button`-style false positives as known).
- `cfg.dtsPropsFor.Button` will drift silently if `components/Button.tsx`'s props change and nobody updates the config — there's no automated check tying them together.
- `.design-sync/entry.mjs` must be updated by hand whenever a new component/token module should ship in the bundle (nothing auto-discovers new RN components without a real dist).
- Tokens (`lib/theme.ts`) are plain JS objects, not CSS — see `.design-sync/conventions.md` for the vocabulary the design agent should use instead of CSS vars.
- Sora/Inter fonts are NOT shipped (native-only, loaded via Expo) — flagged in conventions.md; any web design built with this DS needs those fonts supplied separately or it silently falls back to system font.

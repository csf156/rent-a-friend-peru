## Rent a Friend Perú — build conventions

This is a **React Native (Expo)** design system, not a web-native one. Components are written with `react-native` primitives (`View`, `Text`, `Pressable`, `StyleSheet`) and compiled here through `react-native-web` (aliased via this repo's own `package.json` `"browser"` field — an esbuild/webpack-standard technique, not a fork). The bundled JS you get (`window.RentAFriendPeru.*`) already renders as real DOM.

### No CSS classes, no CSS variables — style via the `colors`/`typography` JS objects

There is no `styles.css` token vocabulary here (see `_ds_bundle.css` — it's a runtime-styles stub; `react-native-web`'s `StyleSheet` injects atomic classes at runtime instead of shipping static CSS). Compose new UI by importing the real token objects off the bundle, `window.RentAFriendPeru.theme`, and passing their values into `StyleSheet.create({...})` — never invent Tailwind-style utility classes or `var(--*)` names, this DS has neither.

```js
const { colors, typography } = window.RentAFriendPeru.theme;
```

- `colors.light.{primary, primaryDark, primaryLight, accent, accentDark, accentLight, success, warning, danger, info, bg, surface, text, textMuted, border}` — hex strings. **Only `colors.light` is wired up today** — `Button` hardcodes `colors.light.*`; `colors.dark` exists in the source but nothing consumes it yet, so don't imply dark-mode support in anything you build with this DS.
- `typography.fontFamily.{heading: 'Sora', body: 'Inter'}`, `typography.fontSize.{xs,sm,base,lg,xl,xxl}` (12–32, numeric px), `typography.fontWeight.{regular:'400', semibold:'600', bold:'700'}`.
- `levelColors.{bronze,silver,gold,platinum,diamond}` — a separate small palette for gamification/level badges.

### Fonts are NOT shipped in this bundle

`Sora` and `Inter` are referenced by name but loaded natively in the app (Expo font loading), not via `@font-face`/web font files — nothing under `fonts/` here. A design built with this DS will fall back to a system font unless you separately supply Sora/Inter as web fonts.

### Components

- `Button({ label, variant?: 'primary' | 'accent', disabled?, onPress? })` — no provider/wrapper needed. `variant` picks `primary` (teal, white label) or `accent` (coral, dark label for AA contrast); `disabled` applies 0.5 opacity.

```jsx
const { Button } = window.RentAFriendPeru;
<Button label="Reservar amigo" variant="primary" onPress={() => {}} />
```

Read `README.md` for the full component index; this is a 1-component seed DS (`Button` + `theme` only) — expect more components to land as the app grows.

# Design Sync Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Claude Design a real, code-level design system to sync against (color/typography tokens + one seed component) so navigable mockups respect the app's actual palette instead of an invented one.

**Architecture:** One token module (`lib/theme.ts`) exporting `colors` (light/dark), `levelColors`, and `typography`, consumed by a new `Button` component (`components/Button.tsx`). Both are plain TypeScript/React Native, no new dependencies. Tests use the existing `jest-expo` + `@testing-library/react-native` setup.

**Tech Stack:** TypeScript, React Native (Expo 57), Jest (`jest-expo` preset), `@testing-library/react-native`.

Spec: [`docs/superpowers/specs/2026-07-03-design-sync-setup-design.md`](../specs/2026-07-03-design-sync-setup-design.md)
Source of truth for values: [`docs/2026-07-03-design-system.md`](../../2026-07-03-design-system.md)

---

### Task 1: Design tokens (`lib/theme.ts`)

**Files:**
- Create: `lib/theme.ts`
- Test: `tests/theme.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/theme.test.ts
import { colors, levelColors, typography } from '@/lib/theme';

describe('theme tokens', () => {
  it('defines the light palette from the design system doc', () => {
    expect(colors.light.primary).toBe('#0E6E66');
    expect(colors.light.primaryDark).toBe('#0A4F49');
    expect(colors.light.primaryLight).toBe('#DCF2EF');
    expect(colors.light.accent).toBe('#FF7A5C');
    expect(colors.light.danger).toBe('#E23D3D');
    expect(colors.light.bg).toBe('#FAF7F2');
    expect(colors.light.surface).toBe('#FFFFFF');
    expect(colors.light.text).toBe('#1F2523');
    expect(colors.light.border).toBe('#E7E2D9');
  });

  it('defines a dark palette with the required primary contrast bump', () => {
    expect(colors.dark.bg).toBe('#12181A');
    expect(colors.dark.surface).toBe('#1B2224');
    expect(colors.dark.primary).toBe('#3FA79D');
  });

  it('defines the level badge colors', () => {
    expect(levelColors.bronze).toBe('#B08D57');
    expect(levelColors.silver).toBe('#B5B8BD');
    expect(levelColors.gold).toBe('#E3B341');
    expect(levelColors.platinum).toBe('#8FD9D4');
    expect(levelColors.diamond).toBe('#6C9FE0');
  });

  it('defines the typography scale and families', () => {
    expect(typography.fontFamily.heading).toBe('Sora');
    expect(typography.fontFamily.body).toBe('Inter');
    expect(typography.fontSize).toEqual({
      xs: 12,
      sm: 14,
      base: 16,
      lg: 20,
      xl: 24,
      xxl: 32,
    });
    expect(typography.fontWeight.semibold).toBe('600');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/theme.test.ts`
Expected: FAIL with `Cannot find module '@/lib/theme'` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

```ts
// lib/theme.ts
export const colors = {
  light: {
    primary: '#0E6E66',
    primaryDark: '#0A4F49',
    primaryLight: '#DCF2EF',
    accent: '#FF7A5C',
    accentDark: '#E85F41',
    accentLight: '#FFE4DC',
    success: '#2FA84F',
    warning: '#E8A93B',
    danger: '#E23D3D',
    info: '#3B82C4',
    bg: '#FAF7F2',
    surface: '#FFFFFF',
    text: '#1F2523',
    textMuted: '#6B7570',
    border: '#E7E2D9',
  },
  dark: {
    // primary brightened for AA contrast on the dark background (per design doc Section 2)
    primary: '#3FA79D',
    primaryDark: '#0A4F49',
    primaryLight: '#DCF2EF',
    accent: '#FF7A5C',
    accentDark: '#E85F41',
    accentLight: '#FFE4DC',
    success: '#2FA84F',
    warning: '#E8A93B',
    danger: '#E23D3D',
    info: '#3B82C4',
    bg: '#12181A',
    surface: '#1B2224',
    text: '#F2F5F4',
    textMuted: '#9AA6A2',
    border: '#2A3336',
  },
} as const;

export const levelColors = {
  bronze: '#B08D57',
  silver: '#B5B8BD',
  gold: '#E3B341',
  platinum: '#8FD9D4',
  diamond: '#6C9FE0',
} as const;

export const typography = {
  fontFamily: {
    heading: 'Sora',
    body: 'Inter',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  fontWeight: {
    regular: '400',
    semibold: '600',
    bold: '700',
  },
} as const;

export type ColorScheme = keyof typeof colors;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/theme.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/theme.ts tests/theme.test.ts
git commit -m "feat: add design system tokens (colors, typography)"
```

---

### Task 2: Seed component (`components/Button.tsx`)

**Files:**
- Create: `components/Button.tsx`
- Test: `tests/components/Button.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('renders the label', async () => {
    await render(<Button label="Invitar" onPress={() => {}} />);
    expect(screen.getByText('Invitar')).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<Button label="Invitar" onPress={onPress} />);
    fireEvent.press(screen.getByText('Invitar'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Invitar" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText('Invitar'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('exposes disabled state for accessibility', async () => {
    await render(<Button label="Invitar" onPress={() => {}} disabled />);
    const button = screen.getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });
});
```

> Note: `@testing-library/react-native@14` made `render()` async (it awaits pending
> React updates internally) — every test must `await render(...)` before querying
> `screen`. This supersedes any earlier sync-style `render()` usage.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/components/Button.test.tsx`
Expected: FAIL with `Cannot find module '@/components/Button'` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

```tsx
// components/Button.tsx
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, typography } from '@/lib/theme';

type ButtonVariant = 'primary' | 'accent';

type ButtonProps = {
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  onPress?: () => void;
};

export function Button({ label, variant = 'primary', disabled = false, onPress }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.accent,
        pressed && (variant === 'primary' ? styles.primaryPressed : styles.accentPressed),
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  primary: {
    backgroundColor: colors.light.primary,
  },
  primaryPressed: {
    backgroundColor: colors.light.primaryDark,
  },
  accent: {
    backgroundColor: colors.light.accent,
  },
  accentPressed: {
    backgroundColor: colors.light.accentDark,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: colors.light.surface,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/components/Button.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/Button.tsx tests/components/Button.test.tsx
git commit -m "feat: add seed Button component using design tokens"
```

---

### Task 3: Full verification + push

**Files:** none (verification only)

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no errors/warnings.

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: all suites pass, including `tests/theme.test.ts`, `tests/components/Button.test.tsx`, and the existing `tests/smoke.test.ts`.

- [ ] **Step 4: Push to GitHub**

```bash
git push origin master
```

Expected: `origin/master` now has the token file, the Button component, and their tests.

---

### Task 4: Run `/design-sync` and build the first mockup (manual, not code)

This task is interactive — it happens inside Claude Code and claude.ai/design, not via automated steps.

- [ ] **Step 1:** In Claude Code, run `/design-sync` and point it at the `csf156/rent-a-friend-peru` GitHub repo (now containing `lib/theme.ts` + `components/Button.tsx`).
- [ ] **Step 2:** Confirm the synced design system in Claude Design shows the teal/coral palette and Sora/Inter typography from `lib/theme.ts` — not an invented palette.
- [ ] **Step 3:** In claude.ai/design, pick one screen from the "Mapa de vistas" (`docs/2026-07-03-design-system.md`, Section 5) to mock up first — recommended starting point: **Descubrimiento (swipe)** or **Ver perfil público**, since both are highly visual and don't depend on backend/business logic that isn't built yet.
- [ ] **Step 4:** Iterate on that screen in the canvas until it's navigable and uses the synced tokens/component correctly.
- [ ] **Step 5:** Export the result (HTML standalone or direct to Claude Code) to continue development.

---

## Self-Review Notes

- **Spec coverage:** `lib/theme.ts` covers Section 2 (colors) + Section 3 (typography) of the design doc; `components/Button.tsx` is the seed component; Task 3 covers commit+push; Task 4 covers `/design-sync` + first mockup screen. All spec success criteria are covered.
- **Placeholders:** none — every step has real code/commands.
- **Type consistency:** `Button` imports `colors`/`typography` with the exact names exported from `lib/theme.ts` (`colors.light.*`, `typography.fontFamily.*`, `typography.fontSize.*`, `typography.fontWeight.*`) — checked against Task 1's implementation.

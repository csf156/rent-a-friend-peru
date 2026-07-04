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

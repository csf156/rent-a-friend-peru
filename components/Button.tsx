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
      <Text style={[styles.label, variant === 'primary' ? styles.labelOnPrimary : styles.labelOnAccent]}>
        {label}
      </Text>
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
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  labelOnPrimary: {
    color: colors.light.surface,
  },
  labelOnAccent: {
    color: colors.light.text,
  },
});

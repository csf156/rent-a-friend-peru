import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { verifyOtp, requestOtp, type Contact } from '@/lib/auth';
import { getOwnProfile, isProfileComplete } from '@/lib/profile';
import { useResendCooldown } from '@/hooks/useResendCooldown';
import { colors, typography } from '@/lib/theme';
import { Button } from '@/components/Button';

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type: 'phone' | 'email'; value: string }>();
  const contact: Contact = { type: params.type, value: params.value };

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { remaining, canResend, start } = useResendCooldown(RESEND_COOLDOWN_SECONDS);

  async function handleVerify() {
    setError(null);
    setLoading(true);
    const result = await verifyOtp(contact, code);

    if (result.error) {
      setLoading(false);
      setError(result.error);
      return;
    }

    const profile = await getOwnProfile();
    setLoading(false);

    if (!profile) {
      router.replace('/(auth)/select-role');
    } else if (!isProfileComplete(profile)) {
      router.replace('/(auth)/profile-setup');
    } else if (profile.kyc_estado !== 'verificado') {
      router.replace('/(auth)/kyc');
    } else {
      router.replace('/');
    }
  }

  async function handleResend() {
    setError(null);
    start();
    await requestOtp(contact);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ingresa el código</Text>
      <Text style={styles.subtitle}>Enviado a {params.value}</Text>

      <TextInput
        style={styles.input}
        placeholder="000000"
        placeholderTextColor={colors.light.textMuted}
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button label="Verificar" onPress={handleVerify} disabled={loading} />

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canResend }}
        disabled={!canResend}
        onPress={handleResend}
      >
        <Text style={[styles.resend, !canResend && styles.resendDisabled]}>
          {canResend ? 'Reenviar código' : `Reenviar en ${remaining}s`}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.bg,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.light.text,
  },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    color: colors.light.textMuted,
  },
  input: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xl,
    letterSpacing: 8,
    textAlign: 'center',
    color: colors.light.text,
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 12,
    paddingVertical: 12,
  },
  error: {
    fontFamily: typography.fontFamily.body,
    color: colors.light.danger,
  },
  resend: {
    fontFamily: typography.fontFamily.body,
    color: colors.light.primary,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  resendDisabled: {
    color: colors.light.textMuted,
  },
});

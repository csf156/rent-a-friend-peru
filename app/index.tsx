import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography } from '@/lib/theme';
import { Button } from '@/components/Button';

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rent a Friend Perú</Text>
      <Button label="Ver mi perfil" onPress={() => router.push('/profile')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light.bg,
    gap: 16,
    padding: 24,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.light.text,
  },
});

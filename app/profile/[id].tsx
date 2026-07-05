import { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getPublicProfile, type PublicProfile } from '@/lib/profile';
import { getPhotoSignedUrl } from '@/lib/storage';
import { colors, typography } from '@/lib/theme';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getPublicProfile(id).then(async (data) => {
      if (!data) {
        setNotFound(true);
        return;
      }
      setProfile(data);
      if (data.foto_url) {
        const signed = await getPhotoSignedUrl(data.foto_url);
        setPhotoUrl(signed.url);
      }
    });
  }, [id]);

  if (notFound) {
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>Perfil no encontrado.</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>Cargando…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {photoUrl && <Image source={{ uri: photoUrl }} style={styles.photo} />}
      <Text style={styles.title}>{profile.alias}</Text>
      {profile.kyc_estado === 'verificado' && <Text style={styles.badge}>Verificado ✓</Text>}
      <Text style={styles.field}>
        {profile.edad} años · {profile.genero}
      </Text>
      <Text style={styles.field}>{profile.profesion}</Text>
      {profile.hobbies?.length > 0 && (
        <Text style={styles.field}>Hobbies: {profile.hobbies.join(', ')}</Text>
      )}
      {profile.intereses?.length > 0 && (
        <Text style={styles.field}>Intereses: {profile.intereses.join(', ')}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.light.bg,
    padding: 24,
    gap: 8,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignSelf: 'center',
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.light.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    color: colors.light.textMuted,
    textAlign: 'center',
  },
  badge: {
    fontFamily: typography.fontFamily.body,
    color: colors.light.success,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  field: {
    fontFamily: typography.fontFamily.body,
    color: colors.light.text,
    textAlign: 'center',
  },
});

import { supabase } from '@/lib/supabase';
import type { AuthResult } from '@/lib/auth';
import { isProfileComplete, type OwnProfile } from '@/lib/profile-complete';

export type { OwnProfile };
export { isProfileComplete };

const PROFILE_SELECT = 'rol, nombre, alias, edad, genero, profesion, foto_url';

/** Returns the signed-in user's profile, or null if none exists yet. */
export async function getOwnProfile(): Promise<OwnProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', user.id)
    .maybeSingle();

  return data as OwnProfile | null;
}

export type ProfileFormFields = {
  nombre: string;
  alias: string;
  edad: number;
  genero: string;
  profesion: string;
  hobbies: string[];
  intereses: string[];
  foto_url?: string;
};

/**
 * Updates the signed-in user's editable profile fields. Only the columns
 * granted to `authenticated` (see 20260703120100_column_privileges.sql) can
 * ever be written this way — anything else is rejected server-side.
 */
export async function updateOwnProfile(fields: Partial<ProfileFormFields>): Promise<AuthResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No hay sesión activa.' };
  }

  const { error } = await supabase.from('profiles').update(fields).eq('id', user.id);

  return { error: error?.message ?? null };
}

export type PreferenciasSalidaFields = {
  sexo_pref?: string;
  tipo_salida?: string;
  horario?: string;
  distritos?: string[];
};

/** Creates or replaces the amigo's preferencias_salida row (1:1 with profiles). */
export async function upsertPreferenciasSalida(
  fields: PreferenciasSalidaFields,
): Promise<AuthResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No hay sesión activa.' };
  }

  const { error } = await supabase
    .from('preferencias_salida')
    .upsert({ perfil_id: user.id, ...fields }, { onConflict: 'perfil_id' });

  return { error: error?.message ?? null };
}

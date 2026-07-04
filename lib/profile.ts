import { supabase } from '@/lib/supabase';
import type { RolUsuario } from '@/lib/auth';

export type OwnProfile = { rol: RolUsuario };

/** Returns the signed-in user's profile (just the rol), or null if none exists yet. */
export async function getOwnProfile(): Promise<OwnProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase.from('profiles').select('rol').eq('id', user.id).maybeSingle();

  return data ? { rol: data.rol } : null;
}

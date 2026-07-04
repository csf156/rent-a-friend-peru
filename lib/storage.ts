import { supabase } from '@/lib/supabase';

export type UploadResult = { path: string | null; error: string | null };

/**
 * Uploads a locally-picked profile photo to the private `fotos` bucket
 * under `<uid>/foto.jpg` (owner-write policy from Fase 1.1). Returns the
 * storage PATH, not a public URL — the bucket is private, so callers must
 * request a signed URL to display it.
 */
export async function uploadProfilePhoto(localUri: string): Promise<UploadResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { path: null, error: 'No hay sesión activa.' };
  }

  const response = await fetch(localUri);
  const bytes = await response.arrayBuffer();
  const path = `${user.id}/foto.jpg`;

  const { error } = await supabase.storage
    .from('fotos')
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });

  if (error) {
    return { path: null, error: error.message };
  }

  return { path, error: null };
}

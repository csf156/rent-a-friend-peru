import { supabase } from '@/lib/supabase';

export type UploadResult = { path: string | null; error: string | null };

async function uploadToBucket(bucket: string, path: string, localUri: string): Promise<UploadResult> {
  const response = await fetch(localUri);
  const bytes = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });

  if (error) {
    return { path: null, error: error.message };
  }

  return { path, error: null };
}

async function getOwnUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Uploads a locally-picked profile photo to the private `fotos` bucket
 * under `<uid>/foto.jpg` (owner-write policy from Fase 1.1). Returns the
 * storage PATH, not a public URL — the bucket is private, so callers must
 * request a signed URL to display it.
 */
export async function uploadProfilePhoto(localUri: string): Promise<UploadResult> {
  const uid = await getOwnUserId();
  if (!uid) {
    return { path: null, error: 'No hay sesión activa.' };
  }
  return uploadToBucket('fotos', `${uid}/foto.jpg`, localUri);
}

export type DniDocumentKind = 'dni' | 'selfie';

/**
 * Uploads the DNI photo or liveness selfie to the private `dni` bucket
 * (owner-only read/write, Fase 1.1) under `<uid>/<kind>.jpg`.
 */
export async function uploadDniDocument(
  kind: DniDocumentKind,
  localUri: string,
): Promise<UploadResult> {
  const uid = await getOwnUserId();
  if (!uid) {
    return { path: null, error: 'No hay sesión activa.' };
  }
  return uploadToBucket('dni', `${uid}/${kind}.jpg`, localUri);
}

export type SignedUrlResult = { url: string | null; error: string | null };

/**
 * The `fotos` bucket is private (any authenticated user may read per the
 * fotos_select_authenticated storage policy, but the bucket itself isn't
 * public), so displaying a photo — own or someone else's public profile —
 * requires a short-lived signed URL rather than a plain public URL.
 */
export async function getPhotoSignedUrl(path: string, expiresIn = 3600): Promise<SignedUrlResult> {
  const { data, error } = await supabase.storage.from('fotos').createSignedUrl(path, expiresIn);

  if (error) {
    return { url: null, error: error.message };
  }

  return { url: data.signedUrl, error: null };
}

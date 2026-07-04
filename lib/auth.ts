import { supabase } from '@/lib/supabase';
import { isValidEmail, toE164Peru } from '@/lib/validation';

export type Contact = { type: 'email'; value: string } | { type: 'phone'; value: string };

export type RolUsuario = 'amigo' | 'rentador';

export type AuthResult = { error: string | null };

function normalizeContact(contact: Contact): { field: 'email' | 'phone'; value: string } | null {
  if (contact.type === 'email') {
    return isValidEmail(contact.value) ? { field: 'email', value: contact.value.trim() } : null;
  }
  const e164 = toE164Peru(contact.value);
  return e164 ? { field: 'phone', value: e164 } : null;
}

const INVALID_MESSAGE: Record<Contact['type'], string> = {
  email: 'Correo inválido.',
  phone: 'Número de celular inválido.',
};

/** Sends a one-time code to the given email or Peru mobile number. */
export async function requestOtp(contact: Contact): Promise<AuthResult> {
  const normalized = normalizeContact(contact);
  if (!normalized) {
    return { error: INVALID_MESSAGE[contact.type] };
  }

  const { error } = await supabase.auth.signInWithOtp({
    [normalized.field]: normalized.value,
  } as { email: string } | { phone: string });

  return { error: error?.message ?? null };
}

/** Verifies a one-time code previously sent via requestOtp. */
export async function verifyOtp(contact: Contact, token: string): Promise<AuthResult> {
  const normalized = normalizeContact(contact);
  if (!normalized) {
    return { error: INVALID_MESSAGE[contact.type] };
  }

  const { error } = await supabase.auth.verifyOtp(
    normalized.field === 'email'
      ? { email: normalized.value, token, type: 'email' }
      : { phone: normalized.value, token, type: 'sms' },
  );

  return { error: error?.message ?? null };
}

/**
 * Bootstraps the `profiles` row for the signed-in user on first login.
 * Only (id, rol) are sent — every other column is service_role-only
 * (see supabase/migrations/20260703120100_column_privileges.sql).
 */
export async function createProfile(rol: RolUsuario): Promise<AuthResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No hay sesión activa.' };
  }

  const { error } = await supabase.from('profiles').insert({ id: user.id, rol });

  return { error: error?.message ?? null };
}

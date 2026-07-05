import { supabase } from '@/lib/supabase';

export type KycEstado = 'pendiente' | 'verificado' | 'rechazado';
export type KycResult = { estado: KycEstado | null; error: string | null };

/**
 * Kicks off identity verification via the kyc-start Edge Function. In demo
 * mode (default) this resolves to 'verificado' immediately; with Truora
 * configured server-side it resolves to 'pendiente' and the real result
 * arrives later via kyc-webhook.
 */
export async function startKycVerification(dniPath: string, selfiePath: string): Promise<KycResult> {
  const { data, error } = await supabase.functions.invoke('kyc-start', {
    body: { dniPath, selfiePath },
  });

  if (error) {
    return { estado: null, error: error.message };
  }

  return { estado: data.estado, error: null };
}

// Edge Function: kyc-webhook
//
// Recibe el resultado de Truora (solo aplica en modo TRUORA real — en modo
// demo, kyc-start ya resuelve todo de forma síncrona y este webhook nunca
// se invoca). Valida la firma HMAC, y actualiza kyc_verificaciones +
// profiles de forma idempotente por external_id.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  parseTruoraWebhookPayload,
  shouldProcessWebhook,
  verifyWebhookSignature,
} from '../_shared/kyc.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('truora-signature') ?? '';
  const secret = Deno.env.get('TRUORA_WEBHOOK_SECRET')!;

  const validSignature = await verifyWebhookSignature(rawBody, signature, secret);
  if (!validSignature) {
    return Response.json({ error: 'Firma inválida.' }, { status: 401 });
  }

  const parsed = parseTruoraWebhookPayload(JSON.parse(rawBody));
  if (!parsed) {
    return Response.json({ error: 'Payload no reconocido.' }, { status: 400 });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: verificacion } = await admin
    .from('kyc_verificaciones')
    .select('id, perfil_id, estado')
    .eq('external_id', parsed.externalId)
    .maybeSingle();

  if (!verificacion) {
    return Response.json({ error: 'Verificación no encontrada.' }, { status: 404 });
  }

  // Idempotente: un mismo evento recibido dos veces no reprocesa nada.
  if (!shouldProcessWebhook(verificacion.estado)) {
    return Response.json({ ok: true, deduplicated: true });
  }

  await admin
    .from('kyc_verificaciones')
    .update({ estado: parsed.estado })
    .eq('id', verificacion.id);

  await admin
    .from('profiles')
    .update({
      kyc_estado: parsed.estado,
      verificado_at: parsed.estado === 'verificado' ? new Date().toISOString() : null,
    })
    .eq('id', verificacion.perfil_id);

  return Response.json({ ok: true });
});

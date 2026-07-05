import {
  decideKycProvider,
  runDemoVerification,
  buildTruoraStartRequest,
  verifyWebhookSignature,
  parseTruoraWebhookPayload,
  decideStartAction,
  shouldProcessWebhook,
} from '../../supabase/functions/_shared/kyc';

describe('decideKycProvider', () => {
  it('defaults to demo when no Truora API key is configured', () => {
    expect(decideKycProvider({})).toBe('demo');
  });

  it('defaults to demo when KYC_PROVIDER is unset even if a key exists (explicit opt-in required)', () => {
    expect(decideKycProvider({ TRUORA_API_KEY: 'real-key' })).toBe('demo');
  });

  it('uses truora only when explicitly selected AND a key is present', () => {
    expect(decideKycProvider({ KYC_PROVIDER: 'truora', TRUORA_API_KEY: 'real-key' })).toBe(
      'truora',
    );
  });

  it('falls back to demo if truora is selected but no key is configured (safe default)', () => {
    expect(decideKycProvider({ KYC_PROVIDER: 'truora' })).toBe('demo');
  });
});

describe('runDemoVerification', () => {
  it('always approves, regardless of the scanned paths', () => {
    const result = runDemoVerification();
    expect(result.estado).toBe('verificado');
    expect(typeof result.verificadoAt).toBe('string');
  });
});

describe('buildTruoraStartRequest', () => {
  it('builds the Truora document-validation request with the server-side API key', () => {
    const req = buildTruoraStartRequest({
      apiKey: 'secret-key',
      dniUrl: 'https://example.com/dni.jpg',
      selfieUrl: 'https://example.com/selfie.jpg',
      externalId: 'user-1',
    });

    expect(req.url).toContain('truora.com');
    expect(req.method).toBe('POST');
    expect(req.headers['Truora-API-Key']).toBe('secret-key');
    expect(JSON.parse(req.body)).toEqual({
      external_id: 'user-1',
      front_document_url: 'https://example.com/dni.jpg',
      selfie_url: 'https://example.com/selfie.jpg',
      country: 'PE',
      validations: ['document', 'liveness', 'reniec-check'],
    });
  });
});

describe('verifyWebhookSignature', () => {
  const secret = 'whsec_test';
  const payload = '{"foo":"bar"}';

  async function sign(body: string, key: string): Promise<string> {
    const enc = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(body));
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  it('accepts a correctly signed payload', async () => {
    const signature = await sign(payload, secret);
    await expect(verifyWebhookSignature(payload, signature, secret)).resolves.toBe(true);
  });

  it('rejects a payload signed with the wrong secret', async () => {
    const signature = await sign(payload, 'wrong-secret');
    await expect(verifyWebhookSignature(payload, signature, secret)).resolves.toBe(false);
  });

  it('rejects a tampered payload', async () => {
    const signature = await sign(payload, secret);
    await expect(verifyWebhookSignature('{"foo":"tampered"}', signature, secret)).resolves.toBe(
      false,
    );
  });

  it('rejects a malformed signature header', async () => {
    await expect(verifyWebhookSignature(payload, 'not-hex', secret)).resolves.toBe(false);
  });
});

describe('decideStartAction', () => {
  it('proceeds when there is no prior verification', () => {
    expect(decideStartAction(null)).toBe('proceed');
  });

  it('skips and reports verified when already verified — never re-submits', () => {
    expect(decideStartAction('verificado')).toBe('skip-verified');
  });

  it('skips and reports pending when a verification is already in flight — avoids a duplicate Truora submission/charge', () => {
    expect(decideStartAction('pendiente')).toBe('skip-pending');
  });

  it('proceeds (retry) when the prior attempt was rejected', () => {
    expect(decideStartAction('rechazado')).toBe('proceed');
  });
});

describe('shouldProcessWebhook', () => {
  it('processes a webhook for a verification still pending', () => {
    expect(shouldProcessWebhook('pendiente')).toBe(true);
  });

  it('ignores a duplicate webhook once already verificado', () => {
    expect(shouldProcessWebhook('verificado')).toBe(false);
  });

  it('ignores a duplicate webhook once already rechazado', () => {
    expect(shouldProcessWebhook('rechazado')).toBe(false);
  });
});

describe('parseTruoraWebhookPayload', () => {
  it('parses an approved verification', () => {
    const parsed = parseTruoraWebhookPayload({
      external_id: 'user-1',
      status: 'approved',
    });
    expect(parsed).toEqual({ externalId: 'user-1', estado: 'verificado' });
  });

  it('parses a rejected verification', () => {
    const parsed = parseTruoraWebhookPayload({
      external_id: 'user-1',
      status: 'rejected',
    });
    expect(parsed).toEqual({ externalId: 'user-1', estado: 'rechazado' });
  });

  it('returns null for an unrecognized status', () => {
    expect(
      parseTruoraWebhookPayload({ external_id: 'user-1', status: 'processing' }),
    ).toBeNull();
  });

  it('returns null for a malformed payload', () => {
    expect(parseTruoraWebhookPayload({})).toBeNull();
    expect(parseTruoraWebhookPayload(null)).toBeNull();
  });
});

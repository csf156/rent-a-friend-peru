import { startKycVerification } from '@/lib/kyc';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: { invoke: jest.fn() },
  },
}));

const mockedSupabase = supabase as unknown as {
  functions: { invoke: jest.Mock };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('startKycVerification', () => {
  it('invokes kyc-start with the uploaded document paths and returns the resulting estado', async () => {
    mockedSupabase.functions.invoke.mockResolvedValue({
      data: { estado: 'verificado' },
      error: null,
    });

    const result = await startKycVerification('user-1/dni.jpg', 'user-1/selfie.jpg');

    expect(result.estado).toBe('verificado');
    expect(result.error).toBeNull();
    expect(mockedSupabase.functions.invoke).toHaveBeenCalledWith('kyc-start', {
      body: { dniPath: 'user-1/dni.jpg', selfiePath: 'user-1/selfie.jpg' },
    });
  });

  it('surfaces a function invocation error', async () => {
    mockedSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Rutas inválidas.' },
    });

    const result = await startKycVerification('user-1/dni.jpg', 'user-1/selfie.jpg');

    expect(result.estado).toBeNull();
    expect(result.error).toBe('Rutas inválidas.');
  });
});

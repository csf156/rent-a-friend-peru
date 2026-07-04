import { requestOtp, verifyOtp, createProfile } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

const mockedSupabase = supabase as unknown as {
  auth: {
    signInWithOtp: jest.Mock;
    verifyOtp: jest.Mock;
    getUser: jest.Mock;
  };
  from: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('requestOtp', () => {
  it('sends an OTP to a valid email', async () => {
    mockedSupabase.auth.signInWithOtp.mockResolvedValue({ error: null });

    const result = await requestOtp({ type: 'email', value: 'ana@example.com' });

    expect(result.error).toBeNull();
    expect(mockedSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'ana@example.com',
    });
  });

  it('normalizes and sends an OTP to a valid Peru phone', async () => {
    mockedSupabase.auth.signInWithOtp.mockResolvedValue({ error: null });

    const result = await requestOtp({ type: 'phone', value: '987654321' });

    expect(result.error).toBeNull();
    expect(mockedSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
      phone: '+51987654321',
    });
  });

  it('rejects an invalid email without calling supabase', async () => {
    const result = await requestOtp({ type: 'email', value: 'not-an-email' });

    expect(result.error).toBe('Correo inválido.');
    expect(mockedSupabase.auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it('rejects an invalid phone without calling supabase', async () => {
    const result = await requestOtp({ type: 'phone', value: '12345' });

    expect(result.error).toBe('Número de celular inválido.');
    expect(mockedSupabase.auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it('surfaces the provider error message', async () => {
    mockedSupabase.auth.signInWithOtp.mockResolvedValue({
      error: { message: 'rate limit exceeded' },
    });

    const result = await requestOtp({ type: 'email', value: 'ana@example.com' });

    expect(result.error).toBe('rate limit exceeded');
  });
});

describe('verifyOtp', () => {
  it('verifies a phone OTP with the sms type', async () => {
    mockedSupabase.auth.verifyOtp.mockResolvedValue({ error: null });

    const result = await verifyOtp({ type: 'phone', value: '987654321' }, '123456');

    expect(result.error).toBeNull();
    expect(mockedSupabase.auth.verifyOtp).toHaveBeenCalledWith({
      phone: '+51987654321',
      token: '123456',
      type: 'sms',
    });
  });

  it('verifies an email OTP with the email type', async () => {
    mockedSupabase.auth.verifyOtp.mockResolvedValue({ error: null });

    const result = await verifyOtp({ type: 'email', value: 'ana@example.com' }, '654321');

    expect(result.error).toBeNull();
    expect(mockedSupabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: 'ana@example.com',
      token: '654321',
      type: 'email',
    });
  });

  it('surfaces an invalid/expired token error', async () => {
    mockedSupabase.auth.verifyOtp.mockResolvedValue({
      error: { message: 'Token has expired or is invalid' },
    });

    const result = await verifyOtp({ type: 'email', value: 'ana@example.com' }, '000000');

    expect(result.error).toBe('Token has expired or is invalid');
  });
});

describe('createProfile', () => {
  it('creates a profile row for the signed-in user with only id and rol', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    const insert = jest.fn().mockResolvedValue({ error: null });
    mockedSupabase.from.mockReturnValue({ insert });

    const result = await createProfile('amigo');

    expect(result.error).toBeNull();
    expect(mockedSupabase.from).toHaveBeenCalledWith('profiles');
    expect(insert).toHaveBeenCalledWith({ id: 'user-123', rol: 'amigo' });
  });

  it('errors out if there is no signed-in user', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await createProfile('rentador');

    expect(result.error).toBe('No hay sesión activa.');
    expect(mockedSupabase.from).not.toHaveBeenCalled();
  });
});

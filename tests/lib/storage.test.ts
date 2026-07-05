import { uploadProfilePhoto, uploadDniDocument } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    storage: { from: jest.fn() },
  },
}));

const mockedSupabase = supabase as unknown as {
  auth: { getUser: jest.Mock };
  storage: { from: jest.Mock };
};

const originalFetch = globalThis.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.fetch = jest.fn();
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

describe('uploadProfilePhoto', () => {
  it('uploads the image bytes to the fotos bucket under the user id and returns the path', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const arrayBuffer = new ArrayBuffer(4);
    (globalThis.fetch as jest.Mock).mockResolvedValue({ arrayBuffer: async () => arrayBuffer });
    const upload = jest.fn().mockResolvedValue({ error: null });
    mockedSupabase.storage.from.mockReturnValue({ upload });

    const result = await uploadProfilePhoto('file:///tmp/photo.jpg');

    expect(result.error).toBeNull();
    expect(result.path).toBe('user-1/foto.jpg');
    expect(mockedSupabase.storage.from).toHaveBeenCalledWith('fotos');
    expect(upload).toHaveBeenCalledWith('user-1/foto.jpg', arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });
  });

  it('errors out if there is no signed-in user', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const result = await uploadProfilePhoto('file:///tmp/photo.jpg');

    expect(result.path).toBeNull();
    expect(result.error).toBe('No hay sesión activa.');
    expect(mockedSupabase.storage.from).not.toHaveBeenCalled();
  });

  it('surfaces the storage provider error', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    (globalThis.fetch as jest.Mock).mockResolvedValue({ arrayBuffer: async () => new ArrayBuffer(0) });
    const upload = jest.fn().mockResolvedValue({ error: { message: 'storage quota exceeded' } });
    mockedSupabase.storage.from.mockReturnValue({ upload });

    const result = await uploadProfilePhoto('file:///tmp/photo.jpg');

    expect(result.path).toBeNull();
    expect(result.error).toBe('storage quota exceeded');
  });
});

describe('uploadDniDocument', () => {
  it('uploads the DNI photo to the private dni bucket', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const arrayBuffer = new ArrayBuffer(4);
    (globalThis.fetch as jest.Mock).mockResolvedValue({ arrayBuffer: async () => arrayBuffer });
    const upload = jest.fn().mockResolvedValue({ error: null });
    mockedSupabase.storage.from.mockReturnValue({ upload });

    const result = await uploadDniDocument('dni', 'file:///tmp/dni.jpg');

    expect(result.error).toBeNull();
    expect(result.path).toBe('user-1/dni.jpg');
    expect(mockedSupabase.storage.from).toHaveBeenCalledWith('dni');
    expect(upload).toHaveBeenCalledWith('user-1/dni.jpg', arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });
  });

  it('uploads the selfie under a distinct path from the DNI photo', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      arrayBuffer: async () => new ArrayBuffer(4),
    });
    const upload = jest.fn().mockResolvedValue({ error: null });
    mockedSupabase.storage.from.mockReturnValue({ upload });

    const result = await uploadDniDocument('selfie', 'file:///tmp/selfie.jpg');

    expect(result.path).toBe('user-1/selfie.jpg');
  });

  it('errors out if there is no signed-in user', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const result = await uploadDniDocument('dni', 'file:///tmp/dni.jpg');

    expect(result.path).toBeNull();
    expect(result.error).toBe('No hay sesión activa.');
    expect(mockedSupabase.storage.from).not.toHaveBeenCalled();
  });
});

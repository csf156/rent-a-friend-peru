import {
  getOwnProfile,
  isProfileComplete,
  updateOwnProfile,
  upsertPreferenciasSalida,
} from '@/lib/profile';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}));

const mockedSupabase = supabase as unknown as {
  auth: { getUser: jest.Mock };
  from: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getOwnProfile', () => {
  it('returns null when there is no signed-in user', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const profile = await getOwnProfile();

    expect(profile).toBeNull();
    expect(mockedSupabase.from).not.toHaveBeenCalled();
  });

  it('returns null when the user has no profile row yet', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const maybeSingle = jest.fn().mockResolvedValue({ data: null });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    mockedSupabase.from.mockReturnValue({ select });

    const profile = await getOwnProfile();

    expect(profile).toBeNull();
    expect(mockedSupabase.from).toHaveBeenCalledWith('profiles');
    expect(select).toHaveBeenCalledWith(
      'rol, nombre, alias, edad, genero, profesion, foto_url',
    );
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('returns the profile fields when the row exists', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const rowData = {
      rol: 'amigo',
      nombre: 'Ana',
      alias: 'Ani',
      edad: 25,
      genero: 'femenino',
      profesion: 'Diseñadora',
      foto_url: 'user-1/foto.jpg',
    };
    const maybeSingle = jest.fn().mockResolvedValue({ data: rowData });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    mockedSupabase.from.mockReturnValue({ select });

    const profile = await getOwnProfile();

    expect(profile).toEqual(rowData);
  });
});

describe('isProfileComplete', () => {
  const base = {
    rol: 'amigo' as const,
    nombre: 'Ana',
    alias: 'Ani',
    edad: 25,
    genero: 'femenino',
    profesion: 'Diseñadora',
    foto_url: 'user-1/foto.jpg',
  };

  it('returns true when all required fields are present', () => {
    expect(isProfileComplete(base)).toBe(true);
  });

  it('returns false when null', () => {
    expect(isProfileComplete(null)).toBe(false);
  });

  it.each(['nombre', 'alias', 'edad', 'genero', 'profesion', 'foto_url'] as const)(
    'returns false when %s is missing',
    (field) => {
      expect(isProfileComplete({ ...base, [field]: null })).toBe(false);
    },
  );
});

describe('updateOwnProfile', () => {
  it('updates only the editable fields for the signed-in user', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const eq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn().mockReturnValue({ eq });
    mockedSupabase.from.mockReturnValue({ update });

    const fields = {
      nombre: 'Ana',
      alias: 'Ani',
      edad: 25,
      genero: 'femenino',
      profesion: 'Diseñadora',
      hobbies: ['cine'],
      intereses: ['viajar'],
    };
    const result = await updateOwnProfile(fields);

    expect(result.error).toBeNull();
    expect(mockedSupabase.from).toHaveBeenCalledWith('profiles');
    expect(update).toHaveBeenCalledWith(fields);
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('errors out if there is no signed-in user', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const result = await updateOwnProfile({ nombre: 'Ana' });

    expect(result.error).toBe('No hay sesión activa.');
    expect(mockedSupabase.from).not.toHaveBeenCalled();
  });
});

describe('upsertPreferenciasSalida', () => {
  it('upserts the row keyed by perfil_id', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const upsert = jest.fn().mockResolvedValue({ error: null });
    mockedSupabase.from.mockReturnValue({ upsert });

    const fields = {
      sexo_pref: 'cualquiera',
      tipo_salida: 'divertida',
      horario: 'noche',
      distritos: ['Miraflores'],
    };
    const result = await upsertPreferenciasSalida(fields);

    expect(result.error).toBeNull();
    expect(mockedSupabase.from).toHaveBeenCalledWith('preferencias_salida');
    expect(upsert).toHaveBeenCalledWith(
      { perfil_id: 'user-1', ...fields },
      { onConflict: 'perfil_id' },
    );
  });

  it('errors out if there is no signed-in user', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const result = await upsertPreferenciasSalida({ sexo_pref: 'cualquiera' });

    expect(result.error).toBe('No hay sesión activa.');
    expect(mockedSupabase.from).not.toHaveBeenCalled();
  });
});

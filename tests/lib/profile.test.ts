import { getOwnProfile } from '@/lib/profile';
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
    expect(select).toHaveBeenCalledWith('rol');
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('returns the rol when the profile row exists', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const maybeSingle = jest.fn().mockResolvedValue({ data: { rol: 'amigo' } });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    mockedSupabase.from.mockReturnValue({ select });

    const profile = await getOwnProfile();

    expect(profile).toEqual({ rol: 'amigo' });
  });
});

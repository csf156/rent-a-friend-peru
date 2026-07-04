import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useAuthSession } from '@/hooks/useAuthSession';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

const mockedSupabase = supabase as unknown as {
  auth: {
    getSession: jest.Mock;
    onAuthStateChange: jest.Mock;
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedSupabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
});

describe('useAuthSession', () => {
  it('starts loading, then resolves with the persisted session', async () => {
    let resolveGetSession: (value: { data: { session: unknown } }) => void = () => {};
    mockedSupabase.auth.getSession.mockReturnValue(
      new Promise((resolve) => {
        resolveGetSession = resolve;
      }),
    );

    const { result } = await renderHook(() => useAuthSession());

    expect(result.current.loading).toBe(true);

    resolveGetSession({ data: { session: { user: { id: 'user-1' } } } });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.session?.user.id).toBe('user-1');
  });

  it('resolves with no session when signed out', async () => {
    mockedSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });

    const { result } = await renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.session).toBeNull();
  });

  it('updates the session when onAuthStateChange fires', async () => {
    mockedSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    let authChangeCallback: (event: string, session: unknown) => void = () => {};
    mockedSupabase.auth.onAuthStateChange.mockImplementation((cb) => {
      authChangeCallback = cb;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    const { result } = await renderHook(() => useAuthSession());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      authChangeCallback('SIGNED_IN', { user: { id: 'user-2' } });
    });

    await waitFor(() => {
      expect(result.current.session?.user.id).toBe('user-2');
    });
  });
});

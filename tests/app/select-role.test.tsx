import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import SelectRoleScreen from '@/app/(auth)/select-role';
import { createProfile } from '@/lib/auth';

jest.mock('@/lib/auth', () => ({
  createProfile: jest.fn(),
}));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockedCreateProfile = createProfile as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SelectRoleScreen', () => {
  it('creates an "amigo" profile and navigates home', async () => {
    mockedCreateProfile.mockResolvedValue({ error: null });
    await render(<SelectRoleScreen />);

    await fireEvent.press(screen.getByText('Soy amigo'));

    await waitFor(() => {
      expect(mockedCreateProfile).toHaveBeenCalledWith('amigo');
    });
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('creates a "rentador" profile and navigates home', async () => {
    mockedCreateProfile.mockResolvedValue({ error: null });
    await render(<SelectRoleScreen />);

    await fireEvent.press(screen.getByText('Soy rentador'));

    await waitFor(() => {
      expect(mockedCreateProfile).toHaveBeenCalledWith('rentador');
    });
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('shows an error and does not navigate if profile creation fails', async () => {
    mockedCreateProfile.mockResolvedValue({ error: 'No hay sesión activa.' });
    await render(<SelectRoleScreen />);

    await fireEvent.press(screen.getByText('Soy amigo'));

    expect(await screen.findByText('No hay sesión activa.')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

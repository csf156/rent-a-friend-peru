import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileSetupScreen from '@/app/(auth)/profile-setup';
import { getOwnProfile, updateOwnProfile, upsertPreferenciasSalida } from '@/lib/profile';
import { uploadProfilePhoto } from '@/lib/storage';
import * as ImagePicker from 'expo-image-picker';

jest.mock('@/lib/profile', () => ({
  getOwnProfile: jest.fn(),
  updateOwnProfile: jest.fn(),
  upsertPreferenciasSalida: jest.fn(),
}));
jest.mock('@/lib/storage', () => ({
  uploadProfilePhoto: jest.fn(),
}));
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockedGetOwnProfile = getOwnProfile as jest.Mock;
const mockedUpdateOwnProfile = updateOwnProfile as jest.Mock;
const mockedUpsertPreferencias = upsertPreferenciasSalida as jest.Mock;
const mockedUploadPhoto = uploadProfilePhoto as jest.Mock;
const mockedPickImage = ImagePicker.launchImageLibraryAsync as jest.Mock;
const mockedRequestPermission = ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;

async function fillRequiredFields() {
  await fireEvent.changeText(screen.getByPlaceholderText('Nombre completo'), 'Ana Torres');
  await fireEvent.changeText(screen.getByPlaceholderText('Alias'), 'Ani');
  await fireEvent.changeText(screen.getByPlaceholderText('Edad'), '25');
  await fireEvent.changeText(screen.getByPlaceholderText('Género'), 'femenino');
  await fireEvent.changeText(screen.getByPlaceholderText('Profesión'), 'Diseñadora');

  mockedRequestPermission.mockResolvedValue({ granted: true });
  mockedPickImage.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///photo.jpg' }] });
  mockedUploadPhoto.mockResolvedValue({ path: 'user-1/foto.jpg', error: null });
  await fireEvent.press(screen.getByText('Elegir foto'));
  await screen.findByText('Foto lista ✓');
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ProfileSetupScreen (amigo)', () => {
  beforeEach(() => {
    mockedGetOwnProfile.mockResolvedValue({ rol: 'amigo' });
  });

  it('blocks submit and shows an error when required fields are missing', async () => {
    await render(<ProfileSetupScreen />);
    await screen.findByText('Continuar');

    await fireEvent.press(screen.getByText('Continuar'));

    expect(await screen.findByText('Completa todos los campos obligatorios.')).toBeTruthy();
    expect(mockedUpdateOwnProfile).not.toHaveBeenCalled();
  });

  it('blocks submit when age is under 18', async () => {
    await render(<ProfileSetupScreen />);
    await screen.findByText('Continuar');

    await fireEvent.changeText(screen.getByPlaceholderText('Nombre completo'), 'Ana Torres');
    await fireEvent.changeText(screen.getByPlaceholderText('Alias'), 'Ani');
    await fireEvent.changeText(screen.getByPlaceholderText('Edad'), '17');
    await fireEvent.changeText(screen.getByPlaceholderText('Género'), 'femenino');
    await fireEvent.changeText(screen.getByPlaceholderText('Profesión'), 'Diseñadora');

    mockedRequestPermission.mockResolvedValue({ granted: true });
    mockedPickImage.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///photo.jpg' }] });
    mockedUploadPhoto.mockResolvedValue({ path: 'user-1/foto.jpg', error: null });
    await fireEvent.press(screen.getByText('Elegir foto'));
    await screen.findByText('Foto lista ✓');

    await fireEvent.press(screen.getByText('Continuar'));

    expect(await screen.findByText('Debes ser mayor de 18 años.')).toBeTruthy();
    expect(mockedUpdateOwnProfile).not.toHaveBeenCalled();
  });

  it('saves the profile and preferencias_salida for an amigo, then navigates home', async () => {
    mockedUpdateOwnProfile.mockResolvedValue({ error: null });
    mockedUpsertPreferencias.mockResolvedValue({ error: null });
    await render(<ProfileSetupScreen />);
    await screen.findByText('Continuar');

    await fillRequiredFields();
    await fireEvent.changeText(screen.getByPlaceholderText('Hobbies (separados por coma)'), 'cine, viajar');
    await fireEvent.changeText(
      screen.getByPlaceholderText('Intereses (separados por coma)'),
      'música',
    );
    await fireEvent.changeText(screen.getByPlaceholderText('Distritos (separados por coma)'), 'Miraflores');

    await fireEvent.press(screen.getByText('Continuar'));

    await waitFor(() => {
      expect(mockedUpdateOwnProfile).toHaveBeenCalledWith({
        nombre: 'Ana Torres',
        alias: 'Ani',
        edad: 25,
        genero: 'femenino',
        profesion: 'Diseñadora',
        hobbies: ['cine', 'viajar'],
        intereses: ['música'],
        foto_url: 'user-1/foto.jpg',
      });
    });
    expect(mockedUpsertPreferencias).toHaveBeenCalledWith({
      distritos: ['Miraflores'],
    });
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('shows an error and does not navigate if saving the profile fails', async () => {
    mockedUpdateOwnProfile.mockResolvedValue({ error: 'algo salió mal' });
    await render(<ProfileSetupScreen />);
    await screen.findByText('Continuar');

    await fillRequiredFields();
    await fireEvent.press(screen.getByText('Continuar'));

    expect(await screen.findByText('algo salió mal')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe('ProfileSetupScreen (rentador)', () => {
  it('does not show preferencias_salida fields and skips that call on save', async () => {
    mockedGetOwnProfile.mockResolvedValue({ rol: 'rentador' });
    mockedUpdateOwnProfile.mockResolvedValue({ error: null });
    await render(<ProfileSetupScreen />);
    await screen.findByText('Continuar');

    expect(screen.queryByPlaceholderText('Distritos (separados por coma)')).toBeNull();

    await fillRequiredFields();
    await fireEvent.press(screen.getByText('Continuar'));

    await waitFor(() => {
      expect(mockedUpdateOwnProfile).toHaveBeenCalled();
    });
    expect(mockedUpsertPreferencias).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});

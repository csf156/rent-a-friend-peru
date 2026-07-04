import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import SignInScreen from '@/app/(auth)/sign-in';
import { requestOtp } from '@/lib/auth';

jest.mock('@/lib/auth', () => ({
  requestOtp: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockedRequestOtp = requestOtp as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SignInScreen', () => {
  it('shows a validation error for an invalid email and does not call requestOtp', async () => {
    await render(<SignInScreen />);

    await fireEvent.press(screen.getByText('Correo'));
    await fireEvent.changeText(screen.getByPlaceholderText('tu@correo.com'), 'no-es-un-correo');
    await fireEvent.press(screen.getByText('Enviar código'));

    expect(await screen.findByText('Correo inválido.')).toBeTruthy();
    expect(mockedRequestOtp).not.toHaveBeenCalled();
  });

  it('sends the OTP and navigates to verify-otp on success', async () => {
    mockedRequestOtp.mockResolvedValue({ error: null });
    await render(<SignInScreen />);

    await fireEvent.press(screen.getByText('Correo'));
    await fireEvent.changeText(screen.getByPlaceholderText('tu@correo.com'), 'ana@example.com');
    await fireEvent.press(screen.getByText('Enviar código'));

    await waitFor(() => {
      expect(mockedRequestOtp).toHaveBeenCalledWith({ type: 'email', value: 'ana@example.com' });
    });
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(auth)/verify-otp',
      params: { type: 'email', value: 'ana@example.com' },
    });
  });

  it('shows the provider error message and does not navigate on failure', async () => {
    mockedRequestOtp.mockResolvedValue({ error: 'rate limit exceeded' });
    await render(<SignInScreen />);

    await fireEvent.press(screen.getByText('Correo'));
    await fireEvent.changeText(screen.getByPlaceholderText('tu@correo.com'), 'ana@example.com');
    await fireEvent.press(screen.getByText('Enviar código'));

    expect(await screen.findByText('rate limit exceeded')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('defaults to phone mode and validates a Peru number', async () => {
    mockedRequestOtp.mockResolvedValue({ error: null });
    await render(<SignInScreen />);

    await fireEvent.changeText(screen.getByPlaceholderText('987 654 321'), '987654321');
    await fireEvent.press(screen.getByText('Enviar código'));

    await waitFor(() => {
      expect(mockedRequestOtp).toHaveBeenCalledWith({ type: 'phone', value: '987654321' });
    });
  });
});

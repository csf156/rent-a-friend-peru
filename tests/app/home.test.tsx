import { render, screen, fireEvent } from '@testing-library/react-native';
import Home from '@/app/index';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Home', () => {
  it('navigates to the own profile screen when pressing "Ver mi perfil"', async () => {
    await render(<Home />);

    await fireEvent.press(screen.getByText('Ver mi perfil'));

    expect(mockPush).toHaveBeenCalledWith('/profile');
  });
});

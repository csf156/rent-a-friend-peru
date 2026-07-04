import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('renders the label', async () => {
    await render(<Button label="Invitar" onPress={() => {}} />);
    expect(screen.getByText('Invitar')).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<Button label="Invitar" onPress={onPress} />);
    fireEvent.press(screen.getByText('Invitar'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Invitar" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText('Invitar'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('exposes disabled state for accessibility', async () => {
    await render(<Button label="Invitar" onPress={() => {}} disabled />);
    const button = screen.getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });
});

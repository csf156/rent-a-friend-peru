import { render, screen, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Button } from '@/components/Button';
import { colors } from '@/lib/theme';

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

  it('uses AA-compliant dark text on the accent variant', async () => {
    await render(<Button label="Invitar" variant="accent" onPress={() => {}} />);
    const label = screen.getByText('Invitar');
    const flatStyle = StyleSheet.flatten(label.props.style);
    expect(flatStyle.color).toBe(colors.light.text);
  });
});

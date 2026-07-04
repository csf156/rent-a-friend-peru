import { renderHook, act } from '@testing-library/react-native';
import { useResendCooldown } from '@/hooks/useResendCooldown';

describe('useResendCooldown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts able to resend, with no countdown running', async () => {
    const { result } = await renderHook(() => useResendCooldown(30));
    expect(result.current.canResend).toBe(true);
    expect(result.current.remaining).toBe(0);
  });

  it('locks resend and counts down after start() is called', async () => {
    const { result } = await renderHook(() => useResendCooldown(30));

    await act(() => {
      result.current.start();
    });

    expect(result.current.canResend).toBe(false);
    expect(result.current.remaining).toBe(30);

    await act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.remaining).toBe(29);
  });

  it('re-enables resend once the countdown reaches zero', async () => {
    const { result } = await renderHook(() => useResendCooldown(3));

    await act(() => {
      result.current.start();
    });

    await act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.canResend).toBe(true);
    expect(result.current.remaining).toBe(0);
  });
});

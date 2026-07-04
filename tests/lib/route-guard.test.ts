import { computeRedirect } from '@/lib/route-guard';

describe('computeRedirect', () => {
  it('sends a signed-out user on a non-auth screen to sign-in', () => {
    expect(
      computeRedirect({ hasSession: false, profileStatus: 'none', authSegment: null }),
    ).toBe('/(auth)/sign-in');
  });

  it('does not redirect a signed-out user already on sign-in', () => {
    expect(
      computeRedirect({ hasSession: false, profileStatus: 'none', authSegment: 'sign-in' }),
    ).toBeNull();
  });

  it('does not redirect a signed-out user already on verify-otp', () => {
    expect(
      computeRedirect({ hasSession: false, profileStatus: 'none', authSegment: 'verify-otp' }),
    ).toBeNull();
  });

  it('sends a signed-in user with no profile row to select-role', () => {
    expect(
      computeRedirect({ hasSession: true, profileStatus: 'none', authSegment: null }),
    ).toBe('/(auth)/select-role');
  });

  it('does not redirect a signed-in user with no profile already on select-role', () => {
    expect(
      computeRedirect({ hasSession: true, profileStatus: 'none', authSegment: 'select-role' }),
    ).toBeNull();
  });

  it('sends a user with an incomplete profile to profile-setup', () => {
    expect(
      computeRedirect({ hasSession: true, profileStatus: 'incomplete', authSegment: null }),
    ).toBe('/(auth)/profile-setup');
  });

  it('sends a user with an incomplete profile away from select-role to profile-setup', () => {
    expect(
      computeRedirect({
        hasSession: true,
        profileStatus: 'incomplete',
        authSegment: 'select-role',
      }),
    ).toBe('/(auth)/profile-setup');
  });

  it('does not redirect a user with an incomplete profile already on profile-setup', () => {
    expect(
      computeRedirect({
        hasSession: true,
        profileStatus: 'incomplete',
        authSegment: 'profile-setup',
      }),
    ).toBeNull();
  });

  it('sends a fully onboarded user away from any auth screen', () => {
    expect(
      computeRedirect({ hasSession: true, profileStatus: 'complete', authSegment: 'sign-in' }),
    ).toBe('/');
  });

  it('does not redirect a fully onboarded user already outside the auth group', () => {
    expect(
      computeRedirect({ hasSession: true, profileStatus: 'complete', authSegment: null }),
    ).toBeNull();
  });
});

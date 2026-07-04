import { computeRedirect } from '@/lib/route-guard';

describe('computeRedirect', () => {
  it('sends a signed-out user on a non-auth screen to sign-in', () => {
    expect(computeRedirect({ hasSession: false, hasProfile: false, authSegment: null })).toBe(
      '/(auth)/sign-in',
    );
  });

  it('does not redirect a signed-out user already on sign-in', () => {
    expect(
      computeRedirect({ hasSession: false, hasProfile: false, authSegment: 'sign-in' }),
    ).toBeNull();
  });

  it('does not redirect a signed-out user already on verify-otp', () => {
    expect(
      computeRedirect({ hasSession: false, hasProfile: false, authSegment: 'verify-otp' }),
    ).toBeNull();
  });

  it('sends a signed-in user with no profile to select-role', () => {
    expect(computeRedirect({ hasSession: true, hasProfile: false, authSegment: null })).toBe(
      '/(auth)/select-role',
    );
  });

  it('does not redirect a signed-in user with no profile already on select-role', () => {
    expect(
      computeRedirect({ hasSession: true, hasProfile: false, authSegment: 'select-role' }),
    ).toBeNull();
  });

  it('sends a fully onboarded user away from any auth screen', () => {
    expect(computeRedirect({ hasSession: true, hasProfile: true, authSegment: 'sign-in' })).toBe(
      '/',
    );
  });

  it('does not redirect a fully onboarded user already outside the auth group', () => {
    expect(computeRedirect({ hasSession: true, hasProfile: true, authSegment: null })).toBeNull();
  });
});

import { computeRedirect } from '@/lib/route-guard';

describe('computeRedirect', () => {
  it('sends a signed-out user on a non-auth screen to sign-in', () => {
    expect(
      computeRedirect({
        hasSession: false,
        profileStatus: 'none',
        kycEstado: 'pendiente',
        authSegment: null,
      }),
    ).toBe('/(auth)/sign-in');
  });

  it('does not redirect a signed-out user already on sign-in', () => {
    expect(
      computeRedirect({
        hasSession: false,
        profileStatus: 'none',
        kycEstado: 'pendiente',
        authSegment: 'sign-in',
      }),
    ).toBeNull();
  });

  it('does not redirect a signed-out user already on verify-otp', () => {
    expect(
      computeRedirect({
        hasSession: false,
        profileStatus: 'none',
        kycEstado: 'pendiente',
        authSegment: 'verify-otp',
      }),
    ).toBeNull();
  });

  it('sends a signed-in user with no profile row to select-role', () => {
    expect(
      computeRedirect({
        hasSession: true,
        profileStatus: 'none',
        kycEstado: 'pendiente',
        authSegment: null,
      }),
    ).toBe('/(auth)/select-role');
  });

  it('does not redirect a signed-in user with no profile already on select-role', () => {
    expect(
      computeRedirect({
        hasSession: true,
        profileStatus: 'none',
        kycEstado: 'pendiente',
        authSegment: 'select-role',
      }),
    ).toBeNull();
  });

  it('sends a user with an incomplete profile to profile-setup', () => {
    expect(
      computeRedirect({
        hasSession: true,
        profileStatus: 'incomplete',
        kycEstado: 'pendiente',
        authSegment: null,
      }),
    ).toBe('/(auth)/profile-setup');
  });

  it('sends a user with an incomplete profile away from select-role to profile-setup', () => {
    expect(
      computeRedirect({
        hasSession: true,
        profileStatus: 'incomplete',
        kycEstado: 'pendiente',
        authSegment: 'select-role',
      }),
    ).toBe('/(auth)/profile-setup');
  });

  it('does not redirect a user with an incomplete profile already on profile-setup', () => {
    expect(
      computeRedirect({
        hasSession: true,
        profileStatus: 'incomplete',
        kycEstado: 'pendiente',
        authSegment: 'profile-setup',
      }),
    ).toBeNull();
  });

  it('sends a user with a complete profile but unverified KYC to the kyc screen', () => {
    expect(
      computeRedirect({
        hasSession: true,
        profileStatus: 'complete',
        kycEstado: 'pendiente',
        authSegment: null,
      }),
    ).toBe('/(auth)/kyc');
  });

  it('sends a user with rejected KYC back to the kyc screen to retry', () => {
    expect(
      computeRedirect({
        hasSession: true,
        profileStatus: 'complete',
        kycEstado: 'rechazado',
        authSegment: null,
      }),
    ).toBe('/(auth)/kyc');
  });

  it('does not redirect a user with pending KYC already on the kyc screen', () => {
    expect(
      computeRedirect({
        hasSession: true,
        profileStatus: 'complete',
        kycEstado: 'pendiente',
        authSegment: 'kyc',
      }),
    ).toBeNull();
  });

  it('sends a fully onboarded, KYC-verified user away from any auth screen', () => {
    expect(
      computeRedirect({
        hasSession: true,
        profileStatus: 'complete',
        kycEstado: 'verificado',
        authSegment: 'sign-in',
      }),
    ).toBe('/');
  });

  it('does not redirect a fully onboarded, KYC-verified user already outside the auth group', () => {
    expect(
      computeRedirect({
        hasSession: true,
        profileStatus: 'complete',
        kycEstado: 'verificado',
        authSegment: null,
      }),
    ).toBeNull();
  });
});

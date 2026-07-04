export type AuthSegment = 'sign-in' | 'verify-otp' | 'select-role' | 'profile-setup' | null;

export type ProfileStatus = 'none' | 'incomplete' | 'complete';

export type RouteGuardInput = {
  hasSession: boolean;
  /** 'none' = no profiles row yet, 'incomplete' = row exists but Fase 1.3 form pending. */
  profileStatus: ProfileStatus;
  /** Current screen name inside the (auth) group, or null if outside it. */
  authSegment: AuthSegment;
};

/**
 * Pure routing decision for app/_layout.tsx: given auth/profile state and the
 * current screen, returns the path to redirect to, or null to stay put.
 */
export function computeRedirect({
  hasSession,
  profileStatus,
  authSegment,
}: RouteGuardInput): string | null {
  if (!hasSession) {
    const allowedWhileSigningIn: AuthSegment[] = ['sign-in', 'verify-otp'];
    return allowedWhileSigningIn.includes(authSegment) ? null : '/(auth)/sign-in';
  }

  if (profileStatus === 'none') {
    return authSegment === 'select-role' ? null : '/(auth)/select-role';
  }

  if (profileStatus === 'incomplete') {
    return authSegment === 'profile-setup' ? null : '/(auth)/profile-setup';
  }

  return authSegment !== null ? '/' : null;
}

export type AuthSegment = 'sign-in' | 'verify-otp' | 'select-role' | null;

export type RouteGuardInput = {
  hasSession: boolean;
  hasProfile: boolean;
  /** Current screen name inside the (auth) group, or null if outside it. */
  authSegment: AuthSegment;
};

/**
 * Pure routing decision for app/_layout.tsx: given auth/profile state and the
 * current screen, returns the path to redirect to, or null to stay put.
 */
export function computeRedirect({
  hasSession,
  hasProfile,
  authSegment,
}: RouteGuardInput): string | null {
  if (!hasSession) {
    const allowedWhileSigningIn: AuthSegment[] = ['sign-in', 'verify-otp'];
    return allowedWhileSigningIn.includes(authSegment) ? null : '/(auth)/sign-in';
  }

  if (!hasProfile) {
    return authSegment === 'select-role' ? null : '/(auth)/select-role';
  }

  return authSegment !== null ? '/' : null;
}

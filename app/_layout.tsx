import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import type { Session } from '@supabase/supabase-js';
import { useAuthSession } from '@/hooks/useAuthSession';
import { getOwnProfile } from '@/lib/profile';
import { computeRedirect, type AuthSegment } from '@/lib/route-guard';

const AUTH_SEGMENTS: AuthSegment[] = ['sign-in', 'verify-otp', 'select-role'];

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, loading: sessionLoading } = useAuthSession();

  const [hasProfile, setHasProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  // Reset profile state synchronously during render when the session identity
  // changes, instead of setState-in-effect (see React docs: "Resetting state
  // when a prop changes").
  const [trackedSession, setTrackedSession] = useState<Session | null>(session);
  if (trackedSession !== session) {
    setTrackedSession(session);
    setHasProfile(false);
    setProfileLoading(Boolean(session));
  }

  useEffect(() => {
    if (!session) return;
    let mounted = true;
    getOwnProfile().then((profile) => {
      if (!mounted) return;
      setHasProfile(profile !== null);
      setProfileLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [session]);

  const currentSegment = segments[segments.length - 1];
  const authSegment: AuthSegment = AUTH_SEGMENTS.includes(currentSegment as AuthSegment)
    ? (currentSegment as AuthSegment)
    : null;

  useEffect(() => {
    if (sessionLoading || profileLoading) return;
    const redirect = computeRedirect({ hasSession: Boolean(session), hasProfile, authSegment });
    if (redirect) {
      router.replace(redirect as never);
    }
  }, [sessionLoading, profileLoading, session, hasProfile, authSegment, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

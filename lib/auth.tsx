import type { Session } from '@biltme/backend';
import { createContext, type ReactNode, use, useEffect, useMemo, useState } from 'react';

import { backendErrorMessage, bilt } from '@/lib/backend';

interface AuthValue {
  session: Session | null;
  userId: string | null;
  isLoading: boolean;
  /** Sends a 6-digit code. Sign-up may create an account; login never does. */
  requestCode: (email: string, shouldCreateUser: boolean) => Promise<void>;
  confirmCode: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void bilt.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setIsLoading(false);
    });

    const { data } = bilt.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      userId: session?.user.id ?? null,
      isLoading,
      requestCode: async (email: string, shouldCreateUser: boolean) => {
        const { error } = await bilt.auth.signInWithOtp({
          email: email.trim().toLowerCase(),
          options: { shouldCreateUser },
        });
        if (error) throw new Error(backendErrorMessage(error, 'Could not send the code.'));
      },
      confirmCode: async (email: string, code: string) => {
        const { error } = await bilt.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: code.trim(),
          type: 'email',
        });
        if (error) {
          throw new Error(backendErrorMessage(error, 'That code did not work. Ask for a new one.'));
        }
      },
      signOut: async () => {
        await bilt.auth.signOut();
      },
    }),
    [session, isLoading],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthValue {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}

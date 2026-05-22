"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { runInitialCloudPull } from "@/lib/cloud-sync";
import { useStoresHydrated } from "@/lib/use-stores-hydrated";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);
  const storesHydrated = useStoresHydrated();

  const signOut = useCallback(async () => {
    if (!configured) return;
    const supabase = createClient();
    await supabase.auth.signOut();
  }, [configured]);

  useEffect(() => {
    if (!configured) return;

    const supabase = createClient();
    let cancelled = false;

    const init = async () => {
      const {
        data: { session: initial },
      } = await supabase.auth.getSession();
      if (!cancelled) {
        setSession(initial);
        setLoading(false);
      }
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configured]);

  useEffect(() => {
    if (!configured || !session?.user || !storesHydrated) return;
    void runInitialCloudPull();
  }, [configured, session?.user, storesHydrated]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      configured,
      signOut,
    }),
    [session, loading, configured, signOut],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

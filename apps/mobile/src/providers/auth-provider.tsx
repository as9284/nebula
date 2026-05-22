import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { runInitialCloudPull } from "@/lib/cloud-sync";

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
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);

  const signOut = useCallback(async () => {
    if (!configured) return;
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
  }, [configured]);

  useEffect(() => {
    if (!configured) return;

    const supabase = createSupabaseClient();
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
    if (!configured || !session?.user) return;
    void runInitialCloudPull();
  }, [configured, session?.user]);

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

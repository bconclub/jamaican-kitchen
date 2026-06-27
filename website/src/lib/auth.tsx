import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Customer-facing auth for the storefront. Email + password is the primary path
// (no email delivery needed). Magic link stays as an optional fallback.
// On sign-in, a DB trigger links/creates the matching customer + wallet.
interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (
    email: string,
    password: string,
    meta?: { name?: string; phone?: string },
  ) => Promise<{ error: string | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    loading,
    signInWithEmail: async (email: string) => {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/account` },
      });
      return { error: error?.message ?? null };
    },
    signUpWithPassword: async (email, password, meta) => {
      const clean = email.trim();
      const { data, error } = await supabase.auth.signUp({
        email: clean,
        password,
        options: {
          data: { name: meta?.name?.trim() || undefined, phone: meta?.phone?.trim() || undefined },
          emailRedirectTo: `${window.location.origin}/account`,
        },
      });
      if (error) {
        // Existing account: fall back to a normal password sign-in.
        if (/already registered|already exists/i.test(error.message)) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email: clean, password });
          return { error: signInErr?.message ?? null };
        }
        return { error: error.message };
      }
      // If email confirmation is off, signUp returns a session immediately. If it
      // didn't (confirmation on), try an immediate password sign-in so the user
      // lands in their wallet without waiting on an email.
      if (!data.session) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email: clean, password });
        if (signInErr) {
          return {
            error: /not confirmed/i.test(signInErr.message)
              ? "Account created. Please confirm your email, then sign in."
              : signInErr.message,
          };
        }
      }
      return { error: null };
    },
    signInWithPassword: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return { error: error?.message ?? null };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

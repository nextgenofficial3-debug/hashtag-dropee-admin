import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

const SUPER_ADMIN_EMAIL = "hashtagdropee@gmail.com";

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  const checkAdminRole = async (userId: string, email: string) => {
    if (email === SUPER_ADMIN_EMAIL) {
      setIsAdmin(true);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      
      if (error) console.error("Error checking Admin role:", error);
      setIsAdmin(!!data);
    } catch (err) {
      console.error("Exception in checkAdminRole Admin:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Safety timeout — 6 s max, clears as soon as INITIAL_SESSION fires
    const authTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.error("Auth initialization timeout in Admin portal");
        setAuthError("Session synchronization timed out. Please refresh.");
        setLoading(false);
      }
    }, 6000);

    // ─── SINGLE SOURCE OF TRUTH ──────────────────────────────────────────────
    // onAuthStateChange fires INITIAL_SESSION on page load, which fully
    // replaces the old getSession() + onAuthStateChange dual-trigger pattern
    // that caused race conditions and infinite loading states.
    // ─────────────────────────────────────────────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        console.log("Admin auth event:", event);
        clearTimeout(authTimeout);

        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await checkAdminRole(currentUser.id, currentUser.email ?? "");
        } else {
          setIsAdmin(false);
        }

        if (isMounted) setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google sign-in error Admin:", err);
      setAuthError(err.message || "Failed to start Google sign-in");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setSession(null);
    setUser(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{ user, session, isAdmin, isSuperAdmin, loading, authError, signInWithGoogle, signOut }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

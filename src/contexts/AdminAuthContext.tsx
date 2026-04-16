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
      
      if (error) {
        console.error("Error checking Admin role:", error);
      }
      setIsAdmin(!!data);
    } catch (err) {
      console.error("Exception in checkAdminRole Admin:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let authTimeout: NodeJS.Timeout;

    const handleAuthChange = async (currentSession: Session | null) => {
      try {
        console.log("Auth state change detected in Admin:", !!currentSession);
        
        if (authTimeout) clearTimeout(authTimeout);
        if (!isMounted) return;

        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          console.log("Checking admin role for:", currentUser.email);
          await checkAdminRole(currentUser.id, currentUser.email ?? "");
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in handleAuthChange Admin:", error);
        if (isMounted) {
          setAuthError("Failed to initialize admin session. Please try again.");
          setLoading(false);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Safety timeout
    authTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.error("Auth initialization timeout in Admin portal");
        setAuthError("Session synchronization timed out.");
        setLoading(false);
      }
    }, 8000);

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) handleAuthChange(session);
    }).catch(err => {
      console.error("Initial session fetch error Admin:", err);
      if (isMounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (isMounted) await handleAuthChange(session);
      }
    );

    return () => {
      isMounted = false;
      if (authTimeout) clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
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

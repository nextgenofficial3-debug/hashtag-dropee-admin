import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Handles the redirect from Supabase Google OAuth.
 * Supabase exchanges the code in the URL for a session automatically.
 * We just wait for getSession() to resolve and then redirect.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/overview", { replace: true });
      } else {
        navigate("/auth/login", { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Verifying your account…</p>
    </div>
  );
}

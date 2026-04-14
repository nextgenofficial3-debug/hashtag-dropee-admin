import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const AuthCallbackPage = lazy(() => import("@/pages/auth/AuthCallbackPage"));
const AdminLayout = lazy(() => import("@/components/layout/AdminLayout"));
const OverviewPage = lazy(() => import("@/pages/overview/OverviewPage"));
const OrdersPage = lazy(() => import("@/pages/orders/OrdersPage"));
const AgentsPage = lazy(() => import("@/pages/agents/AgentsPage"));
const DataPage = lazy(() => import("@/pages/data/DataPage"));
const AppsPage = lazy(() => import("@/pages/apps/AppsPage"));
const AdminsPage = lazy(() => import("@/pages/admins/AdminsPage"));

const queryClient = new QueryClient();

const Spinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAdminAuth();

  if (loading) return <Spinner />;

  if (!user) return <Navigate to="/auth/login" replace />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center glass rounded-2xl border border-border p-8 max-w-sm mx-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/15 flex items-center justify-center mx-auto mb-3">
            <span className="text-destructive text-2xl">🚫</span>
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            Your Google account <strong className="text-foreground">{user.email}</strong> does not have admin privileges.
            Only authorized administrators may proceed.
          </p>
          <button
            onClick={async () => {
              const { supabase } = await import("@/integrations/supabase/client");
              await supabase.auth.signOut();
              window.location.href = "/auth/login";
            }}
            className="mt-4 w-full h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Sign Out & Try Again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAdminAuth();
  if (loading) return <Spinner />;
  if (user && isAdmin) return <Navigate to="/overview" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AdminAuthProvider>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route
              path="/auth/login"
              element={<PublicRoute><LoginPage /></PublicRoute>}
            />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route
              element={<AdminGuard><AdminLayout /></AdminGuard>}
            >
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/admins" element={<AdminsPage />} />
              <Route path="/data" element={<DataPage />} />
              <Route path="/apps" element={<AppsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </Suspense>
      </AdminAuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

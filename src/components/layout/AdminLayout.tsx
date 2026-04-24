import { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { cn } from "@/lib/utils";
import { useFCM } from "@/hooks/useFCM";
import { Bell } from "lucide-react";

function FCMPromptBanner() {
  const { permission, requestPermission } = useFCM();
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem("fcm-banner-dismissed") === "1"
  );

  if (permission === "granted" || permission === "denied" || dismissed) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl glass border border-primary/30 shadow-lg shadow-primary/10 animate-in slide-in-from-bottom-4">
      <Bell className="w-4 h-4 text-primary shrink-0" />
      <p className="text-sm text-foreground">Enable push notifications for new order alerts</p>
      <button
        onClick={requestPermission}
        className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
      >
        Enable
      </button>
      <button
        onClick={() => { setDismissed(true); localStorage.setItem("fcm-banner-dismissed", "1"); }}
        className="text-muted-foreground hover:text-foreground text-xs transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // On desktop, start uncollapsed; on mobile (<768px), start collapsed
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 768) setCollapsed(true);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleToggle = useCallback(() => {
    if (window.innerWidth < 768) {
      setMobileOpen(v => !v);
    } else {
      setCollapsed(v => !v);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <TopBar
        onToggleSidebar={handleToggle}
        sidebarCollapsed={collapsed}
      />
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          // On mobile: no left padding (sidebar is overlay)
          "pl-0 md:pl-16",
          // On desktop: respect collapsed state
          !collapsed && "md:pl-64"
        )}
      >
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
      <FCMPromptBanner />
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, Bell, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/overview": { title: "System Overview", subtitle: "Cross-platform metrics and real-time health" },
  "/orders": { title: "Order Monitor", subtitle: "All orders across MFC and Delivery" },
  "/agents": { title: "Agent Management", subtitle: "Delivery agents and availability control" },
  "/admins": { title: "Admin Roster", subtitle: "Manage admin accounts and permissions" },
  "/data": { title: "Data Control", subtitle: "Products, partners, and user roles" },
  "/apps": { title: "App Registry", subtitle: "Platform applications under this system" },
};

interface TopBarProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  onRefresh?: () => void;
}

export default function TopBar({ onToggleSidebar, sidebarCollapsed, onRefresh }: TopBarProps) {
  const location = useLocation();
  const [refreshing, setRefreshing] = useState(false);
  const page = pageTitles[location.pathname] ?? { title: "Admin", subtitle: "Platform Control Center" };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-16 glass-strong border-b border-border z-40 flex items-center px-6 gap-4 transition-all duration-300",
        sidebarCollapsed ? "left-16" : "left-64"
      )}
    >
      {/* Sidebar Toggle */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page Title */}
      <div className="flex-1">
        <h1 className="text-base font-semibold text-foreground">{page.title}</h1>
        <p className="text-xs text-muted-foreground">{page.subtitle}</p>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-border text-xs text-muted-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Live
      </div>

      {/* Refresh */}
      {onRefresh && (
        <button
          onClick={handleRefresh}
          className={cn(
            "p-2 rounded-lg hover:bg-secondary transition-all text-muted-foreground hover:text-foreground",
            refreshing && "animate-spin"
          )}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      )}

      {/* Notification placeholder */}
      <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground relative">
        <Bell className="w-5 h-5" />
      </button>
    </header>
  );
}

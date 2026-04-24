import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import {
  LayoutDashboard,
  Package,
  Users,
  Database,
  AppWindow,
  LogOut,
  Shield,
  ChevronRight,
  UserCog,
  Bell,
  UserRound,
  CalendarDays,
  Truck,
  BarChart2,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  {
    to: "/overview",
    icon: LayoutDashboard,
    label: "Overview",
    description: "System metrics & health",
  },
  {
    to: "/orders",
    icon: Package,
    label: "Orders",
    description: "Cross-app order monitoring",
  },
  {
    to: "/agents",
    icon: Users,
    label: "Agents",
    description: "Delivery agent management",
  },
  {
    to: "/customers",
    icon: UserRound,
    label: "Customers",
    description: "Customer accounts & history",
  },
  {
    to: "/bookings",
    icon: CalendarDays,
    label: "Bookings",
    description: "Service booking management",
  },
  {
    to: "/pick-and-drop",
    icon: Truck,
    label: "Pick & Drop",
    description: "P&D order management",
  },
  {
    to: "/admins",
    icon: UserCog,
    label: "Admins",
    description: "Admin roster & permissions",
  },
  {
    to: "/data",
    icon: Database,
    label: "Data Control",
    description: "Products, partners, roles",
  },
  {
    to: "/apps",
    icon: AppWindow,
    label: "App Registry",
    description: "Platform applications",
  },
  {
    to: "/notifications",
    icon: Bell,
    label: "Notifications",
    description: "Broadcast FCM push alerts",
  },
  {
    to: "/analytics",
    icon: BarChart2,
    label: "Analytics",
    description: "Revenue & performance charts",
  },
  {
    to: "/settings",
    icon: Settings,
    label: "Settings",
    description: "Pricing, areas, admin users",
  },
];

interface SidebarProps {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ collapsed = false, mobileOpen = false, onMobileClose }: SidebarProps) {
  const { user, isSuperAdmin, signOut } = useAdminAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/login");
  };

  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.email || "Admin";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen glass-strong border-r border-border z-50 flex flex-col transition-all duration-300",
        // Desktop: collapse/expand
        collapsed ? "w-16" : "w-64",
        // Mobile: hide by default, show when mobileOpen
        "translate-x-0 md:translate-x-0",
        !mobileOpen && "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-hidden"
          >
            <p className="text-sm font-bold text-foreground leading-tight">
              Dropee<span className="text-primary">Admin</span>
            </p>
            <p className="text-[10px] text-muted-foreground">Control Center</p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, description }) => (
          <NavLink key={to} to={to}>
            {({ isActive }) => (
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer",
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "")} />
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", isActive ? "text-primary" : "")}>{label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{description}</p>
                  </div>
                )}
                {!collapsed && isActive && (
                  <ChevronRight className="w-3 h-3 text-primary shrink-0" />
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-2 py-4 border-t border-border space-y-2">
        {!collapsed && user && (
          <div className="px-3 py-2 rounded-xl bg-secondary/50 flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-primary text-xs font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{displayName}</p>
              <p className={cn("text-[10px] font-semibold mt-0.5", isSuperAdmin ? "text-amber-400" : "text-primary")}>
                {isSuperAdmin ? "⭐ Super Admin" : "Admin"}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

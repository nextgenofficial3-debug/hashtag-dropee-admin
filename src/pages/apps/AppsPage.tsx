import { motion } from "framer-motion";
import { AppWindow, Truck, ShoppingBag, Shield, Plus, ExternalLink, CheckCircle2, Database } from "lucide-react";

interface AppEntry {
  id: string;
  name: string;
  description: string;
  status: "live" | "development" | "planned";
  type: "delivery" | "ecommerce" | "admin" | "future";
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  tables: string[];
  features: string[];
  url?: string;
}

const PLATFORM_APPS: AppEntry[] = [
  {
    id: "agent",
    name: "DeliverPro (Agent)",
    description: "Delivery agent mobile progressive web app. Manages agents, order assignments, tracking, and earnings.",
    status: "live",
    type: "delivery",
    icon: Truck,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    tables: ["delivery_agents", "delivery_orders", "agent_availability", "agent_order_responses", "delivery_tracking", "customers", "vendors"],
    features: ["Agent onboarding", "Order management", "Real-time tracking", "Earnings dashboard", "Vendor/customer db"],
  },
  {
    id: "mfc",
    name: "MFC Animation Studio",
    description: "Customer-facing e-commerce shop for MFC products with cart, checkout, promotions and order confirmation.",
    status: "live",
    type: "ecommerce",
    icon: ShoppingBag,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10",
    tables: ["orders", "products", "partner_api_keys"],
    features: ["Product catalog", "Cart & checkout", "Order tracking", "Promotions & coupons", "Admin panel", "Customer notifications"],
  },
  {
    id: "admin",
    name: "Dropee Admin Center",
    description: "Platform-wide supervisory control layer. Monitors and manages all apps connected to the shared Supabase backend.",
    status: "live",
    type: "admin",
    icon: Shield,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    tables: ["ALL tables (read/write)", "user_roles", "partner_api_keys"],
    features: ["System overview", "Cross-app order monitoring", "Agent management", "Data control", "App registry"],
  },
  {
    id: "future-1",
    name: "Customer App",
    description: "Planned: A customer-facing web app for placing delivery orders and tracking in real time.",
    status: "planned",
    type: "future",
    icon: AppWindow,
    iconColor: "text-muted-foreground",
    iconBg: "bg-secondary",
    tables: ["delivery_orders", "customers", "notifications"],
    features: ["Order placement", "Live tracking", "Notifications", "History"],
  },
  {
    id: "future-2",
    name: "Vendor Portal",
    description: "Planned: A web portal for vendors to manage their listings and view orders placed through the platform.",
    status: "planned",
    type: "future",
    icon: Database,
    iconColor: "text-muted-foreground",
    iconBg: "bg-secondary",
    tables: ["vendors", "delivery_orders", "customers"],
    features: ["Vendor dashboard", "Order visibility", "Product management"],
  },
];

const statusConfig = {
  live: { label: "Live", color: "bg-emerald-500/15 text-emerald-400" },
  development: { label: "In Dev", color: "bg-amber-500/15 text-amber-400" },
  planned: { label: "Planned", color: "bg-muted text-muted-foreground" },
};

export default function AppsPage() {
  const live = PLATFORM_APPS.filter((a) => a.status === "live");
  const upcoming = PLATFORM_APPS.filter((a) => a.status !== "live");

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Platform Header */}
      <div className="glass rounded-2xl border border-border p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">Hashtag Dropee Platform</h2>
            <p className="text-sm text-muted-foreground mt-1">
              A unified multi-application ecosystem powered by a single shared Supabase backend.
              New applications can join by connecting to the same backend URL and following the established schema.
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5" />mpqaictrrrncwqrkpdos.supabase.co</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />{live.length} apps live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Apps */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Active Applications
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {live.map((app, i) => (
            <AppCard key={app.id} app={app} delay={i * 0.08} />
          ))}
        </div>
      </div>

      {/* Upcoming / Future Apps */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Future Applications (Expansion Slots)
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {upcoming.map((app, i) => (
            <AppCard key={app.id} app={app} delay={i * 0.08} />
          ))}
        </div>
      </div>

      {/* Integration Guide */}
      <div className="glass rounded-2xl border border-border p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          Adding a New App to This Platform
        </h3>
        <div className="space-y-3">
          {[
            { step: "1", text: "Connect to Supabase: https://mpqaictrrrncwqrkpdos.supabase.co" },
            { step: "2", text: "Use the existing auth system — user_roles table controls access" },
            { step: "3", text: "Use existing tables where possible (customers, delivery_orders, notifications)" },
            { step: "4", text: "Add new tables only for domain-specific data, prefixed with your app name" },
            { step: "5", text: "This Admin panel will automatically reflect new data" },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">{step}</span>
              <p className="text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function AppCard({ app, delay }: { app: AppEntry; delay: number }) {
  const Icon = app.icon;
  const status = statusConfig[app.status];
  const isLive = app.status === "live";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`glass rounded-2xl border p-5 space-y-4 ${isLive ? "border-border hover:border-border/50" : "border-border/30 opacity-70"} transition-all`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${app.iconBg}`}>
            <Icon className={`w-5 h-5 ${app.iconColor}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{app.name}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed">{app.description}</p>

      {/* Tables */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">DB Tables</p>
        <div className="flex flex-wrap gap-1">
          {app.tables.slice(0, 4).map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono">{t}</span>
          ))}
          {app.tables.length > 4 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">+{app.tables.length - 4} more</span>
          )}
        </div>
      </div>

      {/* Features */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Features</p>
        <div className="space-y-1">
          {app.features.map((f) => (
            <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className={`w-3 h-3 shrink-0 ${isLive ? "text-emerald-400" : "text-muted-foreground/50"}`} />
              {f}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

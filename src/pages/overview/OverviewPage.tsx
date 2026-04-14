import { motion } from "framer-motion";
import { useSystemStats } from "@/hooks/useSystemStats";
import { useAllOrders } from "@/hooks/useAllOrders";
import { useAllAgents } from "@/hooks/useAllAgents";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import {
  Package, Users, DollarSign, TrendingUp, Truck, ShoppingBag,
  Activity, Clock, CheckCircle2, XCircle, AlertCircle, Store, UserCheck
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function OverviewPage() {
  const { stats, loading } = useSystemStats();
  const { allOrders } = useAllOrders();
  const { agents } = useAllAgents();

  const recentActivity = allOrders.slice(0, 8);

  // Build a simple 7-day chart from orders
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("en-GH", { weekday: "short" });
    const dayOrders = allOrders.filter((o) => {
      const od = new Date(o.created_at);
      return od.toDateString() === d.toDateString();
    });
    const revenue = dayOrders.reduce((sum, o) => {
      if ("total_fee" in o) return sum + (o.total_fee || 0);
      if ("total" in o) return sum + (Number(o.total) || 0);
      return sum;
    }, 0);
    return { day: label, orders: dayOrders.length, revenue };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Platform Health Banner */}
      <motion.div variants={item} className="glass rounded-2xl p-4 border border-border flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <Activity className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Platform Operational</p>
          <p className="text-xs text-muted-foreground">All systems connected to Supabase backend • Real-time monitoring active</p>
        </div>
        <div className="flex items-center gap-2">
          <AppBadge label="MFC" />
          <AppBadge label="Agent" />
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="Total Deliveries"
          value={stats.totalDeliveries}
          sub={`${stats.activeDeliveries} active`}
          color="primary"
        />
        <StatCard
          icon={ShoppingBag}
          label="MFC Orders"
          value={stats.totalMfcOrders}
          sub={`${stats.pendingMfcOrders} pending`}
          color="violet"
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          sub="All apps combined"
          color="emerald"
        />
        <StatCard
          icon={UserCheck}
          label="Active Agents"
          value={stats.onlineAgents}
          sub={`${stats.totalAgents} total registered`}
          color="sky"
        />
      </motion.div>

      {/* Secondary Stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Pending Orders" value={stats.pendingDeliveries} icon={Clock} color="amber" />
        <MiniStat label="Delivered" value={stats.completedDeliveries} icon={CheckCircle2} color="emerald" />
        <MiniStat label="Cancelled" value={stats.cancelledDeliveries} icon={XCircle} color="rose" />
        <MiniStat label="Delivery Revenue" value={formatCurrency(stats.deliveryRevenue)} icon={Truck} color="sky" />
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={item} className="grid md:grid-cols-2 gap-4">
        {/* Orders Chart */}
        <div className="glass rounded-2xl p-5 border border-border">
          <p className="text-sm font-semibold text-foreground mb-1">Order Activity (7 days)</p>
          <p className="text-xs text-muted-foreground mb-4">Combined orders across all apps</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={last7Days}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(262,83%,64%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(262,83%,64%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: "hsl(215,20%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215,20%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(222,47%,9%)", border: "1px solid hsl(217,32%,16%)", borderRadius: "12px" }}
                labelStyle={{ color: "hsl(210,40%,96%)" }}
              />
              <Area type="monotone" dataKey="orders" stroke="hsl(262,83%,64%)" fill="url(#colorOrders)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Agent Status */}
        <div className="glass rounded-2xl p-5 border border-border">
          <p className="text-sm font-semibold text-foreground mb-1">Agent Status Breakdown</p>
          <p className="text-xs text-muted-foreground mb-4">{stats.totalAgents} registered delivery agents</p>
          <div className="space-y-4">
            <AgentStatusBar label="Online" count={stats.onlineAgents} total={stats.totalAgents} color="bg-emerald-500" />
            <AgentStatusBar label="Busy" count={stats.busyAgents} total={stats.totalAgents} color="bg-amber-500" />
            <AgentStatusBar label="Offline" count={stats.offlineAgents} total={stats.totalAgents} color="bg-muted" />
            <AgentStatusBar
              label="No Status"
              count={Math.max(0, stats.totalAgents - stats.onlineAgents - stats.busyAgents - stats.offlineAgents)}
              total={stats.totalAgents}
              color="bg-border"
            />
          </div>
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-400">{stats.totalCustomers}</p>
              <p className="text-[10px] text-muted-foreground">Customers</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{stats.totalVendors}</p>
              <p className="text-[10px] text-muted-foreground">Vendors</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-sky-400">{formatCurrency(stats.mfcRevenue)}</p>
              <p className="text-[10px] text-muted-foreground">MFC Revenue</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity Feed */}
      <motion.div variants={item} className="glass rounded-2xl border border-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-sm font-semibold text-foreground">Live Activity Feed</p>
            <p className="text-xs text-muted-foreground">Most recent cross-platform events</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Real-time
          </div>
        </div>
        <div className="divide-y divide-border">
          {recentActivity.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">No recent activity</div>
          )}
          {recentActivity.map((order) => {
            const isDelivery = "order_code" in order;
            return (
              <div key={order.id} className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/30 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDelivery ? "bg-primary/10" : "bg-violet-500/10"}`}>
                  {isDelivery ? (
                    <Truck className="w-4 h-4 text-primary" />
                  ) : (
                    <Store className="w-4 h-4 text-violet-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {isDelivery ? order.customer_name : (order.customer_name || "MFC Customer")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isDelivery ? `Delivery • ${order.order_code}` : "MFC Order"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={order.status} />
                  <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(order.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    violet: "bg-violet-500/10 text-violet-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    sky: "bg-sky-500/10 text-sky-400",
    amber: "bg-amber-500/10 text-amber-400",
  };
  return (
    <div className="glass rounded-2xl p-5 border border-border hover:border-border/50 transition-all">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, color }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    amber: "text-amber-400",
    emerald: "text-emerald-400",
    rose: "text-rose-400",
    sky: "text-sky-400",
  };
  return (
    <div className="glass rounded-xl p-4 border border-border flex items-center gap-3">
      <Icon className={`w-5 h-5 shrink-0 ${colorMap[color]}`} />
      <div>
        <p className="text-lg font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function AgentStatusBar({ label, count, total, color }: {
  label: string; count: number; total: number; color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{count}</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending_assignment: "badge-pending",
    accepted: "badge-active",
    picked_up: "badge-active",
    in_transit: "badge-active",
    delivered: "badge-delivered",
    cancelled: "badge-cancelled",
    pending: "badge-pending",
    processing: "badge-active",
    completed: "badge-delivered",
  };
  return (
    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[status] || "badge-pending"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function AppBadge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass border border-border text-xs">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

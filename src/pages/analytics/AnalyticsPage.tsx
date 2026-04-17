import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, Package, Users, DollarSign, Clock } from "lucide-react";

const COLORS = ["hsl(262,83%,64%)", "hsl(162,100%,45%)", "hsl(43,100%,49%)", "hsl(0,84%,60%)"];

interface DayStats { day: string; orders: number; revenue: number; }
interface HourStats { hour: string; orders: number; }
interface StatusStats { name: string; value: number; }

export default function AnalyticsPage() {
  const [last7Days, setLast7Days] = useState<DayStats[]>([]);
  const [hourlyData, setHourlyData] = useState<HourStats[]>([]);
  const [statusDist, setStatusDist] = useState<StatusStats[]>([]);
  const [totals, setTotals] = useState({ revenue: 0, orders: 0, agents: 0, avgDelivery: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [ordersRes, agentsRes] = await Promise.all([
          supabase.from("delivery_orders").select("created_at, status, total_fee"),
          supabase.from("delivery_agents").select("id, total_deliveries, total_earnings"),
        ]);

        const orders = ordersRes.data || [];
        const agents = agentsRes.data || [];

        // 7-day activity
        const days: DayStats[] = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const label = d.toLocaleDateString("en-IN", { weekday: "short" });
          const dayOrders = orders.filter((o) => {
            const od = new Date(o.created_at);
            return od.toDateString() === d.toDateString();
          });
          const revenue = dayOrders.reduce((s, o) => s + (o.total_fee || 0), 0);
          return { day: label, orders: dayOrders.length, revenue };
        });
        setLast7Days(days);

        // Hourly distribution
        const hourBuckets: Record<number, number> = {};
        orders.forEach((o) => {
          const h = new Date(o.created_at).getHours();
          hourBuckets[h] = (hourBuckets[h] || 0) + 1;
        });
        const hourly: HourStats[] = Array.from({ length: 24 }, (_, h) => ({
          hour: `${h}:00`,
          orders: hourBuckets[h] || 0,
        }));
        setHourlyData(hourly);

        // Status distribution
        const statusMap: Record<string, number> = {};
        orders.forEach((o) => {
          statusMap[o.status] = (statusMap[o.status] || 0) + 1;
        });
        setStatusDist(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

        // Totals
        const totalRevenue = orders.reduce((s, o) => s + (o.total_fee || 0), 0);
        const agentRevenue = agents.reduce((s, a) => s + (a.total_earnings || 0), 0);
        setTotals({
          revenue: totalRevenue || agentRevenue,
          orders: orders.length,
          agents: agents.length,
          avgDelivery: agents.length > 0
            ? Math.round(agents.reduce((s, a) => s + (a.total_deliveries || 0), 0) / agents.length)
            : 0,
        });
      } catch (err) {
        console.error("Analytics error:", err);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tooltipStyle = {
    contentStyle: { background: "hsl(222,47%,9%)", border: "1px solid hsl(217,32%,16%)", borderRadius: "12px" },
    labelStyle: { color: "hsl(210,40%,96%)" },
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatCurrency(totals.revenue), icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Total Orders", value: totals.orders, icon: Package, color: "text-primary", bg: "bg-primary/10" },
          { label: "Active Agents", value: totals.agents, icon: Users, color: "text-sky-400", bg: "bg-sky-500/10" },
          { label: "Avg Deliveries / Agent", value: totals.avgDelivery, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass rounded-2xl border border-border p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* 7-Day Revenue + Orders */}
      <div className="glass rounded-2xl border border-border p-5">
        <div className="mb-4">
          <p className="text-sm font-semibold text-foreground">7-Day Order Activity</p>
          <p className="text-xs text-muted-foreground">Orders and revenue over the last week</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={last7Days}>
            <defs>
              <linearGradient id="gOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(262,83%,64%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(262,83%,64%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(162,100%,45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(162,100%,45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" tick={{ fill: "hsl(215,20%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(215,20%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="orders" stroke="hsl(262,83%,64%)" fill="url(#gOrders)" strokeWidth={2} name="Orders" />
            <Area type="monotone" dataKey="revenue" stroke="hsl(162,100%,45%)" fill="url(#gRevenue)" strokeWidth={2} name="Revenue (₹)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Peak Hours */}
        <div className="glass rounded-2xl border border-border p-5">
          <p className="text-sm font-semibold text-foreground mb-1">Peak Order Hours</p>
          <p className="text-xs text-muted-foreground mb-4">Order volume by hour of day</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourlyData} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="hour"
                tick={{ fill: "hsl(215,20%,55%)", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                interval={3}
              />
              <YAxis tick={{ fill: "hsl(215,20%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="orders" fill="hsl(262,83%,64%)" radius={[4, 4, 0, 0]} name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="glass rounded-2xl border border-border p-5">
          <p className="text-sm font-semibold text-foreground mb-1">Order Status Distribution</p>
          <p className="text-xs text-muted-foreground mb-4">All-time breakdown by status</p>
          {statusDist.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={statusDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusDist.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "hsl(215,20%,55%)", fontSize: 11 }}>
                      {String(value).replace(/_/g, " ")}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Delivery performance note */}
      <div className="glass rounded-2xl border border-border p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Analytics powered by live Supabase data</p>
          <p className="text-xs text-muted-foreground">
            Charts reflect real-time order data from the Agent and MFC apps. Data refreshes on page load.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

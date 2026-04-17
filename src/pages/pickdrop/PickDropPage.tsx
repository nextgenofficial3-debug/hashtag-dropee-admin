import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { formatRelativeTime, formatCurrency } from "@/lib/utils";
import { Search, RefreshCw, Package, MapPin, Truck, CheckCircle2, XCircle, Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

interface PickDropOrder {
  id: string;
  customer_id: string | null;
  agent_id: string | null;
  type: string;
  status: string;
  pickup_address: string | null;
  drop_address: string | null;
  total_amount: number | null;
  notes: string | null;
  created_at: string;
  customer_name?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "badge-pending",
  pending_assignment: "badge-pending",
  accepted: "badge-active",
  picked_up: "badge-active",
  in_transit: "badge-active",
  delivered: "badge-delivered",
  cancelled: "badge-cancelled",
};

export default function PickDropPage() {
  const [orders, setOrders] = useState<PickDropOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Use `as any` until new tables are in generated Supabase types
      const { data, error } = await (supabase as any)
        .from("delivery_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("Error fetching pick&drop orders:", error);
        setOrders([]);
      } else {
        setOrders(data || []);
      }
    } catch (err) {
      console.error("Exception fetching pick&drop:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    const { error } = await (supabase as any).from("delivery_orders").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Failed to update status", variant: "destructive" });
    } else {
      toast({ title: `Order marked as ${status.replace(/_/g, " ")}` });
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    }
    setUpdating(null);
  };

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchSearch = !search ||
      (o.pickup_address || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.drop_address || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_name || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statuses = ["all", "pending_assignment", "accepted", "picked_up", "delivered", "cancelled"];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: orders.length, icon: Package, color: "text-foreground" },
          { label: "Pending", value: orders.filter((o) => o.status === "pending_assignment").length, icon: Clock, color: "text-amber-400" },
          { label: "In Transit", value: orders.filter((o) => ["accepted","picked_up","in_transit"].includes(o.status)).length, icon: Truck, color: "text-primary" },
          { label: "Delivered", value: orders.filter((o) => o.status === "delivered").length, icon: CheckCircle2, color: "text-emerald-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-xl border border-border p-4 flex items-center gap-3">
            <Icon className={`w-5 h-5 shrink-0 ${color}`} />
            <div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl border border-border p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search address or customer..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-medium transition-all",
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "glass border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <button onClick={fetchOrders} className="p-2.5 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Orders Table */}
      <div className="glass rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <p className="text-sm font-medium text-foreground">{filtered.length} orders</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No pick & drop orders found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((order) => {
              const expanded = expandedId === order.id;
              return (
                <div key={order.id} className="hover:bg-secondary/20 transition-colors">
                  <div
                    className="flex items-center gap-4 px-5 py-3.5 cursor-pointer"
                    onClick={() => setExpandedId(expanded ? null : order.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-sky-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {order.pickup_address || "Unknown pickup"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {order.drop_address || "Unknown drop"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || "badge-pending"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                      {order.total_amount != null && (
                        <p className="text-xs text-muted-foreground mt-1">{formatCurrency(order.total_amount)}</p>
                      )}
                    </div>
                    <Eye className={`w-4 h-4 shrink-0 ${expanded ? "text-primary" : "text-muted-foreground"}`} />
                  </div>

                  {expanded && (
                    <div className="px-5 pb-4 border-t border-border/50 pt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="glass rounded-xl p-3 border border-border">
                          <p className="text-muted-foreground">Pickup</p>
                          <p className="font-medium text-foreground mt-0.5">{order.pickup_address || "—"}</p>
                        </div>
                        <div className="glass rounded-xl p-3 border border-border">
                          <p className="text-muted-foreground">Drop-off</p>
                          <p className="font-medium text-foreground mt-0.5">{order.drop_address || "—"}</p>
                        </div>
                        <div className="glass rounded-xl p-3 border border-border">
                          <p className="text-muted-foreground">Notes</p>
                          <p className="font-medium text-foreground mt-0.5">{order.notes || "—"}</p>
                        </div>
                        <div className="glass rounded-xl p-3 border border-border">
                          <p className="text-muted-foreground">Created</p>
                          <p className="font-medium text-foreground mt-0.5">{formatRelativeTime(order.created_at)}</p>
                        </div>
                      </div>
                      {/* Admin Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {order.status === "pending_assignment" && (
                          <button
                            onClick={() => updateStatus(order.id, "accepted")}
                            disabled={updating === order.id}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-primary/15 text-primary hover:bg-primary/25 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Accept
                          </button>
                        )}
                        {["accepted", "picked_up"].includes(order.status) && (
                          <button
                            onClick={() => updateStatus(order.id, "delivered")}
                            disabled={updating === order.id}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark Delivered
                          </button>
                        )}
                        {!["delivered", "cancelled"].includes(order.status) && (
                          <button
                            onClick={() => updateStatus(order.id, "cancelled")}
                            disabled={updating === order.id}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-destructive/15 text-destructive hover:bg-destructive/25 transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

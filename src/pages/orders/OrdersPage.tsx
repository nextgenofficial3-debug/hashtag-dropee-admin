import { useState } from "react";
import { motion } from "framer-motion";
import { useAllOrders, type AdminDeliveryOrder } from "@/hooks/useAllOrders";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Package, Truck, Store, Search, Filter, MapPin,
  User, Clock, CheckCircle2, XCircle, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";

const ORDER_STATUSES = [
  "all",
  "pending_assignment",
  "accepted",
  "en_route_pickup",
  "picked_up",
  "in_transit",
  "delivered",
  "cancelled",
  "pending",
  "processing",
  "completed",
];

const SOURCE_OPTIONS = ["all", "delivery", "mfc"];

export default function OrdersPage() {
  const { allOrders, deliveryOrders, mfcOrders, loading, refetch, updateDeliveryStatus } = useAllOrders();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const filtered = allOrders.filter((o) => {
    const matchSearch =
      !search ||
      (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      ("order_code" in o && o.order_code.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchSource = sourceFilter === "all" || o.source === sourceFilter;

    return matchSearch && matchStatus && matchSource;
  });

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    const { success } = await updateDeliveryStatus(orderId, newStatus);
    if (success) {
      toast({ title: "Status updated", description: `Order set to ${newStatus.replace(/_/g, " ")}` });
    } else {
      toast({ title: "Update failed", variant: "destructive" });
    }
    setUpdating(null);
  };

  const stats = {
    total: allOrders.length,
    delivery: deliveryOrders.length,
    mfc: mfcOrders.length,
    active: allOrders.filter((o) => ["accepted", "picked_up", "in_transit", "en_route_pickup", "processing"].includes(o.status)).length,
    completed: allOrders.filter((o) => ["delivered", "completed"].includes(o.status)).length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "All Orders", value: stats.total, color: "text-foreground" },
          { label: "Delivery", value: stats.delivery, color: "text-primary" },
          { label: "MFC (Shop)", value: stats.mfc, color: "text-violet-400" },
          { label: "Active", value: stats.active, color: "text-amber-400" },
          { label: "Completed", value: stats.completed, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-4 border border-border text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
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
            placeholder="Search customer, order code..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {SOURCE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Sources" : s === "mfc" ? "MFC Shop" : "Delivery"}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All Statuses" : s.replace(/_/g, " ")}</option>
          ))}
        </select>

        <button
          onClick={refetch}
          className="p-2.5 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Orders Table */}
      <div className="glass rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">{filtered.length} orders</p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-sm">No orders found</div>
            )}
            {filtered.map((order) => {
              const isDelivery = "order_code" in order;
              const expanded = expandedId === order.id;
              return (
                <div key={order.id} className="hover:bg-secondary/20 transition-colors">
                  <div
                    className="flex items-center gap-4 px-5 py-3.5 cursor-pointer"
                    onClick={() => setExpandedId(expanded ? null : order.id)}
                  >
                    {/* Source icon */}
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", isDelivery ? "bg-primary/10" : "bg-violet-500/10")}>
                      {isDelivery ? <Truck className="w-4 h-4 text-primary" /> : <Store className="w-4 h-4 text-violet-400" />}
                    </div>

                    {/* Customer */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {order.customer_name || "Unknown Customer"}
                        </p>
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", isDelivery ? "bg-primary/10 text-primary" : "bg-violet-500/10 text-violet-400")}>
                          {isDelivery ? "Delivery" : "MFC"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {isDelivery ? `#${order.order_code} • ${order.delivery_address}` : order.customer_address || "No address"}
                      </p>
                    </div>

                    {/* Status */}
                    <StatusBadge status={order.status} />

                    {/* Value */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-400">
                        {isDelivery
                          ? formatCurrency(order.total_fee || 0)
                          : formatCurrency((order as any).total || 0)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{formatRelativeTime(order.created_at)}</p>
                    </div>

                    {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </div>

                  {/* Expanded Detail */}
                  {expanded && (
                    <div className="px-5 pb-4 space-y-3 border-t border-border/50 pt-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <InfoItem label="Order ID" value={order.id.slice(0, 12) + "..."} />
                        <InfoItem label="Status" value={order.status.replace(/_/g, " ")} />
                        <InfoItem label="Created" value={formatDate(order.created_at)} />
                        {isDelivery && (
                          <>
                            <InfoItem label="Order Code" value={order.order_code} />
                            <InfoItem label="Pickup" value={order.pickup_address} />
                            <InfoItem label="Distance" value={order.distance_km ? `${order.distance_km}km` : "—"} />
                            <InfoItem label="Assigned Agent" value={(order as AdminDeliveryOrder).agent_name || "Unassigned"} />
                            <InfoItem label="Package" value={order.package_description || "—"} />
                          </>
                        )}
                      </div>

                      {/* Admin actions for delivery orders */}
                      {isDelivery && !["delivered", "cancelled"].includes(order.status) && (
                        <div className="flex gap-2 pt-2">
                          <p className="text-xs text-muted-foreground self-center mr-2">Force status:</p>
                          {["delivered", "cancelled"].map((s) => (
                            <button
                              key={s}
                              onClick={() => handleStatusUpdate(order.id, s)}
                              disabled={updating === order.id}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                s === "delivered" ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25" : "bg-destructive/15 text-destructive hover:bg-destructive/25",
                                "disabled:opacity-50"
                              )}
                            >
                              {updating === order.id ? "..." : s}
                            </button>
                          ))}
                        </div>
                      )}
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending_assignment: "bg-amber-500/15 text-amber-400",
    accepted: "bg-primary/15 text-primary",
    en_route_pickup: "bg-sky-500/15 text-sky-400",
    arrived_pickup: "bg-sky-500/15 text-sky-400",
    picked_up: "bg-primary/15 text-primary",
    in_transit: "bg-primary/15 text-primary",
    arrived_delivery: "bg-emerald-500/15 text-emerald-400",
    delivered: "bg-emerald-500/15 text-emerald-400",
    cancelled: "bg-destructive/15 text-destructive",
    pending: "bg-amber-500/15 text-amber-400",
    processing: "bg-primary/15 text-primary",
    completed: "bg-emerald-500/15 text-emerald-400",
  };
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full shrink-0", map[status] || "bg-muted text-muted-foreground")}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="text-foreground font-medium truncate">{value}</p>
    </div>
  );
}

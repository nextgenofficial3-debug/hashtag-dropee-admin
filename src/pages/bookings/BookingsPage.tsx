import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { formatRelativeTime } from "@/lib/utils";
import { Search, RefreshCw, CalendarDays, CheckCircle2, XCircle, Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

interface Booking {
  id: string;
  customer_id: string | null;
  service_type: string;
  scheduled_at: string | null;
  address: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "badge-pending",
  confirmed: "badge-active",
  completed: "badge-delivered",
  cancelled: "badge-cancelled",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings((data || []) as Booking[]);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    const { error } = await (supabase as any).from("bookings").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Failed to update status", variant: "destructive" });
    } else {
      toast({ title: `Booking ${status}` });
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    }
    setUpdating(null);
  };

  const filtered = bookings.filter((b) => {
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    const matchSearch = !search ||
      b.service_type.toLowerCase().includes(search.toLowerCase()) ||
      (b.address || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: stats.total, icon: CalendarDays, color: "text-foreground" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-400" },
          { label: "Confirmed", value: stats.confirmed, icon: CheckCircle2, color: "text-primary" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-400" },
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
            placeholder="Search service type or address..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-medium transition-all capitalize",
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "glass border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={fetchBookings}
          className="p-2.5 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Bookings Table */}
      <div className="glass rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <p className="text-sm font-medium text-foreground">{filtered.length} bookings</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No bookings found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((booking) => {
              const expanded = expandedId === booking.id;
              return (
                <div key={booking.id} className="hover:bg-secondary/20 transition-colors">
                  <div
                    className="flex items-center gap-4 px-5 py-3.5 cursor-pointer"
                    onClick={() => setExpandedId(expanded ? null : booking.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground capitalize">{booking.service_type.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleString() : "No schedule set"}
                        {booking.address ? ` • ${booking.address}` : ""}
                      </p>
                    </div>
                    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[booking.status] || "badge-pending"}`}>
                      {booking.status}
                    </span>
                    <Eye className={`w-4 h-4 shrink-0 ${expanded ? "text-primary" : "text-muted-foreground"}`} />
                  </div>

                  {expanded && (
                    <div className="px-5 pb-4 border-t border-border/50 pt-3 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div className="glass rounded-xl p-3 border border-border">
                          <p className="text-muted-foreground">Service Type</p>
                          <p className="font-medium text-foreground mt-0.5 capitalize">{booking.service_type.replace(/_/g, " ")}</p>
                        </div>
                        <div className="glass rounded-xl p-3 border border-border">
                          <p className="text-muted-foreground">Address</p>
                          <p className="font-medium text-foreground mt-0.5">{booking.address || "—"}</p>
                        </div>
                        <div className="glass rounded-xl p-3 border border-border">
                          <p className="text-muted-foreground">Notes</p>
                          <p className="font-medium text-foreground mt-0.5">{booking.notes || "—"}</p>
                        </div>
                      </div>
                      {/* Admin Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {booking.status === "pending" && (
                          <button
                            onClick={() => updateStatus(booking.id, "confirmed")}
                            disabled={updating === booking.id}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-primary/15 text-primary hover:bg-primary/25 transition-all disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {updating === booking.id ? "..." : "Confirm"}
                          </button>
                        )}
                        {(booking.status === "pending" || booking.status === "confirmed") && (
                          <>
                            <button
                              onClick={() => updateStatus(booking.id, "completed")}
                              disabled={updating === booking.id}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Mark Completed
                            </button>
                            <button
                              onClick={() => updateStatus(booking.id, "cancelled")}
                              disabled={updating === booking.id}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-destructive/15 text-destructive hover:bg-destructive/25 transition-all disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                          </>
                        )}
                        <p className="text-xs text-muted-foreground ml-auto">
                          Created {formatRelativeTime(booking.created_at)}
                        </p>
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

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { formatRelativeTime } from "@/lib/utils";
import { Search, RefreshCw, User, Mail, Phone, MapPin, ShoppingBag, Eye } from "lucide-react";

interface Customer {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  order_count?: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);

      // Fetch order counts per customer
      const { data: orders } = await supabase
        .from("orders")
        .select("customer_id");

      if (orders) {
        const counts: Record<string, number> = {};
        orders.forEach((o: any) => {
          if (o.customer_id) counts[o.customer_id] = (counts[o.customer_id] || 0) + 1;
        });
        setOrderCounts(counts);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q)
    );
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Total Customers", value: customers.length, icon: User, color: "text-primary" },
          { label: "With Orders", value: Object.keys(orderCounts).length, icon: ShoppingBag, color: "text-emerald-400" },
          { label: "New This Month", value: customers.filter(c => {
            const d = new Date(c.created_at);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length, icon: User, color: "text-sky-400" },
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

      {/* Search + Refresh */}
      <div className="glass rounded-2xl border border-border p-4 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or phone..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button
          onClick={fetchCustomers}
          className="p-2.5 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Customer List */}
      <div className="glass rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <p className="text-sm font-medium text-foreground">{filtered.length} customers</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <User className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No customers found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((customer) => {
              const expanded = expandedId === customer.id;
              const orderCount = orderCounts[customer.id] || 0;
              return (
                <div key={customer.id} className="hover:bg-secondary/20 transition-colors">
                  <div
                    className="flex items-center gap-4 px-5 py-3.5 cursor-pointer"
                    onClick={() => setExpandedId(expanded ? null : customer.id)}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {(customer.name || customer.email || "?").charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {customer.name || "Unknown Customer"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{customer.email || "—"}</span>
                      </div>
                    </div>

                    {/* Order count */}
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-foreground">{orderCount}</p>
                      <p className="text-xs text-muted-foreground">orders</p>
                    </div>

                    <Eye className={`w-4 h-4 shrink-0 transition-colors ${expanded ? "text-primary" : "text-muted-foreground"}`} />
                  </div>

                  {/* Expanded */}
                  {expanded && (
                    <div className="px-5 pb-4 border-t border-border/50 pt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="glass rounded-xl p-3 border border-border">
                        <p className="text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
                        <p className="font-medium text-foreground mt-0.5">{customer.phone || "—"}</p>
                      </div>
                      <div className="glass rounded-xl p-3 border border-border">
                        <p className="text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Address</p>
                        <p className="font-medium text-foreground mt-0.5 truncate">{customer.address || "—"}</p>
                      </div>
                      <div className="glass rounded-xl p-3 border border-border">
                        <p className="text-muted-foreground">Orders Placed</p>
                        <p className="font-semibold text-emerald-400 mt-0.5">{orderCount}</p>
                      </div>
                      <div className="glass rounded-xl p-3 border border-border">
                        <p className="text-muted-foreground">Joined</p>
                        <p className="font-medium text-foreground mt-0.5">{formatRelativeTime(customer.created_at)}</p>
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

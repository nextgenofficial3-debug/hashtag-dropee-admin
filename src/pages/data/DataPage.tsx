import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { Package, Users, RefreshCw, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/hooks/useToast";

type Tab = "products" | "roles";

interface Product {
  id: string;
  name: string;
  price: number;
  category_id: string | null;
  in_stock: boolean | null;
  is_bestseller: boolean | null;
  images: string[] | null;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export default function DataPage() {
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "products") {
        const { data } = await supabase.from("mfc_products").select("*").order("created_at", { ascending: false });
        setProducts((data as Product[]) || []);
      } else if (activeTab === "roles") {
        const { data } = await supabase.from("user_roles").select("*").order("created_at", { ascending: false });
        setRoles((data as UserRole[]) || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSearch("");
  }, [activeTab]);

  const toggleStock = async (productId: string, current: boolean | null) => {
    const { error } = await supabase.from("mfc_products").update({ in_stock: !current }).eq("id", productId);
    if (!error) {
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, in_stock: !current } : p));
      toast({ title: `Product ${!current ? "in stock" : "out of stock"}` });
    }
  };

  const filteredProducts = products.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredRoles = roles.filter(
    (r) => !search || r.role.toLowerCase().includes(search.toLowerCase()) || r.user_id.includes(search)
  );

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: "products", label: "MFC Products", icon: Package, count: products.length },
    { id: "roles", label: "User Roles", icon: Users, count: roles.length },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Tabs */}
      <div className="glass rounded-2xl border border-border p-1.5 flex gap-1">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
              activeTab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span className={cn("text-xs px-1.5 py-0.5 rounded-full", activeTab === id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-secondary text-muted-foreground")}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Refresh */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 glass"
          />
        </div>
        <button onClick={fetchData} className="p-2.5 rounded-xl glass border border-border text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="glass rounded-2xl border border-border overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Products */}
              {activeTab === "products" && (
                <div className="divide-y divide-border">
                  {filteredProducts.length === 0 && <EmptyState text="No products found" />}
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/20 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-secondary overflow-hidden shrink-0">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">🍗</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(product.created_at)}</p>
                      </div>
                      <p className="text-sm font-bold text-emerald-400">{formatCurrency(product.price)}</p>
                      <button
                        onClick={() => toggleStock(product.id, product.in_stock)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                          product.in_stock ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"
                        )}
                      >
                        {product.in_stock ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        {product.in_stock ? "In Stock" : "Out"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Roles */}
              {activeTab === "roles" && (
                <div className="divide-y divide-border">
                  {filteredRoles.length === 0 && <EmptyState text="No user roles found" />}
                  {filteredRoles.map((role) => (
                    <div key={role.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/20 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground font-mono">{role.user_id.slice(0, 20)}...</p>
                        <p className="text-xs text-muted-foreground">{formatDate(role.created_at)}</p>
                      </div>
                      <RoleBadge role={role.role} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    admin: "bg-primary/15 text-primary",
    moderator: "bg-violet-500/15 text-violet-400",
    agent: "bg-sky-500/15 text-sky-400",
    user: "bg-secondary text-muted-foreground",
  };
  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", map[role] || "bg-muted text-muted-foreground")}>
      {role}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="py-12 text-center text-muted-foreground text-sm">{text}</div>;
}

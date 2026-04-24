import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useToast } from "@/hooks/useToast";
import { Settings, MapPin, DollarSign, Shield, Plus, Trash2, Save, RefreshCw, MessageCircle, Store } from "lucide-react";

interface ServiceArea {
  id?: string;
  name: string;
  active: boolean;
}

interface PricingConfig {
  base_fee: number;
  per_km_fee: number;
  min_order: number;
  platform_fee_pct: number;
  agent_daily_fee: number;
  agent_per_delivery_fee: number;
}

export default function SettingsPage() {
  const { user, isSuperAdmin } = useAdminAuth();
  const { toast } = useToast();

  // Service Areas
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [newArea, setNewArea] = useState("");
  const [savingArea, setSavingArea] = useState(false);

  // Pricing
  const [pricing, setPricing] = useState<PricingConfig>({
    base_fee: 30,
    per_km_fee: 8,
    min_order: 50,
    platform_fee_pct: 10,
    agent_daily_fee: 50,
    agent_per_delivery_fee: 15,
  });
  const [savingPricing, setSavingPricing] = useState(false);

  // Cafe Contact & Location
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [cafeAddress, setCafeAddress] = useState("");
  const [cafeMapUrl, setCafeMapUrl] = useState("");

  // Admin users
  const [admins, setAdmins] = useState<{ id: string; email: string; name: string | null; created_at: string }[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);

  const fetchAdmins = async () => {
    const { data } = await supabase.from("user_roles").select("*").eq("role", "admin").order("created_at");
    setAdmins(data?.map((r: any) => ({ id: r.user_id, email: r.email || "—", name: r.name || null, created_at: r.created_at })) || []);
  };

  const fetchSettings = async () => {
    // Use (supabase as any) until app_settings is added to generated types after migration
    const { data } = await (supabase as any).from("app_settings").select("*").maybeSingle();
    if (data) {
      if (data.service_areas) setAreas(data.service_areas);
      if (data.pricing) setPricing(data.pricing);
      if (data.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
      if (data.cafe_address) setCafeAddress(data.cafe_address);
      if (data.cafe_map_url) setCafeMapUrl(data.cafe_map_url);
    } else {
      // Default example areas
      setAreas([
        { name: "Ukhrul Town", active: true },
        { name: "Kamjong", active: true },
        { name: "Somdal", active: false },
      ]);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchAdmins();
  }, []);

  const saveSettings = async () => {
    setSavingPricing(true);
    try {
      await (supabase as any).from("app_settings").upsert({
        id: "main",
        service_areas: areas,
        pricing,
        whatsapp_number: whatsappNumber,
        cafe_address: cafeAddress,
        cafe_map_url: cafeMapUrl,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      toast({ title: "Settings saved successfully" });
    } catch (err) {
      toast({ title: "Failed to save settings", variant: "destructive" });
    }
    setSavingPricing(false);
  };

  const addArea = () => {
    if (!newArea.trim()) return;
    setAreas((prev) => [...prev, { name: newArea.trim(), active: true }]);
    setNewArea("");
  };

  const removeArea = (idx: number) => {
    setAreas((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleArea = (idx: number) => {
    setAreas((prev) => prev.map((a, i) => i === idx ? { ...a, active: !a.active } : a));
  };

  const addAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    setAddingAdmin(true);
    try {
      await (supabase as any).from("role_invitations").upsert({
        email: newAdminEmail.trim().toLowerCase(),
        role: "admin",
        invited_by: user?.id,
        notes: "Admin panel invitation",
      }, { onConflict: "email" });
      toast({ title: "Admin invitation added. They'll get admin access on next Google login." });
      setNewAdminEmail("");
    } catch {
      toast({ title: "Failed to add admin", variant: "destructive" });
    }
    setAddingAdmin(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Platform Settings</h1>
          <p className="text-xs text-muted-foreground">Service areas, pricing config, and admin management</p>
        </div>
      </div>

      {/* Delivery Pricing Config */}
      <div className="glass rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <p className="text-sm font-semibold text-foreground">Delivery Pricing (Customer Fees)</p>
          <p className="text-xs text-muted-foreground ml-auto">What customers pay</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {(["base_fee", "per_km_fee", "min_order", "platform_fee_pct"] as const).map((key) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground capitalize block mb-1.5">
                {key.replace(/_/g, " ")} {key.includes("pct") ? "(%)" : "(₵)"}
              </label>
              <input
                type="number"
                value={pricing[key]}
                onChange={(e) => setPricing((p) => ({ ...p, [key]: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          ))}
        </div>
        <button
          onClick={saveSettings}
          disabled={savingPricing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
        >
          {savingPricing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Pricing
        </button>
      </div>

      {/* Agent Earnings Config */}
      <div className="glass rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-yellow-400" />
          <p className="text-sm font-semibold text-foreground">Agent Earnings</p>
          <p className="text-xs text-muted-foreground ml-auto">What agents earn</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Daily Flat Fee (₵/day)</label>
            <input
              type="number"
              value={pricing.agent_daily_fee}
              onChange={(e) => setPricing((p) => ({ ...p, agent_daily_fee: Number(e.target.value) }))}
              className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="text-xs text-muted-foreground mt-1">Flat daily earning for active agents</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Per Delivery Fee (₵/delivery)</label>
            <input
              type="number"
              value={pricing.agent_per_delivery_fee}
              onChange={(e) => setPricing((p) => ({ ...p, agent_per_delivery_fee: Number(e.target.value) }))}
              className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="text-xs text-muted-foreground mt-1">Paid to agent per completed delivery</p>
          </div>
        </div>
        <button
          onClick={saveSettings}
          disabled={savingPricing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 text-black text-sm font-semibold hover:bg-yellow-300 transition-all disabled:opacity-50"
        >
          {savingPricing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Agent Fees
        </button>
      </div>

      {/* Cafe Contact & Location */}
      <div className="glass rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Store className="w-4 h-4 text-orange-400" />
          <p className="text-sm font-semibold text-foreground">Cafe Contact & Location</p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Number (with country code)
            </label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="e.g. +919876543210"
              className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Cafe Full Address
            </label>
            <input
              type="text"
              value={cafeAddress}
              onChange={(e) => setCafeAddress(e.target.value)}
              placeholder="e.g. 123 Cafe Street, City"
              className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Google Maps URL
            </label>
            <input
              type="text"
              value={cafeMapUrl}
              onChange={(e) => setCafeMapUrl(e.target.value)}
              placeholder="e.g. https://maps.app.goo.gl/..."
              className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <button
          onClick={saveSettings}
          disabled={savingPricing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
        >
          {savingPricing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Contact Info
        </button>
      </div>

      {/* Service Areas */}
      <div className="glass rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-sky-400" />
          <p className="text-sm font-semibold text-foreground">Service Areas</p>
        </div>
        <div className="space-y-2">
          {areas.map((area, idx) => (
            <div key={idx} className="flex items-center gap-3 glass rounded-xl border border-border px-4 py-2.5">
              <button
                onClick={() => toggleArea(idx)}
                className={`w-8 h-4 rounded-full transition-colors ${area.active ? "bg-primary" : "bg-secondary"}`}
              >
                <div className={`w-3 h-3 rounded-full bg-white transform transition-transform ${area.active ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
              <span className="flex-1 text-sm text-foreground">{area.name}</span>
              <span className={`text-xs font-medium ${area.active ? "text-emerald-400" : "text-muted-foreground"}`}>
                {area.active ? "Active" : "Inactive"}
              </span>
              <button onClick={() => removeArea(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <input
            value={newArea}
            onChange={(e) => setNewArea(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addArea()}
            placeholder="Add service area..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={addArea}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/15 text-primary hover:bg-primary/25 transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <button
          onClick={saveSettings}
          disabled={savingPricing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> Save Areas
        </button>
      </div>

      {/* Admin Users */}
      {isSuperAdmin && (
        <div className="glass rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-semibold text-foreground">Admin Users</p>
          </div>
          <div className="space-y-2">
            {admins.length === 0 && (
              <p className="text-sm text-muted-foreground">No other admins yet</p>
            )}
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center gap-3 glass rounded-xl border border-border px-4 py-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{admin.email}</p>
                  {admin.name && <p className="text-xs text-muted-foreground">{admin.name}</p>}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="admin@gmail.com"
              className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={addAdmin}
              disabled={addingAdmin || !newAdminEmail.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-all text-sm font-medium disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> {addingAdmin ? "Adding..." : "Add Admin"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            The invited email will automatically receive admin access on their first Google login.
          </p>
        </div>
      )}
    </motion.div>
  );
}

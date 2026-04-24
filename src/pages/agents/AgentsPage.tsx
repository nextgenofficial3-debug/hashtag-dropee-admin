import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, CheckCircle, XCircle, Truck, Clock, Wifi, WifiOff,
  ChevronDown, ChevronUp, Gift, Package, Phone, Mail, Car,
  Shield, ShieldOff, Send, ClipboardList, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAllAgents, AdminAgent, UnassignedDeliveryOrder } from "@/hooks/useAllAgents";
import { useToast } from "@/hooks/useToast";

// ── helpers ──────────────────────────────────────────────────────────────────
function genAgentCode() {
  return "AG-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

const statusColors: Record<string, string> = {
  online:  "text-emerald-400 bg-emerald-400/15",
  offline: "text-zinc-400   bg-zinc-400/15",
  busy:    "text-amber-400  bg-amber-400/15",
  unknown: "text-zinc-500   bg-zinc-500/10",
};
const statusDot: Record<string, string> = {
  online:  "bg-emerald-400 animate-pulse",
  offline: "bg-zinc-500",
  busy:    "bg-amber-400 animate-pulse",
  unknown: "bg-zinc-600",
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function AgentsPage() {
  const { agents, unassignedOrders, loading, refetch, toggleVerification, addAgent, grantBonus, assignOrderToAgent } = useAllAgents();
  const { toast } = useToast();

  const [showAddPanel, setShowAddPanel] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bonusAgentId, setBonusAgentId] = useState<string | null>(null);
  const [assignAgentId, setAssignAgentId] = useState<string | null>(null);

  // counts
  const online  = agents.filter(a => a.availability_status === "online").length;
  const busy    = agents.filter(a => a.availability_status === "busy").length;
  const offline = agents.filter(a => a.availability_status === "offline").length;

  // toggle expand
  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="p-6 space-y-6">

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Agents", value: agents.length, color: "text-blue-400" },
          { label: "Online",  value: online,  color: "text-emerald-400" },
          { label: "On Delivery", value: busy, color: "text-amber-400" },
          { label: "Offline", value: offline, color: "text-zinc-400" },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">All Agents</h2>
        <button
          onClick={() => setShowAddPanel(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add Agent
        </button>
      </div>

      {/* ── Add Agent Panel ── */}
      <AnimatePresence>
        {showAddPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <AddAgentForm
              onAdd={async (params) => {
                const result = await addAgent(params);
                if (result.success) {
                  toast({ title: "Magic link sent!", description: `Login link sent to ${params.email}. Agent will appear after they log in.` });
                  setShowAddPanel(false);
                } else {
                  toast({ title: "Failed", description: result.error, variant: "destructive" });
                }
              }}
              onCancel={() => setShowAddPanel(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Unassigned Orders Banner ── */}
      {unassignedOrders.length > 0 && (
        <div className="glass border border-amber-400/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-foreground">{unassignedOrders.length} Unassigned Delivery {unassignedOrders.length === 1 ? "Order" : "Orders"}</p>
              <p className="text-xs text-muted-foreground">Expand an agent below to assign</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Agent List ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : agents.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <UserPlus className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No agents yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map(agent => (
            <AgentRow
              key={agent.id}
              agent={agent}
              expanded={expandedId === agent.id}
              onToggle={() => toggle(agent.id)}
              onToggleVerify={async () => {
                const ok = await toggleVerification(agent.id, agent.is_verified);
                if (ok) toast({ title: agent.is_verified ? "Agent unverified" : "Agent verified" });
              }}
              onGiveBonus={() => setBonusAgentId(agent.id)}
              onAssignOrder={() => setAssignAgentId(agent.id)}
              unassignedOrders={unassignedOrders}
              onAssign={async (orderId) => {
                const ok = await assignOrderToAgent(orderId, agent.id, agent.user_id);
                if (ok) toast({ title: "Order assigned!", description: `Order sent to ${agent.full_name}` });
                else toast({ title: "Assign failed", variant: "destructive" });
              }}
            />
          ))}
        </div>
      )}

      {/* ── Bonus Modal ── */}
      <AnimatePresence>
        {bonusAgentId && (
          <BonusModal
            agent={agents.find(a => a.id === bonusAgentId)!}
            onGrant={async (amount, notes) => {
              const ok = await grantBonus(bonusAgentId, amount, notes);
              if (ok) toast({ title: "Bonus granted! 🎉", description: `₵${amount} sent to agent` });
              else toast({ title: "Failed to grant bonus", variant: "destructive" });
              setBonusAgentId(null);
            }}
            onClose={() => setBonusAgentId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Add Agent Form ────────────────────────────────────────────────────────────
function AddAgentForm({ onAdd, onCancel }: {
  onAdd: (p: { full_name: string; phone: string; email: string; vehicle: string; agent_code: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", vehicle: "bike",
    agent_code: genAgentCode(),
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.full_name.trim() || !form.email.trim()) return;
    setSaving(true);
    await onAdd(form);
    setSaving(false);
  };

  return (
    <div className="glass border border-primary/30 rounded-xl p-6 space-y-4">
      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-primary" /> New Agent
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name" value={form.full_name} onChange={v => set("full_name", v)} placeholder="e.g. Kwame Mensah" icon={<UserPlus className="w-4 h-4" />} />
        <Field label="Phone" value={form.phone} onChange={v => set("phone", v)} placeholder="+233 XX XXX XXXX" icon={<Phone className="w-4 h-4" />} />
        <Field label="Email" value={form.email} onChange={v => set("email", v)} placeholder="agent@email.com" icon={<Mail className="w-4 h-4" />} type="email" />
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Vehicle</label>
          <select
            value={form.vehicle}
            onChange={e => set("vehicle", e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {["bike", "motorbike", "car", "van", "truck"].map(v => (
              <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Agent Code</label>
          <div className="flex gap-2">
            <input
              value={form.agent_code}
              onChange={e => set("agent_code", e.target.value.toUpperCase())}
              className="flex-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => set("agent_code", genAgentCode())}
              className="px-3 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground text-xs transition-colors"
            >↻</button>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">A login link will be emailed to the agent. They'll appear in the list once they log in.</p>
      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 h-10 rounded-lg border border-border text-muted-foreground text-sm hover:bg-secondary transition-colors">Cancel</button>
        <button
          onClick={submit}
          disabled={saving || !form.full_name.trim() || !form.email.trim()}
          className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send Login Link
        </button>
      </div>
    </div>
  );
}

// ── Agent Row ─────────────────────────────────────────────────────────────────
function AgentRow({
  agent, expanded, onToggle, onToggleVerify, onGiveBonus, onAssignOrder,
  unassignedOrders, onAssign,
}: {
  agent: AdminAgent; expanded: boolean;
  onToggle: () => void; onToggleVerify: () => void;
  onGiveBonus: () => void; onAssignOrder: () => void;
  unassignedOrders: UnassignedDeliveryOrder[];
  onAssign: (orderId: string) => Promise<void>;
}) {
  const [assigning, setAssigning] = useState(false);

  const statusLabel = agent.current_order_id ? "on_delivery" : agent.availability_status;
  const displayStatus = {
    on_delivery: "On Delivery",
    online: "Online",
    offline: "Offline",
    busy: "Busy",
    unknown: "Unknown",
  }[statusLabel] ?? "Unknown";

  const statusColorKey = agent.current_order_id ? "busy" : agent.availability_status;

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Row header */}
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {agent.full_name.charAt(0).toUpperCase()}
          </div>
          <span className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background", statusDot[statusColorKey])} />
        </div>

        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground truncate">{agent.full_name}</p>
            {agent.is_verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground">{agent.agent_code} · {agent.vehicle}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusColors[statusColorKey])}>
            {displayStatus}
          </span>
          {agent.bonus_total > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-400/15 text-yellow-400">
              +₵{agent.bonus_total.toFixed(0)} bonus
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-4 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Deliveries</p>
                  <p className="text-lg font-bold text-foreground">{agent.total_deliveries}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Earnings</p>
                  <p className="text-lg font-bold text-foreground">₵{Number(agent.total_earnings).toFixed(0)}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="text-lg font-bold text-foreground">{Number(agent.average_rating).toFixed(1)}⭐</p>
                </div>
              </div>

              {/* Contact */}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {agent.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{agent.phone}</span>}
                {agent.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{agent.email}</span>}
                <span className="flex items-center gap-1"><Car className="w-3 h-3" />{agent.vehicle}</span>
              </div>

              {/* Current order */}
              {agent.current_order_id && (
                <div className="flex items-center gap-3 bg-amber-400/10 border border-amber-400/30 rounded-lg p-3">
                  <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-amber-400">Currently delivering</p>
                    <p className="text-xs text-foreground truncate">{agent.current_order_address}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onToggleVerify}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    agent.is_verified
                      ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                      : "bg-emerald-400/15 text-emerald-400 hover:bg-emerald-400/25"
                  )}
                >
                  {agent.is_verified ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                  {agent.is_verified ? "Unverify" : "Verify"}
                </button>

                <button
                  onClick={onGiveBonus}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-400/15 text-yellow-400 hover:bg-yellow-400/25 transition-colors"
                >
                  <Gift className="w-3.5 h-3.5" /> Give Bonus
                </button>
              </div>

              {/* Assign Order */}
              {unassignedOrders.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5" /> Assign a pending order
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {unassignedOrders.map(order => (
                      <div key={order.id} className="flex items-center gap-3 bg-secondary/40 rounded-lg p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{order.delivery_address}</p>
                          {order.pickup_address && (
                            <p className="text-xs text-muted-foreground truncate">From: {order.pickup_address}</p>
                          )}
                          {order.total_fee && (
                            <p className="text-xs text-primary font-semibold">₵{Number(order.total_fee).toFixed(2)}</p>
                          )}
                        </div>
                        <button
                          disabled={assigning}
                          onClick={async () => {
                            setAssigning(true);
                            await onAssign(order.id);
                            setAssigning(false);
                          }}
                          className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                          {assigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Assign"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bonus history */}
              {agent.bonuses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5" /> Bonus History
                  </p>
                  <div className="space-y-1">
                    {agent.bonuses.slice(0, 5).map(b => (
                      <div key={b.id} className="flex items-center justify-between text-xs bg-secondary/30 rounded-lg px-3 py-2">
                        <span className="text-muted-foreground">{b.notes || "Bonus"}</span>
                        <span className="font-semibold text-yellow-400">+₵{Number(b.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Bonus Modal ───────────────────────────────────────────────────────────────
function BonusModal({ agent, onGrant, onClose }: {
  agent: AdminAgent;
  onGrant: (amount: number, notes: string) => Promise<void>;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    setSaving(true);
    await onGrant(n, notes);
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass rounded-2xl p-6 w-full max-w-sm space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Give Bonus</h3>
            <p className="text-xs text-muted-foreground">{agent.full_name}</p>
          </div>
        </div>

        <div className="space-y-3">
          <Field label="Amount (₵)" value={amount} onChange={setAmount} placeholder="e.g. 50" type="number" icon={<span className="text-sm font-bold">₵</span>} />
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Outstanding performance this week"
              className="w-full h-20 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-border text-muted-foreground text-sm hover:bg-secondary transition-colors">Cancel</button>
          <button
            onClick={submit}
            disabled={saving || !amount || parseFloat(amount) <= 0}
            className="flex-1 h-10 rounded-lg bg-yellow-400 text-black text-sm font-semibold flex items-center justify-center gap-2 hover:bg-yellow-300 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
            Grant Bonus
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Field helper ──────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = "text", icon }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground font-medium">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary",
            icon && "pl-8"
          )}
        />
      </div>
    </div>
  );
}

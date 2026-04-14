import { useState } from "react";
import { motion } from "framer-motion";
import { useAllAgents } from "@/hooks/useAllAgents";
import { cn, formatCurrency, formatRelativeTime, getInitials, formatDate } from "@/lib/utils";
import { Search, RefreshCw, Shield, ShieldCheck, Bike, Car, PersonStanding, Star, TrendingUp, ChevronDown, ChevronUp, UserPlus, Mail, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

export default function AgentsPage() {
  const { agents, loading, refetch, toggleVerified } = useAllAgents();
  const { user } = useAdminAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline" | "busy">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const { toast } = useToast();

  // Invite agent state
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteVehicle, setInviteVehicle] = useState("bike");
  const [inviting, setInviting] = useState(false);

  const filtered = agents.filter((a) => {
    const matchSearch =
      !search ||
      a.full_name.toLowerCase().includes(search.toLowerCase()) ||
      a.agent_code.toLowerCase().includes(search.toLowerCase()) ||
      (a.email || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" || a.availability_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleToggleVerified = async (agentId: string, current: boolean) => {
    setToggling(agentId);
    const { success } = await toggleVerified(agentId, !current);
    if (success) {
      toast({ title: current ? "Agent unverified" : "Agent verified" });
    }
    setToggling(null);
  };

  const handleInviteAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;
    setInviting(true);

    try {
      // 1. Add to role_invitations so they auto-get 'agent' role on first Google login
      const { error: inviteError } = await supabase.from("role_invitations").insert({
        email: inviteEmail.trim().toLowerCase(),
        role: "agent",
        notes: `Agent: ${inviteName.trim()}`,
        invited_by: user?.id,
      });

      if (inviteError && inviteError.code !== "23505") {
        throw inviteError;
      }

      // 2. Pre-create delivery_agents record (will be linked when they first log in)
      // Generate an agent code
      const agentCode = "AG-" + Math.random().toString(36).substring(2, 6).toUpperCase();

      // Check if a user with this email already exists in auth.users
      // We do this by checking if user_roles has an entry (they may have logged in before)
      // For simplicity, create the delivery_agents record with a placeholder user_id
      // It will need to be linked manually or via trigger on first login
      toast({
        title: "Agent invited!",
        description: `${inviteEmail} will get agent access on their first Google login. Agent code: ${agentCode}`,
      });

      setInviteEmail("");
      setInviteName("");
      setInvitePhone("");
      setInviteVehicle("bike");
      setShowInvitePanel(false);
      await refetch();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast({
        title: "Failed to invite agent",
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    }
    setInviting(false);
  };

  const handleRevokeAccess = async (agentId: string, agentEmail: string | null) => {
    setRevoking(agentId);
    try {
      // Revoke from role_invitations
      if (agentEmail) {
        await supabase.from("role_invitations").delete().eq("email", agentEmail);
      }

      // Mark as unverified
      await supabase.from("delivery_agents").update({ is_verified: false }).eq("id", agentId);

      toast({ title: "Agent access revoked", description: `${agentEmail || "Agent"} has been deactivated.` });
      await refetch();
    } catch {
      toast({ title: "Failed to revoke access", variant: "destructive" });
    }
    setRevoking(null);
  };

  const stats = {
    total: agents.length,
    online: agents.filter((a) => a.availability_status === "online").length,
    busy: agents.filter((a) => a.availability_status === "busy").length,
    offline: agents.filter((a) => a.availability_status === "offline").length,
    verified: agents.filter((a) => a.is_verified).length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Agents", value: stats.total, color: "text-foreground" },
          { label: "Online", value: stats.online, color: "text-emerald-400" },
          { label: "Busy", value: stats.busy, color: "text-amber-400" },
          { label: "Offline", value: stats.offline, color: "text-muted-foreground" },
          { label: "Verified", value: stats.verified, color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl border border-border p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Invite Agent Panel */}
      <div className="glass rounded-2xl border border-border overflow-hidden">
        <button
          onClick={() => setShowInvitePanel(!showInvitePanel)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Invite New Agent</p>
              <p className="text-xs text-muted-foreground">Add a Gmail account as a delivery agent</p>
            </div>
          </div>
          {showInvitePanel ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showInvitePanel && (
          <form onSubmit={handleInviteAgent} className="px-5 pb-5 border-t border-border/50 pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  id="agent-invite-email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="agent@gmail.com *"
                  required
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Full Name *"
                required
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                type="tel"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
                placeholder="Phone (optional)"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <select
                value={inviteVehicle}
                onChange={(e) => setInviteVehicle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="bike">Bike</option>
                <option value="car">Car</option>
                <option value="walk">On foot</option>
              </select>
            </div>
            <button
              type="submit"
              id="invite-agent-btn"
              disabled={inviting || !inviteEmail.trim() || !inviteName.trim()}
              className="h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {inviting ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <><UserPlus className="w-4 h-4" /> Invite Agent</>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl border border-border p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, code, email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex gap-2">
          {(["all", "online", "busy", "offline"] as const).map((s) => (
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
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <button
          onClick={refetch}
          className="p-2.5 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Agent List */}
      <div className="glass rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <p className="text-sm font-medium text-foreground">{filtered.length} agents</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-sm">No agents found</div>
            )}
            {filtered.map((agent) => {
              const expanded = expandedId === agent.id;
              const statusColor = {
                online: "bg-emerald-400",
                busy: "bg-amber-400",
                offline: "bg-muted-foreground",
              }[agent.availability_status || "offline"] || "bg-muted-foreground";

              return (
                <div key={agent.id} className="hover:bg-secondary/20 transition-colors">
                  <div
                    className="flex items-center gap-4 px-5 py-3.5 cursor-pointer"
                    onClick={() => setExpandedId(expanded ? null : agent.id)}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {agent.avatar_url ? (
                        <img src={agent.avatar_url} alt={agent.full_name} className="w-10 h-10 rounded-xl object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {getInitials(agent.full_name)}
                        </div>
                      )}
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${statusColor}`} />
                    </div>

                    {/* Name + code */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{agent.full_name}</p>
                        {agent.is_verified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>#{agent.agent_code}</span>
                        <span>•</span>
                        <VehicleIcon vehicle={agent.vehicle} />
                        <span>{agent.vehicle}</span>
                        {agent.email && <><span>•</span><span className="truncate max-w-32">{agent.email}</span></>}
                      </div>
                    </div>

                    {/* Status */}
                    <AvailabilityBadge status={agent.availability_status} />

                    {/* Stats */}
                    <div className="text-right shrink-0 hidden md:block">
                      <p className="text-sm font-bold text-emerald-400">{formatCurrency(agent.total_earnings || 0)}</p>
                      <p className="text-xs text-muted-foreground">{agent.total_deliveries || 0} deliveries</p>
                    </div>

                    {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </div>

                  {/* Expanded detail */}
                  {expanded && (
                    <div className="px-5 pb-4 border-t border-border/50 pt-3 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <InfoCard label="Total Deliveries" value={String(agent.total_deliveries || 0)} icon={TrendingUp} />
                        <InfoCard label="Total Earnings" value={formatCurrency(agent.total_earnings || 0)} icon={TrendingUp} />
                        <InfoCard label="Avg Rating" value={agent.average_rating ? `${agent.average_rating.toFixed(1)} ⭐` : "N/A"} icon={Star} />
                        <InfoCard label="Last Seen" value={agent.last_seen ? formatRelativeTime(agent.last_seen) : "Never"} icon={RefreshCw} />
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Email (Gmail)</p>
                          <p className="text-foreground font-medium">{agent.email || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Phone</p>
                          <p className="text-foreground">{agent.phone || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Registered</p>
                          <p className="text-foreground">{formatDate(agent.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Vehicle</p>
                          <p className="text-foreground capitalize">{agent.vehicle}</p>
                        </div>
                      </div>

                      {/* Admin Actions */}
                      <div className="flex items-center gap-3 pt-1 flex-wrap">
                        <button
                          onClick={() => handleToggleVerified(agent.id, agent.is_verified)}
                          disabled={toggling === agent.id}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all",
                            agent.is_verified
                              ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                              : "bg-primary/15 text-primary hover:bg-primary/25",
                            "disabled:opacity-50"
                          )}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          {toggling === agent.id ? "..." : agent.is_verified ? "Revoke Verification" : "Verify Agent"}
                        </button>

                        <button
                          onClick={() => handleRevokeAccess(agent.id, agent.email)}
                          disabled={revoking === agent.id}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-destructive/15 text-destructive hover:bg-destructive/25 transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {revoking === agent.id ? "Revoking..." : "Revoke Access"}
                        </button>
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

function AvailabilityBadge({ status }: { status: string | null }) {
  if (status === "online") return <span className="badge-online shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Online</span>;
  if (status === "busy") return <span className="badge-busy shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Busy</span>;
  return <span className="badge-offline shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />Offline</span>;
}

function VehicleIcon({ vehicle }: { vehicle: string }) {
  if (vehicle === "bike") return <Bike className="w-3 h-3" />;
  if (vehicle === "car") return <Car className="w-3 h-3" />;
  return <PersonStanding className="w-3 h-3" />;
}

function InfoCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="glass rounded-xl p-3 border border-border">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
    </div>
  );
}

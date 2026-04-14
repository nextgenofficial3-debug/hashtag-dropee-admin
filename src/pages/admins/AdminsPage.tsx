import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useToast } from "@/hooks/useToast";
import { UserCog, Plus, Trash2, Star, Shield, RefreshCw, Mail, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleInvitation {
  id: string;
  email: string;
  role: string;
  notes: string | null;
  created_at: string;
  granted_at: string | null;
}

const SUPER_ADMIN_EMAIL = "hashtagdropee@gmail.com";

export default function AdminsPage() {
  const { user, isSuperAdmin } = useAdminAuth();
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<RoleInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchInvitations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("role_invitations")
      .select("*")
      .eq("role", "admin")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching admins", description: error.message, variant: "destructive" });
    } else {
      setInvitations(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setAdding(true);
    const { error } = await supabase.from("role_invitations").insert({
      email: newEmail.trim().toLowerCase(),
      role: "admin",
      notes: newNotes.trim() || null,
      invited_by: user?.id,
    });

    if (error) {
      toast({
        title: "Failed to add admin",
        description: error.code === "23505" ? "This email is already invited." : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Admin invited", description: `${newEmail} will get admin access on next Google login.` });
      setNewEmail("");
      setNewNotes("");
      await fetchInvitations();
    }
    setAdding(false);
  };

  const handleRemoveAdmin = async (invitation: RoleInvitation) => {
    if (invitation.email === SUPER_ADMIN_EMAIL) {
      toast({ title: "Cannot remove super admin", variant: "destructive" });
      return;
    }

    setRemoving(invitation.id);

    // Remove the invitation
    await supabase.from("role_invitations").delete().eq("id", invitation.id);

    // Also revoke from user_roles if they've already logged in
    const { data: authUser } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (authUser) {
      // Find by email via auth.users — we can only do this via RPC or checking user metadata
      // For now, remove from role_invitations is sufficient; the role stays until they re-login or admin manually removes
      toast({ title: "Admin invitation removed", description: `${invitation.email} will lose access after their next session.` });
    }

    await fetchInvitations();
    setRemoving(null);
  };

  const stats = {
    total: invitations.length,
    granted: invitations.filter((i) => i.granted_at).length,
    pending: invitations.filter((i) => !i.granted_at).length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Admins", value: stats.total, color: "text-foreground", icon: UserCog },
          { label: "Access Granted", value: stats.granted, color: "text-emerald-400", icon: Shield },
          { label: "Pending Login", value: stats.pending, color: "text-amber-400", icon: Clock },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass rounded-xl border border-border p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <Icon className={cn("w-5 h-5", color)} />
            </div>
            <div>
              <p className={cn("text-2xl font-bold", color)}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Admin Form */}
      <div className="glass rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <Plus className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Invite Admin</p>
            <p className="text-xs text-muted-foreground">They'll get admin access on their first Google login</p>
          </div>
        </div>

        <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              id="admin-email-input"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="admin@gmail.com"
              required
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <input
            type="text"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            disabled={adding || !newEmail.trim()}
            id="add-admin-btn"
            className="h-12 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            {adding ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Plus className="w-4 h-4" /> Add Admin</>
            )}
          </button>
        </form>
      </div>

      {/* Admins List */}
      <div className="glass rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-sm font-semibold text-foreground">Admin Roster</p>
            <p className="text-xs text-muted-foreground">Gmail accounts with admin panel access</p>
          </div>
          <button
            onClick={fetchInvitations}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {invitations.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-sm">No admins configured</div>
            )}
            {invitations.map((inv) => {
              const isSuperAdminRow = inv.email === SUPER_ADMIN_EMAIL;
              return (
                <div key={inv.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors">
                  {/* Avatar placeholder */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    isSuperAdminRow ? "bg-amber-500/15" : "bg-primary/10"
                  )}>
                    {isSuperAdminRow ? (
                      <Star className="w-5 h-5 text-amber-400" />
                    ) : (
                      <UserCog className="w-5 h-5 text-primary" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{inv.email}</p>
                      {isSuperAdminRow && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-semibold">
                          <Star className="w-2.5 h-2.5" /> Super Admin
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {inv.granted_at ? (
                        <span className="text-xs text-emerald-400">✓ Access granted</span>
                      ) : (
                        <span className="text-xs text-amber-400">⏳ Pending first login</span>
                      )}
                      {inv.notes && (
                        <span className="text-xs text-muted-foreground">• {inv.notes}</span>
                      )}
                    </div>
                  </div>

                  {/* Remove button */}
                  {!isSuperAdminRow && isSuperAdmin && (
                    <button
                      onClick={() => handleRemoveAdmin(inv)}
                      disabled={removing === inv.id}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
                      title="Remove admin access"
                    >
                      {removing === inv.id ? (
                        <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
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

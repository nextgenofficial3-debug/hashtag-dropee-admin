import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { FileText, Plus, Save, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";

const POLICY_TYPES = [
  { id: "terms", label: "Terms & Conditions" },
  { id: "privacy", label: "Privacy Policy" },
  { id: "delivery", label: "Delivery Policy" },
  { id: "refund", label: "Refund Policy" },
  { id: "merchant", label: "Merchant Agreement" },
];

interface Policy {
  id?: string;
  type: string;
  title: string;
  content: string;
  updated_by?: string;
}

export default function PoliciesPage() {
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const [activeType, setActiveType] = useState("terms");
  const [policies, setPolicies] = useState<Record<string, Policy>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const current = policies[activeType] || { type: activeType, title: "", content: "" };

  const fetchPolicy = async (type: string) => {
    if (policies[type]) return;
    setLoading(true);
    const { data } = await (supabase as any).from("policies").select("*").eq("type", type).single();
    if (data) {
      setPolicies((prev) => ({ ...prev, [type]: data }));
    }
    setLoading(false);
  };

  const handleTabChange = (type: string) => {
    setActiveType(type);
    fetchPolicy(type);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload: Policy = {
      ...current,
      type: activeType,
      updated_by: user.id,
    };
    const { error } = await (supabase as any)
      .from("policies")
      .upsert(payload, { onConflict: "type" });

    if (error) {
      toast({ title: "Failed to save policy", variant: "destructive" });
    } else {
      toast({ title: "✅ Policy saved successfully" });
    }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Platform Policies</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage terms, privacy, delivery and refund policies
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Policy
        </button>
      </div>

      {/* Policy Type Tabs */}
      <div className="flex gap-2 flex-wrap">
        {POLICY_TYPES.map((p) => (
          <button
            key={p.id}
            onClick={() => handleTabChange(p.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeType === p.id
                ? "bg-primary text-primary-foreground"
                : "glass border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="glass rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {POLICY_TYPES.find((p) => p.id === activeType)?.label}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Policy Title
              </label>
              <input
                value={current.title}
                onChange={(e) =>
                  setPolicies((prev) => ({
                    ...prev,
                    [activeType]: { ...current, title: e.target.value },
                  }))
                }
                placeholder="e.g. Terms and Conditions"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Policy Content (supports Markdown)
              </label>
              <textarea
                value={current.content}
                onChange={(e) =>
                  setPolicies((prev) => ({
                    ...prev,
                    [activeType]: { ...current, content: e.target.value },
                  }))
                }
                rows={20}
                placeholder="Write your policy content here..."
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Send, Users, Truck, ShoppingBag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFCM } from "@/hooks/useFCM";
import { useToast } from "@/hooks/useToast";

type TargetApp = "all" | "mfc" | "agent" | "admin";

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetApp, setTargetApp] = useState<TargetApp>("all");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number } | null>(null);
  const { permission, requestPermission, isReady } = useFCM();
  const { toast } = useToast();

  const appOptions: { id: TargetApp; label: string; icon: React.ElementType; desc: string }[] = [
    { id: "all", label: "All Apps", icon: Users, desc: "MFC customers + agents + admins" },
    { id: "mfc", label: "MFC Customers", icon: ShoppingBag, desc: "Everyone who subscribed on MFC" },
    { id: "agent", label: "Delivery Agents", icon: Truck, desc: "All active delivery agents" },
    { id: "admin", label: "Admins Only", icon: Bell, desc: "Platform administrators" },
  ];

  const handleSend = async () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const payload: Record<string, string> = { title: title.trim(), body: body.trim() };
      if (targetApp !== "all") payload.target_app = targetApp;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fcm-notify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to send");

      setLastResult({ sent: result.sent, failed: result.failed ?? 0 });
      toast({ title: `✅ Sent to ${result.sent} device(s)` });
      setTitle("");
      setBody("");
    } catch (err: any) {
      toast({ title: err.message || "Failed to send notification", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
      {/* FCM Status */}
      <div className={`glass rounded-2xl border p-4 flex items-center gap-4 ${isReady ? "border-emerald-500/30" : "border-amber-500/30"}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isReady ? "bg-emerald-500/15" : "bg-amber-500/15"}`}>
          <Bell className={`w-5 h-5 ${isReady ? "text-emerald-400" : "text-amber-400"}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {isReady ? "Push notifications active on this browser" : "Enable push notifications on this browser"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isReady ? "You'll receive alerts for new orders and events in real-time." : "Click Enable to receive alerts even when the tab is in background."}
          </p>
        </div>
        {!isReady && permission !== "denied" && (
          <button
            onClick={requestPermission}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            Enable
          </button>
        )}
        {permission === "denied" && (
          <span className="text-xs text-destructive font-medium shrink-0">Blocked in browser settings</span>
        )}
      </div>

      {/* Compose */}
      <div className="glass rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <Send className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Broadcast Notification</h2>
            <p className="text-xs text-muted-foreground">Send FCM push to all registered devices</p>
          </div>
        </div>

        {/* Target selector */}
        <div className="grid grid-cols-2 gap-2">
          {appOptions.map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              onClick={() => setTargetApp(id)}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                targetApp === id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40 hover:bg-secondary/30"
              }`}
            >
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${targetApp === id ? "text-primary" : "text-muted-foreground"}`} />
              <div>
                <p className={`text-xs font-semibold ${targetApp === id ? "text-primary" : "text-foreground"}`}>{label}</p>
                <p className="text-xs text-muted-foreground leading-tight">{desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notification Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 🍗 New MFC Deal!"
            className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Message Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="e.g. Get 20% off all combo meals today only!"
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={sending || !title.trim()}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? "Sending..." : "Send Push Notification"}
        </button>

        {lastResult && (
          <div className="flex gap-4 pt-1">
            <div className="flex-1 glass rounded-xl border border-emerald-500/20 p-3 text-center">
              <p className="text-xl font-bold text-emerald-400">{lastResult.sent}</p>
              <p className="text-xs text-muted-foreground">Delivered</p>
            </div>
            <div className="flex-1 glass rounded-xl border border-destructive/20 p-3 text-center">
              <p className="text-xl font-bold text-destructive">{lastResult.failed}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

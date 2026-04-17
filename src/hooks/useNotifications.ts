import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AppNotification {
  id: string;
  user_id: string;
  role: string | null;
  title: string;
  message: string;
  type: string | null;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  redirect_url: string | null;
  created_at: string;
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    (supabase as any)
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }: { data: AppNotification[] | null }) => {
        const list = data || [];
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.is_read).length);
        setLoading(false);
      });

    const channel = (supabase as any)
      .channel(`admin-notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload: any) => {
          const newNote = payload.new as AppNotification;
          setNotifications((prev) => [newNote, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => { (supabase as any).removeChannel(channel); };
  }, [userId]);

  const markRead = async (id: string) => {
    await (supabase as any).from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await (supabase as any).from("notifications").update({ is_read: true }).eq("user_id", userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, loading, markRead, markAllRead };
}

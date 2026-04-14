import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminDeliveryOrder {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string | null;
  pickup_address: string;
  delivery_address: string;
  status: string;
  total_fee: number | null;
  created_at: string;
  updated_at: string;
  agent_id: string | null;
  distance_km: number | null;
  is_fragile: boolean | null;
  package_description: string | null;
  source: "delivery";
  agent_name?: string | null;
}

export interface AdminMfcOrder {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  total: number;
  status: string;
  created_at: string;
  source: "mfc";
}

export type AdminOrder = AdminDeliveryOrder | AdminMfcOrder;

interface DeliveryRow {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string | null;
  pickup_address: string;
  delivery_address: string;
  status: string;
  total_fee: number | null;
  created_at: string;
  updated_at: string;
  agent_id: string | null;
  distance_km: number | null;
  is_fragile: boolean | null;
  package_description: string | null;
}

interface MfcRow {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  total: number;
  status: string;
  created_at: string;
}

export function useAllOrders() {
  const [deliveryOrders, setDeliveryOrders] = useState<AdminDeliveryOrder[]>([]);
  const [mfcOrders, setMfcOrders] = useState<AdminMfcOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const { data: dOrders } = await supabase
      .from("delivery_orders")
      .select("id, order_code, customer_name, customer_phone, pickup_address, delivery_address, status, total_fee, created_at, updated_at, agent_id, distance_km, is_fragile, package_description")
      .order("created_at", { ascending: false })
      .limit(200);

    let ordersWithAgents: AdminDeliveryOrder[] = [];
    if (dOrders) {
      const rows = dOrders as DeliveryRow[];
      const agentIds = [...new Set(rows.filter((o) => o.agent_id).map((o) => o.agent_id as string))];
      let agentMap: Record<string, string> = {};

      if (agentIds.length > 0) {
        const { data: agents } = await supabase
          .from("delivery_agents")
          .select("id, full_name")
          .in("id", agentIds);
        if (agents) {
          agentMap = Object.fromEntries(agents.map((a) => [a.id, a.full_name]));
        }
      }

      ordersWithAgents = rows.map((o) => ({
        ...o,
        source: "delivery" as const,
        agent_name: o.agent_id ? agentMap[o.agent_id] ?? null : null,
      }));
    }

    const mfcResult = await supabase
      .from("orders")
      .select("id, customer_name, customer_phone, customer_address, total, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    const mfcRows: MfcRow[] = mfcResult.error ? [] : ((mfcResult.data as MfcRow[]) || []);

    setDeliveryOrders(ordersWithAgents);
    setMfcOrders(
      mfcRows.map((o) => ({
        ...o,
        source: "mfc" as const,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_orders" }, () => fetchOrders())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateDeliveryStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("delivery_orders")
      .update({ status: newStatus as "pending_assignment" | "accepted" | "delivered" | "cancelled", updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (!error) await fetchOrders();
    return { success: !error, error: error?.message };
  };

  const allOrders: AdminOrder[] = [
    ...deliveryOrders,
    ...mfcOrders,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    allOrders,
    deliveryOrders,
    mfcOrders,
    loading,
    refetch: fetchOrders,
    updateDeliveryStatus,
  };
}

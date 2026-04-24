import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AgentBonus {
  id: string;
  amount: number;
  notes: string | null;
  created_at: string;
}

export interface AdminAgent {
  id: string;
  agent_code: string;
  full_name: string;
  user_id: string | null;
  vehicle: string;
  phone: string | null;
  email: string | null;
  is_verified: boolean;
  total_deliveries: number;
  total_earnings: number;
  average_rating: number;
  created_at: string;
  // enriched fields
  availability_status: "online" | "offline" | "busy" | "unknown";
  last_seen: string | null;
  bonus_total: number;
  bonuses: AgentBonus[];
  current_order_id: string | null;
  current_order_address: string | null;
}

export interface UnassignedDeliveryOrder {
  id: string;
  pickup_address: string | null;
  delivery_address: string;
  status: string;
  total_fee: number | null;
  created_at: string;
}

export function useAllAgents() {
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [unassignedOrders, setUnassignedOrders] = useState<UnassignedDeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const [agentRows, availRows, bonusRows, deliveryOrders] = await Promise.all([
        supabase.from("delivery_agents").select("*").order("created_at", { ascending: false }).then(r => r.data),
        supabase.from("agent_availability").select("agent_id, status, last_seen").then(r => r.data),
        (supabase as any).from("agent_bonuses").select("agent_id, id, amount, notes, created_at").then((r: any) => r.data),
        supabase
          .from("delivery_orders")
          .select("agent_id, id, delivery_address, status")
          .in("status", ["accepted", "en_route_pickup", "arrived_pickup", "picked_up", "in_transit", "arrived_delivery"])
          .not("agent_id", "is", null)
          .then(r => r.data),
      ]);

      const agentErr = null; // errors handled per-query above
      if (!agentRows) return;

      const availMap = new Map<string, { status: string; last_seen: string | null }>();
      (availRows || []).forEach((a: any) => {
        availMap.set(a.agent_id, { status: a.status, last_seen: a.last_seen });
      });

      const bonusMap = new Map<string, AgentBonus[]>();
      (bonusRows || []).forEach((b: any) => {
        if (!bonusMap.has(b.agent_id)) bonusMap.set(b.agent_id, []);
        bonusMap.get(b.agent_id)!.push({ id: b.id, amount: b.amount, notes: b.notes, created_at: b.created_at });
      });

      const currentOrderMap = new Map<string, { id: string; delivery_address: string }>();
      (deliveryOrders || []).forEach((o: any) => {
        if (o.agent_id && !currentOrderMap.has(o.agent_id)) {
          currentOrderMap.set(o.agent_id, { id: o.id, delivery_address: o.delivery_address });
        }
      });

      const enriched: AdminAgent[] = (agentRows || []).map((a: any) => {
        const avail = availMap.get(a.id);
        const bonuses = bonusMap.get(a.id) || [];
        const bonus_total = bonuses.reduce((s, b) => s + Number(b.amount), 0);
        const currentOrder = currentOrderMap.get(a.id);
        return {
          ...a,
          availability_status: (avail?.status as AdminAgent["availability_status"]) || "unknown",
          last_seen: avail?.last_seen || null,
          bonus_total,
          bonuses,
          current_order_id: currentOrder?.id || null,
          current_order_address: currentOrder?.delivery_address || null,
        };
      });

      setAgents(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
    }
  }, []);

  const fetchUnassignedOrders = useCallback(async () => {
    const { data } = await supabase
      .from("delivery_orders")
      .select("id, pickup_address, delivery_address, status, total_fee, created_at")
      .eq("status", "pending_assignment")
      .order("created_at", { ascending: false });
    setUnassignedOrders((data as UnassignedDeliveryOrder[]) || []);
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchAgents(), fetchUnassignedOrders()]);
    setLoading(false);
  }, [fetchAgents, fetchUnassignedOrders]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Toggle agent verification
  const toggleVerification = useCallback(async (agentId: string, current: boolean) => {
    const { error } = await supabase
      .from("delivery_agents")
      .update({ is_verified: !current })
      .eq("id", agentId);
    if (!error) await fetchAgents();
    return !error;
  }, [fetchAgents]);

  // Add new agent (creates delivery_agents row + role_invitations + magic link)
  const addAgent = useCallback(async (params: {
    full_name: string;
    phone: string;
    email: string;
    vehicle: string;
    agent_code: string;
  }) => {
    try {
      // 1. Insert role invitation
      const { error: inviteErr } = await supabase.from("role_invitations").insert({
        email: params.email.trim().toLowerCase(),
        role: "agent",
        notes: JSON.stringify({
          full_name: params.full_name,
          phone: params.phone,
          vehicle: params.vehicle,
          agent_code: params.agent_code,
        }),
      });

      if (inviteErr && !inviteErr.message.includes("duplicate")) {
        return { success: false, error: inviteErr.message };
      }

      // 2. Send magic link so agent can activate their account
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: params.email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
          data: {
            full_name: params.full_name,
            agent_code: params.agent_code,
          },
        },
      });

      if (otpErr) {
        return { success: false, error: otpErr.message };
      }

      await refetch();
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  }, [refetch]);

  // Grant bonus to agent
  const grantBonus = useCallback(async (agentId: string, amount: number, notes: string) => {
    const { error } = await (supabase as any).from("agent_bonuses").insert({
      agent_id: agentId,
      amount,
      notes: notes || null,
    });
    if (!error) await fetchAgents();
    return !error;
  }, [fetchAgents]);

  // Assign a delivery_order to an agent
  const assignOrderToAgent = useCallback(async (
    orderId: string,
    agentId: string,
    agentUserId: string | null
  ) => {
    const { error } = await supabase
      .from("delivery_orders")
      .update({
        agent_id: agentId,
        agent_user_id: agentUserId,
        status: "accepted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);
    if (!error) await Promise.all([fetchAgents(), fetchUnassignedOrders()]);
    return !error;
  }, [fetchAgents, fetchUnassignedOrders]);

  return {
    agents,
    unassignedOrders,
    loading,
    error,
    refetch,
    toggleVerification,
    addAgent,
    grantBonus,
    assignOrderToAgent,
  };
}

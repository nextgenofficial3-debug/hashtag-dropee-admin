import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminAgent {
  id: string;
  agent_code: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  vehicle: string;
  is_verified: boolean;
  avatar_url: string | null;
  total_deliveries: number | null;
  total_earnings: number | null;
  average_rating: number | null;
  created_at: string;
  availability_status: string | null;
  last_seen: string | null;
}

export function useAllAgents() {
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    const { data: agentData } = await supabase
      .from("delivery_agents")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: availData } = await supabase
      .from("agent_availability")
      .select("agent_id, status, last_seen");

    const availMap: Record<string, { status: string; last_seen: string | null }> = {};
    (availData || []).forEach((a) => {
      availMap[a.agent_id] = { status: a.status, last_seen: a.last_seen };
    });

    const merged: AdminAgent[] = (agentData || []).map((agent) => ({
      ...agent,
      availability_status: availMap[agent.id]?.status ?? null,
      last_seen: availMap[agent.id]?.last_seen ?? null,
    }));

    setAgents(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchAgents();

    const channel = supabase
      .channel("admin-agents")
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_availability" }, fetchAgents)
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_agents" }, fetchAgents)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleVerified = async (agentId: string, verified: boolean) => {
    const { error } = await supabase
      .from("delivery_agents")
      .update({ is_verified: verified })
      .eq("id", agentId);
    if (!error) await fetchAgents();
    return { success: !error };
  };

  return { agents, loading, refetch: fetchAgents, toggleVerified };
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SystemStats {
  totalDeliveries: number;
  activeDeliveries: number;
  pendingDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  deliveryRevenue: number;
  totalAgents: number;
  onlineAgents: number;
  offlineAgents: number;
  busyAgents: number;
  totalMfcOrders: number;
  mfcRevenue: number;
  pendingMfcOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalVendors: number;
}

interface DeliveryRow { status: string; total_fee: number | null }
interface MfcOrderRow { status: string; total: number }
interface AvailRow { status: string }

export function useSystemStats() {
  const [stats, setStats] = useState<SystemStats>({
    totalDeliveries: 0, activeDeliveries: 0, pendingDeliveries: 0,
    completedDeliveries: 0, cancelledDeliveries: 0, deliveryRevenue: 0,
    totalAgents: 0, onlineAgents: 0, offlineAgents: 0, busyAgents: 0,
    totalMfcOrders: 0, mfcRevenue: 0, pendingMfcOrders: 0,
    totalRevenue: 0, totalCustomers: 0, totalVendors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const [
        { data: deliveries },
        { data: agents },
        { data: availability },
        mfcResult,
        { data: customers },
        { data: vendors },
      ] = await Promise.all([
        supabase.from("delivery_orders").select("status, total_fee"),
        supabase.from("delivery_agents").select("id"),
        supabase.from("agent_availability").select("status"),
        supabase.from("orders").select("status, total").then((r) => r),
        supabase.from("customers").select("id"),
        supabase.from("vendors").select("id"),
      ]);

      const deliveriesArr: DeliveryRow[] = (deliveries as DeliveryRow[]) || [];
      const availabilityArr: AvailRow[] = (availability as AvailRow[]) || [];
      const mfcArr: MfcOrderRow[] = mfcResult.error ? [] : ((mfcResult.data as MfcOrderRow[]) || []);

      const deliveryRevenue = deliveriesArr.reduce((sum, o) => sum + (o.total_fee || 0), 0);
      const mfcRevenue = mfcArr.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

      setStats({
        totalDeliveries: deliveriesArr.length,
        activeDeliveries: deliveriesArr.filter((o) =>
          ["accepted", "en_route_pickup", "arrived_pickup", "picked_up", "in_transit", "arrived_delivery"].includes(o.status)
        ).length,
        pendingDeliveries: deliveriesArr.filter((o) => o.status === "pending_assignment").length,
        completedDeliveries: deliveriesArr.filter((o) => o.status === "delivered").length,
        cancelledDeliveries: deliveriesArr.filter((o) => o.status === "cancelled").length,
        deliveryRevenue,
        totalAgents: (agents || []).length,
        onlineAgents: availabilityArr.filter((a) => a.status === "online").length,
        offlineAgents: availabilityArr.filter((a) => a.status === "offline").length,
        busyAgents: availabilityArr.filter((a) => a.status === "busy").length,
        totalMfcOrders: mfcArr.length,
        mfcRevenue,
        pendingMfcOrders: mfcArr.filter((o) => o.status === "pending").length,
        totalRevenue: deliveryRevenue + mfcRevenue,
        totalCustomers: (customers || []).length,
        totalVendors: (vendors || []).length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error, refetch: fetchStats };
}

-- ============================================================
-- Admin: Agent Bonus + Delivery Order Assignment Support
-- ============================================================

-- 1. Agent bonuses historical table
CREATE TABLE IF NOT EXISTS public.agent_bonuses (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    uuid        NOT NULL REFERENCES public.delivery_agents(id) ON DELETE CASCADE,
  amount      numeric     NOT NULL,
  notes       text,
  granted_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_bonuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_bonuses" ON public.agent_bonuses;
CREATE POLICY "admin_all_bonuses" ON public.agent_bonuses
  FOR ALL USING (true) WITH CHECK (true);

-- 2. Add agent_user_id to delivery_orders so agents can be assigned and see orders
ALTER TABLE public.delivery_orders ADD COLUMN IF NOT EXISTS agent_user_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_agent_user_id ON public.delivery_orders(agent_user_id);

-- 3. Enable realtime for delivery_orders (required for agent live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_bonuses;

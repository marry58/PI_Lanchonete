-- Cria tabela de pedidos e itens, com vínculo ao usuário (auth) e à tabela usuario
-- Rodar no Supabase SQL Editor

-- função utilitária para updated_at (cria apenas se não existir)
CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabela pedidos (principal)
CREATE TABLE IF NOT EXISTS public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES public.usuario(id) ON DELETE SET NULL,
  auth_user_id uuid NULL, -- id do auth.users (quando disponível)
  total numeric(12,2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'pending', -- pending | confirmed | preparing | delivered | cancelled
  address text,
  payment_method text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_timestamp_pedidos ON public.pedidos;
CREATE TRIGGER set_timestamp_pedidos
BEFORE UPDATE ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON public.pedidos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_auth_user ON public.pedidos (auth_user_id);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS public.pedido_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE CASCADE,
  product_id uuid NULL, -- opcional: vinculo com products.id
  title text,
  price numeric(10,2) NOT NULL DEFAULT 0.00,
  qty integer NOT NULL DEFAULT 1 CHECK (qty > 0),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_timestamp_pedido_items ON public.pedido_items;
CREATE TRIGGER set_timestamp_pedido_items
BEFORE UPDATE ON public.pedido_items
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON public.pedido_items (pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_product ON public.pedido_items (product_id);

-- Habilita RLS e cria políticas mínimas (permite que usuário autenticado manipule apenas seus pedidos)
-- Atenção: se você não usa RLS, pode pular a seção abaixo. Policies requerem que auth.uid() esteja disponível (Supabase Auth).

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_items ENABLE ROW LEVEL SECURITY;

-- Permite que usuários autenticados INSEREM pedidos (auth.uid() deve existir)
CREATE POLICY "pedidos_insert_authenticated" ON public.pedidos
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (auth.uid() = auth_user_id OR auth_user_id IS NULL));

-- Permite que usuário selecione/atualize seus próprios pedidos
CREATE POLICY "pedidos_select_owner" ON public.pedidos
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "pedidos_update_owner" ON public.pedidos
  FOR UPDATE USING (auth.uid() = auth_user_id) WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "pedidos_delete_owner" ON public.pedidos
  FOR DELETE USING (auth.uid() = auth_user_id);

-- Para pedido_items: permite operações somente quando o pedido pertence ao usuário autenticado
CREATE POLICY "pedido_items_insert_if_parent_owner" ON public.pedido_items
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_items.pedido_id AND p.auth_user_id = auth.uid()));

CREATE POLICY "pedido_items_select_if_parent_owner" ON public.pedido_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_items.pedido_id AND p.auth_user_id = auth.uid()));

CREATE POLICY "pedido_items_update_if_parent_owner" ON public.pedido_items
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_items.pedido_id AND p.auth_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_items.pedido_id AND p.auth_user_id = auth.uid()));

CREATE POLICY "pedido_items_delete_if_parent_owner" ON public.pedido_items
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_items.pedido_id AND p.auth_user_id = auth.uid()));

-- Exemplo de view útil: resumo do pedido com total calculado
CREATE OR REPLACE VIEW public.v_pedido_totais AS
SELECT
  p.id AS pedido_id,
  p.usuario_id,
  p.auth_user_id,
  p.status,
  p.created_at,
  COALESCE(SUM(pi.price * pi.qty), 0)::numeric(12,2) AS total,
  COUNT(pi.*) AS items_count
FROM public.pedidos p
LEFT JOIN public.pedido_items pi ON pi.pedido_id = p.id
GROUP BY p.id, p.usuario_id, p.auth_user_id, p.status, p.created_at;

-- Fim do script

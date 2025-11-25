-- 1) função de timestamp (cria/substitui se necessário)
CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) função is_admin(uid) — verifica campo metadata na tabela usuario
--    Checa se usuario.auth_user_id = uid e se metadata.role = 'admin' ou metadata.is_admin = 'true'
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean AS $$
DECLARE
  cnt int;
BEGIN
  SELECT COUNT(*) INTO cnt
  FROM public.usuario u
  WHERE u.auth_user_id = uid
    AND (
      COALESCE(u.metadata->>'role','') = 'admin'
      OR COALESCE(u.metadata->>'is_admin','false') = 'true'
    );
  RETURN cnt > 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3) tabela adm_pedidos (registro/auditoria/ação administrativa sobre pedidos)
CREATE TABLE IF NOT EXISTS public.adm_pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE CASCADE,
  admin_user_id uuid NULL,       -- auth.users.id do administrador que realizou a ação
  usuario_id uuid NULL,          -- opcional: vínculo à tabela usuario (quem solicitou o pedido)
  action text NOT NULL,          -- ex: 'update_status' | 'assign' | 'cancel' | 'note'
  note text,                     -- observação adicional
  status text,                   -- novo status aplicado (opcional)
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- trigger para updated_at
DROP TRIGGER IF EXISTS set_timestamp_adm_pedidos ON public.adm_pedidos;
CREATE TRIGGER set_timestamp_adm_pedidos
BEFORE UPDATE ON public.adm_pedidos
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

-- índices úteis
CREATE INDEX IF NOT EXISTS idx_adm_pedidos_pedido ON public.adm_pedidos (pedido_id);
CREATE INDEX IF NOT EXISTS idx_adm_pedidos_admin ON public.adm_pedidos (admin_user_id);
CREATE INDEX IF NOT EXISTS idx_adm_pedidos_usuario ON public.adm_pedidos (usuario_id);

-- 4) Habilita RLS e cria políticas para que apenas administradores possam operar
ALTER TABLE public.adm_pedidos ENABLE ROW LEVEL SECURITY;

-- Permitir SELECT apenas para administradores
CREATE POLICY "adm_pedidos_select_admin" ON public.adm_pedidos
  FOR SELECT
  USING ( public.is_admin(auth.uid()) );

-- Permitir INSERT apenas para administradores
CREATE POLICY "adm_pedidos_insert_admin" ON public.adm_pedidos
  FOR INSERT
  WITH CHECK ( public.is_admin(auth.uid()) );

-- Permitir UPDATE apenas para administradores
CREATE POLICY "adm_pedidos_update_admin" ON public.adm_pedidos
  FOR UPDATE
  USING ( public.is_admin(auth.uid()) )
  WITH CHECK ( public.is_admin(auth.uid()) );

-- Permitir DELETE apenas para administradores
CREATE POLICY "adm_pedidos_delete_admin" ON public.adm_pedidos
  FOR DELETE
  USING ( public.is_admin(auth.uid()) );

-- 5) Exemplo de uso (executar via client supabase autenticado como admin):
-- INSERT INTO public.adm_pedidos (pedido_id, admin_user_id, action, note, status)
-- VALUES ('<pedido-uuid>', auth.uid(), 'update_status', 'Mudou status para preparando', 'preparing');

-- Observações:
-- - As políticas acima dependem da função public.is_admin(uid) que verifica a tabela public.usuario.
--   Garanta que a tabela usuario contenha o campo auth_user_id e que o campo metadata seja usado para marcar administradores
--   (por exemplo: metadata = '{"role":"admin"}' ou '{"is_admin":"true"}').
-- - Caso use outro critério para identificar administradores (por exemplo, uma coluna role na tabela usuario),
--   adapte a função public.is_admin(uid) conforme necessário.
-- - Se desejar permitir que o service_role (chave de servidor) faça operações sem RLS, essa chave deve ser usada apenas no backend seguro.
-- FIM

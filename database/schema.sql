-- Extensões úteis
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de perfis (com vínculo opcional ao auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- se for vincular a auth.users, use o mesmo id
  auth_user_id uuid NULL, -- opcional: id em auth.users caso utilize Supabase Auth
  full_name text,
  email text UNIQUE,
  phone text,
  role text DEFAULT 'user',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger simples para atualizar updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON public.profiles;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Tabela de escolas/unidades
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  cnpj varchar(20) NOT NULL,
  cep varchar(10),
  code varchar(64),
  city text,
  extra jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- atualizar updated_at para schools
DROP TRIGGER IF EXISTS set_timestamp_schools ON public.schools;
CREATE TRIGGER set_timestamp_schools
BEFORE UPDATE ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_schools_cnpj ON public.schools (cnpj);
CREATE INDEX IF NOT EXISTS idx_schools_code ON public.schools (code);

-- Tabela de produtos (itens do cardápio)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  category text,
  price numeric(10,2) NOT NULL DEFAULT 0.00,
  price_label text,
  image_url text,
  slug text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_timestamp_products ON public.products;
CREATE TRIGGER set_timestamp_products
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_products_school ON public.products (school_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);

-- Carrinho temporário / pedido em construção
CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- ou auth.users(id)
  status text NOT NULL DEFAULT 'open', -- open | ordered | cancelled
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_timestamp_carts ON public.carts;
CREATE TRIGGER set_timestamp_carts
BEFORE UPDATE ON public.carts
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_carts_profile ON public.carts (profile_id);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  title text,
  price numeric(10,2) NOT NULL DEFAULT 0.00,
  qty integer NOT NULL DEFAULT 1 CHECK (qty > 0),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_timestamp_cart_items ON public.cart_items;
CREATE TRIGGER set_timestamp_cart_items
BEFORE UPDATE ON public.cart_items
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items (cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON public.cart_items (product_id);

-- Opcional: tabela de pedidos finais (orders) + order_items
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  total numeric(12,2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'pending', -- pending | confirmed | delivered | cancelled
  address text,
  payment_method text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_timestamp_orders ON public.orders;
CREATE TRIGGER set_timestamp_orders
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  title text,
  price numeric(10,2) NOT NULL DEFAULT 0.00,
  qty integer NOT NULL DEFAULT 1 CHECK (qty > 0),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items (order_id);

-- Views/examples úteis
CREATE OR REPLACE VIEW public.v_cart_totals AS
SELECT
  c.id AS cart_id,
  c.profile_id,
  c.status,
  SUM(ci.price * ci.qty)::numeric(12,2) AS total,
  COUNT(ci.*) AS items_count
FROM public.carts c
LEFT JOIN public.cart_items ci ON ci.cart_id = c.id
GROUP BY c.id, c.profile_id, c.status;

-- Política de segurança (RLS) deve ser adicionada conforme necessidade no Supabase:
-- Exemplo (aplicar somente se quiser habilitar RLS):
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Profiles: owner" ON public.profiles FOR ALL USING (auth.uid() = auth_user_id);

-- FIM do script

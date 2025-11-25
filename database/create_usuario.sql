CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- recomendado usar id do auth.users
  auth_user_id uuid NULL, -- opcional: id em auth.users (se usar Supabase Auth)
  nome text,
  email text UNIQUE,
  cpf varchar(20),
  cep varchar(12),
  unidade text,
  nasc date,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_usuario ON public.usuario;
CREATE TRIGGER set_timestamp_usuario
BEFORE UPDATE ON public.usuario
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

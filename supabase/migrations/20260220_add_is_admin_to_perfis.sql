-- Adiciona a coluna is_admin na tabela perfis se ela não existir
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Comentário para documentação
COMMENT ON COLUMN public.perfis.is_admin IS 'Indica se o usuário possui privilégios de administrador';

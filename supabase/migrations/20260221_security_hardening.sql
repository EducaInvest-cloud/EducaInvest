-- =================================================================================
-- SECURITY HARDENING - EducaInvest
-- Este script implementa 3 melhorias de segurança:
-- 1. Funções RPC server-side para XP (impede manipulação pelo cliente)
-- 2. Policy de UPDATE restritiva (bloqueia alteração de xp_total, current_level, is_admin)
-- 3. View ranking_publico (esconde email e dados sensíveis)
-- =================================================================================

-- =============================================
-- 1. FUNÇÃO RPC: add_user_xp
-- Adiciona XP ao usuário de forma segura, com validações
-- SECURITY DEFINER = roda com privilégios do criador (bypassa RLS)
-- =============================================
CREATE OR REPLACE FUNCTION public.add_user_xp(p_user_id UUID, p_amount INT)
RETURNS VOID AS $$
BEGIN
    -- Validações de segurança
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'user_id é obrigatório';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'amount deve ser positivo';
    END IF;

    IF p_amount > 1000 THEN
        RAISE EXCEPTION 'amount máximo por chamada é 1000';
    END IF;

    -- Verifica se o usuário autenticado é o mesmo do parâmetro
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Você só pode adicionar XP ao seu próprio perfil';
    END IF;

    -- Incremento atômico (seguro contra race conditions)
    UPDATE public.perfis
    SET xp_total = COALESCE(xp_total, 0) + p_amount
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. FUNÇÃO RPC: reset_user_xp
-- Zera o XP do usuário (para a funcionalidade de reset no perfil)
-- =============================================
CREATE OR REPLACE FUNCTION public.reset_user_xp(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'user_id é obrigatório';
    END IF;

    -- Verifica se o usuário autenticado é o mesmo do parâmetro
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Você só pode resetar seu próprio XP';
    END IF;

    UPDATE public.perfis
    SET xp_total = 0, current_level = 'Iniciante'
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. POLICY DE UPDATE RESTRITIVA
-- Bloqueia alteração direta de xp_total, current_level e is_admin pelo cliente
-- Agora o UPDATE só funciona se esses campos NÃO mudarem
-- =============================================

-- Remove a policy antiga
DROP POLICY IF EXISTS "Users can update own profile" ON public.perfis;

-- Cria nova policy restritiva:
-- O usuário só pode fazer UPDATE no próprio perfil E
-- os campos xp_total, current_level e is_admin devem permanecer inalterados
CREATE POLICY "Users can update own profile restricted"
ON public.perfis FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id
    AND xp_total IS NOT DISTINCT FROM (SELECT xp_total FROM public.perfis WHERE id = auth.uid())
    AND current_level IS NOT DISTINCT FROM (SELECT current_level FROM public.perfis WHERE id = auth.uid())
    AND COALESCE(is_admin, false) IS NOT DISTINCT FROM (SELECT COALESCE(is_admin, false) FROM public.perfis WHERE id = auth.uid())
);

-- =============================================
-- 4. VIEW ranking_publico
-- Expõe apenas os dados necessários para o ranking público
-- NÃO expõe: email, is_admin, criado_em
-- =============================================
DROP VIEW IF EXISTS public.ranking_publico;

CREATE VIEW public.ranking_publico AS
SELECT
    id,
    nome_completo,
    url_avatar,
    COALESCE(xp_total, 0) AS xp_total,
    COALESCE(current_level, 'Iniciante') AS current_level
FROM public.perfis
ORDER BY xp_total DESC;

-- Permissões para que todos possam ler a view
GRANT SELECT ON public.ranking_publico TO anon, authenticated;

-- =============================================
-- VERIFICAÇÃO (para o usuário ver o resultado)
-- =============================================
SELECT 'Segurança aplicada com sucesso!' AS status;
SELECT * FROM pg_policies WHERE tablename = 'perfis';

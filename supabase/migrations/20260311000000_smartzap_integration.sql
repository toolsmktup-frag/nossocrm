-- =============================================================================
-- SmartZap Integration
-- =============================================================================
-- Tabelas para integração NossoCRM × SmartZap (WhatsApp via Meta Cloud API)

-- -----------------------------------------------------------------------------
-- 1. smartzap_config — 1 registro por organização
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.smartzap_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    base_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id)
);

ALTER TABLE public.smartzap_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read smartzap_config"
    ON public.smartzap_config FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "org admins can write smartzap_config"
    ON public.smartzap_config FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- -----------------------------------------------------------------------------
-- 2. smartzap_automations — por etapa do board
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.smartzap_automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    board_stage_id TEXT NOT NULL,
    template_id TEXT NOT NULL,
    template_name TEXT,
    variable_mappings JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.smartzap_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read smartzap_automations"
    ON public.smartzap_automations FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "org admins can write smartzap_automations"
    ON public.smartzap_automations FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- -----------------------------------------------------------------------------
-- 3. smartzap_dispatch_logs — observabilidade
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.smartzap_dispatch_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    automation_id UUID REFERENCES public.smartzap_automations(id) ON DELETE SET NULL,
    deal_id TEXT NOT NULL,
    contact_phone TEXT,
    template_id TEXT,
    payload JSONB,
    response_status INTEGER,
    response_body JSONB,
    error TEXT,
    dispatched_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.smartzap_dispatch_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org admins can read smartzap_dispatch_logs"
    ON public.smartzap_dispatch_logs FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Service role (backend) can insert logs
CREATE POLICY "service role can insert smartzap_dispatch_logs"
    ON public.smartzap_dispatch_logs FOR INSERT
    WITH CHECK (true);

-- Index para queries por deal
CREATE INDEX IF NOT EXISTS idx_smartzap_logs_deal_id
    ON public.smartzap_dispatch_logs (deal_id);
CREATE INDEX IF NOT EXISTS idx_smartzap_logs_org_dispatched
    ON public.smartzap_dispatch_logs (organization_id, dispatched_at DESC);

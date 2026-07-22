-- ============================================================
-- CRM Pipeline — Tabla de prospectos de fumigación
-- ============================================================

create table if not exists public.crm_prospects (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  company_name    text not null,
  tier            text not null default 'C'
                  check (tier in ('S','A','B','C','D')),
  stage           text not null default 'identificado'
                  check (stage in ('identificado','contactado','respondio','demo_agendada','demo_completada','propuesta_enviada','cerrado_ganado','cerrado_perdido','follow_up')),
  city            text,
  state           text,
  region          text,
  phone           text,
  whatsapp        text,
  email           text,
  website         text,
  facebook        text,
  address         text,
  icp_score       integer not null default 0,
  has_whatsapp    boolean not null default false,
  has_website     boolean not null default false,
  has_facebook    boolean not null default false,
  is_franchise    boolean not null default false,
  is_multi_state  boolean not null default false,
  is_industrial   boolean not null default false,
  notes           text,
  source          text,
  contact_date    date,
  next_action     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists crm_tenant_id_idx  on public.crm_prospects(tenant_id);
create index if not exists crm_stage_idx      on public.crm_prospects(stage);
create index if not exists crm_tier_idx       on public.crm_prospects(tier);
create index if not exists crm_city_idx       on public.crm_prospects(city);
create index if not exists crm_score_idx      on public.crm_prospects(icp_score desc);

-- RLS
alter table public.crm_prospects enable row level security;

create policy "crm: read own tenant"
  on public.crm_prospects for select
  using (tenant_id in (select public.current_user_tenant_ids()));

create policy "crm: insert own tenant"
  on public.crm_prospects for insert
  with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "crm: update own tenant"
  on public.crm_prospects for update
  using (tenant_id in (select public.current_user_tenant_ids()));

create policy "crm: delete own tenant"
  on public.crm_prospects for delete
  using (tenant_id in (select public.current_user_tenant_ids()));

-- updated_at trigger (create function if not exists)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.crm_prospects;
create trigger set_updated_at before update on public.crm_prospects
  for each row execute function public.set_updated_at();

-- Realtime
alter publication supabase_realtime add table public.crm_prospects;

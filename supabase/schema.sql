-- ============================================================
-- Atlas Hub — Database Schema (Sprint 1 baseline)
-- ============================================================
-- Multi-tenant SaaS schema with RLS on every table.
-- All tenant-scoped tables carry tenant_id and enforce isolation
-- via Row Level Security policies.
--
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- ──────────────────────────────────────────────
-- Extensions
-- ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────
-- Tenants (workspaces) — top of the hierarchy
-- ──────────────────────────────────────────────
create table if not exists public.tenants (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  slug            text unique not null,
  logo_url        text,
  plan            text not null default 'free'
                  check (plan in ('free','pro','team','agency')),
  stripe_customer_id      text,
  stripe_subscription_id  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- Users are managed by Supabase Auth (auth.users).
-- Tenant memberships link auth users to tenants with roles.
-- ──────────────────────────────────────────────
create table if not exists public.tenant_memberships (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  role        text not null default 'member'
              check (role in ('owner','admin','member','viewer')),
  created_at  timestamptz not null default now(),
  unique (user_id, tenant_id)
);

-- ──────────────────────────────────────────────
-- Clients — optional grouping under a tenant
-- ──────────────────────────────────────────────
create table if not exists public.clients (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  name          text not null,
  logo_url      text,
  contact_email text,
  contact_phone text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- Projects — core entity
-- ──────────────────────────────────────────────
create table if not exists public.projects (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  client_id     uuid references public.clients(id) on delete set null,
  name          text not null,
  description   text,
  status        text not null default 'active'
                check (status in ('active','paused','completed','archived')),
  color         text default '#4f46e5',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists projects_tenant_id_idx     on public.projects(tenant_id);
create index if not exists projects_client_id_idx     on public.projects(client_id);
create index if not exists projects_status_idx        on public.projects(status);

-- ──────────────────────────────────────────────
-- Files — metadata for objects stored in Supabase Storage
-- ──────────────────────────────────────────────
create table if not exists public.files (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  project_id      uuid references public.projects(id) on delete cascade,
  name            text not null,
  type            text not null check (type in ('document','image','video','audio','other')),
  mime_type       text,
  storage_path    text not null,    -- path in Supabase Storage bucket
  size_bytes      bigint not null default 0,
  uploaded_by     uuid references auth.users(id),
  created_at      timestamptz not null default now()
);

create index if not exists files_tenant_id_idx     on public.files(tenant_id);
create index if not exists files_project_id_idx    on public.files(project_id);
create index if not exists files_type_idx          on public.files(type);

-- ──────────────────────────────────────────────
-- Tasks — lightweight task tracking per project
-- ──────────────────────────────────────────────
create table if not exists public.tasks (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  project_id    uuid references public.projects(id) on delete cascade,
  title         text not null,
  description   text,
  status        text not null default 'todo'
                check (status in ('todo','in_progress','review','done','blocked')),
  priority      text not null default 'medium'
                check (priority in ('low','medium','high','urgent')),
  assigned_to   uuid references auth.users(id),
  due_date      date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists tasks_tenant_id_idx     on public.tasks(tenant_id);
create index if not exists tasks_project_id_idx    on public.tasks(project_id);
create index if not exists tasks_status_idx        on public.tasks(status);

-- ──────────────────────────────────────────────
-- Activity events — real-time feed source
-- ──────────────────────────────────────────────
create table if not exists public.activity_events (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  project_id    uuid references public.projects(id) on delete cascade,
  type          text not null
                check (type in ('project_created','project_updated','file_uploaded',
                                'task_created','task_completed','task_blocked',
                                'agent_message','agent_started','agent_completed',
                                'client_created','member_added')),
  payload       jsonb not null default '{}'::jsonb,
  actor         text,    -- 'user:<id>' | 'agent:hermes' | 'system'
  created_at    timestamptz not null default now()
);

create index if not exists activity_tenant_id_idx     on public.activity_events(tenant_id);
create index if not exists activity_project_id_idx    on public.activity_events(project_id);
create index if not exists activity_created_at_idx    on public.activity_events(created_at desc);

-- ──────────────────────────────────────────────
-- Agent messages — chat with Hermes
-- ──────────────────────────────────────────────
create table if not exists public.agent_messages (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  project_id    uuid references public.projects(id) on delete cascade,
  direction     text not null check (direction in ('outbound','inbound')),
                -- outbound = user → agent, inbound = agent → user
  content       text not null,
  status        text not null default 'sent'
                check (status in ('sent','queued','processing','completed','error')),
  created_at    timestamptz not null default now()
);

create index if not exists agent_messages_tenant_id_idx   on public.agent_messages(tenant_id);
create index if not exists agent_messages_project_id_idx  on public.agent_messages(project_id);

-- ──────────────────────────────────────────────
-- updated_at triggers
-- ──────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  for t in select unnest(array['tenants','clients','projects','tasks'])
  loop
    execute format($f$
      drop trigger if exists set_updated_at on public.%I;
      create trigger set_updated_at before update on public.%I
      for each row execute function public.set_updated_at();
    $f$, t, t);
  end loop;
end $$;

-- ============================================================
-- Row Level Security
-- ============================================================
-- A user can only see rows in tenants they belong to.
-- Service role bypasses RLS (server-side admin operations only).

alter table public.tenants              enable row level security;
alter table public.tenant_memberships   enable row level security;
alter table public.clients              enable row level security;
alter table public.projects             enable row level security;
alter table public.files                enable row level security;
alter table public.tasks                enable row level security;
alter table public.activity_events      enable row level security;
alter table public.agent_messages       enable row level security;

-- Helper: tenant_ids the current user belongs to
create or replace function public.current_user_tenant_ids()
returns setof uuid language sql security definer stable as $$
  select tenant_id from public.tenant_memberships where user_id = auth.uid();
$$;

-- Tenants: user can see tenants they belong to
create policy "tenants: read own"
  on public.tenants for select
  using (id in (select public.current_user_tenant_ids()));

-- Memberships: user can see memberships in their tenants
create policy "memberships: read own tenant"
  on public.tenant_memberships for select
  using (tenant_id in (select public.current_user_tenant_ids()));

-- Clients / Projects / Files / Tasks / Activity / AgentMessages
-- all follow the same pattern: tenant_id must be in user's tenant set.
do $$
declare tbl text;
begin
  for tbl in select unnest(array['clients','projects','files','tasks','activity_events','agent_messages'])
  loop
    execute format($f$
      create policy "%I: read own tenant"   on public.%I for select using (tenant_id in (select public.current_user_tenant_ids()));
      create policy "%I: insert own tenant" on public.%I for insert with check (tenant_id in (select public.current_user_tenant_ids()));
      create policy "%I: update own tenant" on public.%I for update using (tenant_id in (select public.current_user_tenant_ids()));
      create policy "%I: delete own tenant" on public.%I for delete using (tenant_id in (select public.current_user_tenant_ids()));
    $f$,
    tbl, tbl,  -- read
    tbl, tbl,  -- insert
    tbl, tbl,  -- update
    tbl, tbl); -- delete
  end loop;
end $$;

-- ============================================================
-- Realtime — enable for tables that should push updates
-- ============================================================
alter publication supabase_realtime add table public.activity_events;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.files;
alter publication supabase_realtime add table public.agent_messages;

-- ============================================================
-- Storage bucket for project files
-- ============================================================
insert into storage.buckets (id, name, public)
values ('atlas-files', 'atlas-files', false)
on conflict (id) do nothing;

-- Storage RLS: user can only access files in their tenant's path
-- Path convention: tenants/<tenant_id>/projects/<project_id>/<filename>
create policy "storage: read own tenant files"
  on storage.objects for select
  using (
    bucket_id = 'atlas-files'
    and (storage.foldername(name))[1] in (
      select replace(tenant_id::text, '-', '') from public.current_user_tenant_ids()
    )
  );

create policy "storage: write own tenant files"
  on storage.objects for insert
  with check (
    bucket_id = 'atlas-files'
    and (storage.foldername(name))[1] in (
      select replace(tenant_id::text, '-', '') from public.current_user_tenant_ids()
    )
  );

-- ============================================================
-- Initial seed: GlennGO tenant (will be linked to Glenn's auth user
-- after first signup via a trigger or manual SQL)
-- ============================================================
insert into public.tenants (id, name, slug, plan)
values (
  '00000000-0000-0000-0000-000000000001',
  'GlennGO',
  'glenn-go',
  'agency'
) on conflict do nothing;

-- Done. Next: after creating auth user for Glenn, run:
-- insert into tenant_memberships (user_id, tenant_id, role)
-- values ('<glenn-auth-uuid>', '00000000-0000-0000-0000-000000000001', 'owner');

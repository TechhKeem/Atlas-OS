-- Breeze Review schema. Postgres is the source of truth.
-- RLS is enabled on every table with NO policies: anon/authenticated roles get
-- zero access. The app talks to the database only from server code using the
-- service-role key (which bypasses RLS). Never ship that key to the client.

create extension if not exists pgcrypto;

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  session_token_hash text not null,
  state text,
  unsupported_state boolean not null default false,
  path text check (path in ('A','B')),
  depth text check (depth in ('general','detailed')),
  full_name text,
  email text,
  phone text,
  answers jsonb not null default '{}'::jsonb,
  utm jsonb not null default '{}'::jsonb,
  referrer text,
  lead_score integer not null default 0,
  score_components jsonb not null default '{}'::jsonb,
  headline text,
  status text not null default 'started'
    check (status in ('started','waitlist','completed')),
  booking_status text not null default 'none'
    check (booking_status in ('none','clicked','scheduled','canceled')),
  sheet_synced_at timestamptz,
  sheet_attempts integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_email_idx on public.leads (lower(email));
create index leads_created_idx on public.leads (created_at);
create index leads_sheet_pending_idx on public.leads (status) where sheet_synced_at is null;

create table public.policy_extractions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  storage_path text not null,
  original_type text,
  size_bytes bigint,
  status text not null default 'pending'
    check (status in ('pending','extracted','unreadable','failed')),
  extracted jsonb,
  uploaded_at timestamptz not null default now(),
  document_deleted_at timestamptz
);
create index policy_extractions_lead_idx on public.policy_extractions (lead_id);
create index policy_extractions_retention_idx on public.policy_extractions (uploaded_at)
  where document_deleted_at is null;

create table public.dime_inputs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  inputs jsonb not null,
  created_at timestamptz not null default now()
);

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  path text not null,
  headline text,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index chat_messages_lead_idx on public.chat_messages (lead_id, created_at);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  consent_text text not null,
  consent_version text not null,
  consented_at timestamptz not null default now(),
  ip text,
  user_agent text
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  calendly_event_uri text unique,
  invitee_email text,
  status text not null default 'scheduled',
  scheduled_for timestamptz,
  raw jsonb,
  created_at timestamptz not null default now()
);

create table public.events (
  id bigserial primary key,
  lead_id uuid references public.leads(id) on delete cascade,
  name text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index events_name_idx on public.events (name, created_at);

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);

-- Atomic fixed-window limiter. Returns true if the call is allowed.
create or replace function public.hit_rate_limit(p_key text, p_window_seconds integer, p_max integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  h integer;
begin
  insert into public.rate_limits as r (key, window_start, hits) values (p_key, w, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning r.hits into h;
  delete from public.rate_limits where window_start < now() - interval '1 day';
  return h <= p_max;
end $$;
revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger leads_touch before update on public.leads
  for each row execute function public.touch_updated_at();

-- RLS: enabled everywhere, deliberately no policies (deny by default).
alter table public.leads enable row level security;
alter table public.policy_extractions enable row level security;
alter table public.dime_inputs enable row level security;
alter table public.analyses enable row level security;
alter table public.chat_messages enable row level security;
alter table public.consents enable row level security;
alter table public.bookings enable row level security;
alter table public.events enable row level security;
alter table public.rate_limits enable row level security;

-- Private bucket for uploaded policy documents. No storage policies are
-- created, so only the service role (server) can read or write; staff get
-- short-lived signed URLs generated server-side.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('policy-docs', 'policy-docs', false, 20971520,
        array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public = false;

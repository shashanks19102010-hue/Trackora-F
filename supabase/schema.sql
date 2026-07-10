-- TRACKORA database schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- Row Level Security is the enforcement point for the whole consent model:
-- a user's location is never readable by anyone until an invite between the
-- two accounts has status = 'accepted'.

create extension if not exists "pgcrypto";

-- ---------- Profiles ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  avatar_config jsonb, -- structured config for the built-in avatar builder (skin, hair, eyes, etc.)
  phone text, -- optional, only used so others can invite this account
  two_factor_enabled boolean not null default false,
  two_factor_secret text,
  two_factor_pending_secret text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can view profiles of accepted connections"
  on profiles for select using (
    exists (
      select 1 from connections c
      where c.status = 'accepted'
        and ((c.owner_id = auth.uid() and c.connected_user_id = profiles.id)
          or (c.connected_user_id = auth.uid() and c.owner_id = profiles.id))
    )
  );

-- ---------- Invites / Connections ----------
-- An invite is created by `owner_id` targeting a phone number. It becomes a
-- two-way `connection` only once the invited person signs in and accepts.
create table if not exists connections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  connected_user_id uuid references profiles(id) on delete cascade,
  invited_phone text,
  invited_email text,
  label text not null,
  relationship text not null check (relationship in ('family','friend','colleague','other')),
  status text not null default 'pending' check (status in ('pending','accepted','declined','revoked')),
  invite_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

alter table connections enable row level security;

create policy "Owner can manage their invites"
  on connections for all using (auth.uid() = owner_id);

create policy "Invited user can view and respond to invites addressed to them"
  on connections for select using (auth.uid() = connected_user_id);

create policy "Invited user can update status of their own invite"
  on connections for update using (auth.uid() = connected_user_id)
  with check (status in ('accepted','declined'));

-- ---------- Devices ----------
create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  platform text not null,
  model text,
  app_version text,
  last_seen_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table devices enable row level security;

create policy "Owner manages own devices"
  on devices for all using (auth.uid() = owner_id);

create policy "Accepted connections can view device metadata"
  on devices for select using (
    exists (
      select 1 from connections c
      where c.status = 'accepted'
        and ((c.owner_id = auth.uid() and c.connected_user_id = devices.owner_id)
          or (c.connected_user_id = auth.uid() and c.owner_id = devices.owner_id))
    )
  );

-- ---------- Location pings & history ----------
create table if not exists location_pings (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references devices(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  accuracy_meters numeric,
  battery_pct smallint,
  captured_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists location_pings_owner_time_idx
  on location_pings (owner_id, captured_at desc);

alter table location_pings enable row level security;

create policy "Owner can insert and view own pings"
  on location_pings for all using (auth.uid() = owner_id);

create policy "Accepted connections can view pings per privacy settings"
  on location_pings for select using (
    exists (
      select 1 from connections c
      join privacy_settings ps on ps.user_id = location_pings.owner_id
      where c.status = 'accepted'
        and c.connected_user_id = auth.uid()
        and c.owner_id = location_pings.owner_id
        and ps.ghost_mode = false
        and ps.share_location_with @> to_jsonb(auth.uid()::text)
    )
  );

-- ---------- Privacy settings ----------
create table if not exists privacy_settings (
  user_id uuid primary key references profiles(id) on delete cascade,
  share_location_with jsonb not null default '[]', -- array of connected_user_id (as text) allowed to view
  precision text not null default 'exact' check (precision in ('exact','approximate','city-only')),
  share_when_active boolean not null default true,
  history_retention_days int not null default 30,
  ghost_mode boolean not null default false, -- "untrack": when true, nobody can see this user's location
  updated_at timestamptz not null default now()
);

alter table privacy_settings enable row level security;

create policy "Owner manages own privacy settings"
  on privacy_settings for all using (auth.uid() = user_id);

-- ---------- Notifications ----------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('invite','invite_accepted','geofence','low_battery','system')),
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "Owner manages own notifications"
  on notifications for all using (auth.uid() = user_id);

-- ---------- Login attempt tracking (brute-force protection) ----------
-- Written to by the server-only admin client from the login Server Action.
-- Never exposed to the client and never readable via the anon key.
create table if not exists login_attempts (
  id uuid primary key default gen_random_uuid(),
  identifier text not null, -- normalized email or IP
  succeeded boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists login_attempts_identifier_time_idx
  on login_attempts (identifier, created_at desc);

alter table login_attempts enable row level security;
-- Intentionally no policies: only the service-role key (server-only) can
-- read or write this table. The anon/authenticated roles get zero access.

-- Looks up a single pending invite by its unguessable token, without granting
-- broad SELECT access to the connections table. This is the only way a
-- not-yet-connected user can see enough to decide whether to accept.
create or replace function get_invite_by_token(p_token uuid)
returns table (
  connection_id uuid,
  owner_id uuid,
  owner_name text,
  label text,
  relationship text,
  status text
) as $$
  select c.id, c.owner_id, p.full_name, c.label, c.relationship, c.status
  from connections c
  join profiles p on p.id = c.owner_id
  where c.invite_token = p_token
  limit 1;
$$ language sql security definer set search_path = public;

revoke all on function get_invite_by_token(uuid) from public;
grant execute on function get_invite_by_token(uuid) to authenticated;

-- Accepts or declines a pending invite. Deliberately NOT exposed as a plain
-- RLS-gated UPDATE: without this, we'd need a policy letting any
-- authenticated user update *any* unclaimed pending row, which would let
-- someone claim invites they were never sent, without ever holding the link.
-- This function instead requires the exact token as an argument, so only
-- someone who actually has the link (or the true recipient after sign-in)
-- can ever call it successfully.
create or replace function accept_invite_by_token(p_token uuid, p_accept boolean)
returns table (success boolean, message text) as $$
declare
  v_connection connections%rowtype;
begin
  select * into v_connection from connections where invite_token = p_token;

  if not found then
    return query select false, 'This invite link is invalid or has expired.';
    return;
  end if;

  if v_connection.owner_id = auth.uid() then
    return query select false, 'You can''t accept your own invite link.';
    return;
  end if;

  if v_connection.status <> 'pending' then
    return query select false, 'This invite has already been used.';
    return;
  end if;

  update connections
  set connected_user_id = auth.uid(),
      status = case when p_accept then 'accepted' else 'declined' end,
      responded_at = now()
  where id = v_connection.id;

  return query select true, 'ok';
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function accept_invite_by_token(uuid, boolean) from public;
grant execute on function accept_invite_by_token(uuid, boolean) to authenticated;

-- ---------- Housekeeping ----------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Auto-create profile + default privacy row when a new auth user signs up.
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'New user'), new.phone);
  insert into public.privacy_settings (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Retention: delete pings older than each user's configured window.
-- Schedule this with pg_cron (Supabase: Database > Cron) e.g. hourly.
create or replace function purge_expired_location_history() returns void as $$
begin
  delete from location_pings lp
  using privacy_settings ps
  where lp.owner_id = ps.user_id
    and lp.captured_at < now() - (ps.history_retention_days || ' days')::interval;
end;
$$ language plpgsql security definer set search_path = public;

-- Playbook U — database schema.
-- Run this in Supabase → SQL Editor → New query → Run.
-- It creates: a profile per user (their plan), a per-user JSON store (playbooks),
-- and an email-keyed TRIAL LEDGER that makes the 1-day free trial truly one-per-email
-- and impossible to reset by clearing the app or deleting/recreating the account.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Profiles: one row per signed-in user.
create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text unique,
  plan               text default '',            -- '', 'trial', 'plus', 'unlimited'
  trial_used         boolean default false,      -- has THIS profile started its trial
  trial_started_at   timestamptz,
  stripe_customer_id text,
  sub_status         text default '',            -- '', 'trialing', 'active', 'past_due', 'canceled'
  current_period_end timestamptz,
  is_admin           boolean default false,      -- set true for YOUR owner account (see ADMIN.md)
  created_at         timestamptz default now()
);

-- 2) Per-user JSON store (playbooks, saved plays, settings) — cross-device sync.
create table if not exists public.user_data (
  user_id    uuid references auth.users(id) on delete cascade,
  key        text not null,
  value      jsonb,
  updated_at timestamptz default now(),
  primary key (user_id, key)
);

-- 3) TRIAL LEDGER — keyed by EMAIL, never deleted, so one email = one lifetime trial.
--    This row survives account deletion, so a coach can't re-trial by deleting and
--    re-signing-up with the same address.
create table if not exists public.trial_ledger (
  email   text primary key,
  used_at timestamptz default now()
);

-- Auto-create a profile when a new user signs up; if the email already has a trial
-- on record, carry that fact onto the new profile immediately.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, trial_used)
  values (new.id, new.email, exists(select 1 from public.trial_ledger l where l.email = new.email))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) start_trial(): the ONLY way to begin a trial. Runs as the signed-in user
--    (auth.uid()), atomically. Records the email in the ledger so it can never be
--    reused. Returns 'started' the first time and 'already_used' forever after.
create or replace function public.start_trial()
returns text language plpgsql security definer as $$
declare
  uid uuid := auth.uid();
  em  text;
  already boolean;
begin
  if uid is null then
    return 'not_signed_in';
  end if;

  select email into em from public.profiles where id = uid;
  if em is null then
    return 'no_profile';
  end if;

  select (trial_used or exists(select 1 from public.trial_ledger l where l.email = em))
    into already from public.profiles where id = uid;

  if already then
    return 'already_used';
  end if;

  insert into public.trial_ledger (email) values (em)
    on conflict (email) do nothing;

  update public.profiles
     set plan = case when plan in ('plus','unlimited') then plan else 'trial' end,
         trial_used = true,
         trial_started_at = now(),
         sub_status = case when sub_status in ('active','trialing') then sub_status else 'trialing' end
   where id = uid;

  return 'started';
end; $$;

-- 5) Row Level Security: each user only sees their own rows.
alter table public.profiles     enable row level security;
alter table public.user_data    enable row level security;
alter table public.trial_ledger enable row level security;  -- no policies => browser can't touch it

drop policy if exists "read own profile"   on public.profiles;
drop policy if exists "update own profile" on public.profiles;
create policy "read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "rw own data" on public.user_data;
create policy "rw own data" on public.user_data
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant execute on function public.start_trial() to authenticated;

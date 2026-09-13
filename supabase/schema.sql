-- Vestalyze public schema.
-- Safe on a new project, or on an existing one: drops app tables then recreates them.
-- Does not drop auth.users.

drop table if exists public.investment_syncs cascade;
drop table if exists public.fund_holdings cascade;
drop table if exists public.investments cascade;
drop table if exists public.funds cascade;
drop table if exists public.securities cascade;
drop table if exists public.profiles cascade;
drop function if exists public.handle_new_user() cascade;
drop type if exists public.scrape_status;
drop type if exists public.fund_type;
drop type if exists public.investment_type;
drop type if exists public.currency_code;
drop type if exists public.country_code;

create extension if not exists pgcrypto;

create type public.country_code as enum ('IN', 'US');
create type public.currency_code as enum ('INR', 'USD');
create type public.investment_type as enum ('mutual_fund', 'etf', 'stock');
create type public.fund_type as enum ('mutual_fund', 'etf');
create type public.scrape_status as enum ('success', 'failed', 'running');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  display_currency public.currency_code not null default 'INR',
  fx_usd_inr numeric not null default 87.25 check (fx_usd_inr > 0),
  fx_as_of date not null default timezone('utc', now())::date,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.securities (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  standardized_name text not null,
  ticker text not null,
  country public.country_code not null,
  currency public.currency_code not null,
  unique (user_id, ticker, country)
);

create index securities_ticker_idx on public.securities (ticker);
create index securities_user_idx on public.securities (user_id);

create table public.funds (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type public.fund_type not null,
  country public.country_code not null,
  currency public.currency_code not null,
  latest_portfolio_date date not null,
  source_url text not null,
  last_scraped_at timestamptz not null
);

create unique index funds_user_source_url_idx
  on public.funds (user_id, source_url)
  where length(trim(source_url)) > 0;

create index funds_user_idx on public.funds (user_id);

create table public.fund_holdings (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  fund_id text not null references public.funds (id) on delete cascade,
  security_id text not null references public.securities (id),
  allocation_percentage numeric(8, 4) not null check (
    allocation_percentage >= 0 and allocation_percentage <= 100
  ),
  holding_date date not null,
  unique (fund_id, security_id, holding_date)
);

create index fund_holdings_fund_idx on public.fund_holdings (fund_id);
create index fund_holdings_user_idx on public.fund_holdings (user_id);

create table public.investments (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users (id) on delete cascade,
  fund_id text references public.funds (id),
  security_id text references public.securities (id),
  name text not null check (char_length(name) between 1 and 120),
  type public.investment_type not null,
  country public.country_code not null,
  currency public.currency_code not null,
  invested_amount numeric not null check (invested_amount > 0),
  source_url text,
  last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index investments_user_idx on public.investments (user_id);

create table public.investment_syncs (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users (id) on delete cascade,
  investment_id text not null references public.investments (id) on delete cascade,
  started_at timestamptz not null default timezone('utc', now()),
  status public.scrape_status not null,
  records_processed integer not null default 0,
  error_message text
);

create index investment_syncs_investment_idx
  on public.investment_syncs (investment_id, started_at desc);
create index investment_syncs_user_idx on public.investment_syncs (user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, display_currency, fx_usd_inr, fx_as_of)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'Investor'),
    'INR',
    87.25,
    (timezone('utc', now()))::date
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

alter table public.profiles enable row level security;
alter table public.securities enable row level security;
alter table public.funds enable row level security;
alter table public.fund_holdings enable row level security;
alter table public.investments enable row level security;
alter table public.investment_syncs enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "securities_select_own" on public.securities
  for select to authenticated using (user_id = auth.uid());

create policy "securities_insert_own" on public.securities
  for insert to authenticated with check (user_id = auth.uid());

create policy "securities_update_own" on public.securities
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "securities_delete_own" on public.securities
  for delete to authenticated using (user_id = auth.uid());

create policy "funds_select_own" on public.funds
  for select to authenticated using (user_id = auth.uid());

create policy "funds_insert_own" on public.funds
  for insert to authenticated with check (user_id = auth.uid());

create policy "funds_update_own" on public.funds
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "funds_delete_own" on public.funds
  for delete to authenticated using (user_id = auth.uid());

create policy "holdings_select_own" on public.fund_holdings
  for select to authenticated using (user_id = auth.uid());

create policy "holdings_insert_own" on public.fund_holdings
  for insert to authenticated with check (user_id = auth.uid());

create policy "holdings_update_own" on public.fund_holdings
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "holdings_delete_own" on public.fund_holdings
  for delete to authenticated using (user_id = auth.uid());

create policy "investments_select_own" on public.investments
  for select to authenticated using (user_id = auth.uid());

create policy "investments_insert_own" on public.investments
  for insert to authenticated with check (user_id = auth.uid());

create policy "investments_update_own" on public.investments
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "investments_delete_own" on public.investments
  for delete to authenticated using (user_id = auth.uid());

create policy "syncs_select_own" on public.investment_syncs
  for select to authenticated using (user_id = auth.uid());

create policy "syncs_insert_own" on public.investment_syncs
  for insert to authenticated with check (user_id = auth.uid());

create policy "syncs_update_own" on public.investment_syncs
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "syncs_delete_own" on public.investment_syncs
  for delete to authenticated using (user_id = auth.uid());

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.investment_syncs where user_id = uid;
  delete from public.fund_holdings where user_id = uid;
  delete from public.investments where user_id = uid;
  delete from public.funds where user_id = uid;
  delete from public.securities where user_id = uid;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;

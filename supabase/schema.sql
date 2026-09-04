-- Look-Through Portfolio — Supabase schema
-- Run this in the Supabase SQL editor (or supabase db push) before seed.sql.
-- Enable Row Level Security on every table. Authenticated users only see their own
-- investments. Catalog tables are readable by any signed-in user.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.country_code as enum ('IN', 'US');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.currency_code as enum ('INR', 'USD');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.investment_type as enum ('mutual_fund', 'etf', 'stock');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.fund_type as enum ('mutual_fund', 'etf');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.data_status as enum ('fresh', 'stale', 'failed', 'pending');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.scrape_status as enum ('success', 'failed', 'running');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.source_type as enum ('indian_mf', 'indian_etf', 'us_etf', 'factsheet');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  display_currency public.currency_code not null default 'INR',
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- Security master
-- ---------------------------------------------------------------------------
create table if not exists public.securities (
  id text primary key,
  company_name text not null,
  standardized_name text not null,
  ticker text not null,
  isin text,
  exchange text not null,
  country public.country_code not null,
  currency public.currency_code not null,
  sector text not null,
  industry text not null
);

create index if not exists securities_ticker_idx on public.securities (ticker);
create index if not exists securities_isin_idx on public.securities (isin);

-- ---------------------------------------------------------------------------
-- Funds / ETFs
-- ---------------------------------------------------------------------------
create table if not exists public.funds (
  id text primary key,
  name text not null,
  symbol text not null,
  type public.fund_type not null,
  fund_house text not null,
  category text not null,
  country public.country_code not null,
  currency public.currency_code not null,
  latest_portfolio_date date not null,
  source_website text not null,
  source_url text not null,
  last_scraped_at timestamptz not null,
  data_status public.data_status not null default 'pending'
);

-- ---------------------------------------------------------------------------
-- Holdings
-- ---------------------------------------------------------------------------
create table if not exists public.fund_holdings (
  id text primary key,
  fund_id text not null references public.funds (id) on delete cascade,
  security_id text not null references public.securities (id),
  allocation_percentage numeric(8, 4) not null check (
    allocation_percentage >= 0 and allocation_percentage <= 100
  ),
  holding_date date not null,
  shares numeric,
  market_value numeric,
  source_id text not null,
  unique (fund_id, security_id, holding_date)
);

create index if not exists fund_holdings_fund_idx on public.fund_holdings (fund_id);

-- ---------------------------------------------------------------------------
-- User investments
-- ---------------------------------------------------------------------------
create table if not exists public.investments (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users (id) on delete cascade,
  fund_id text references public.funds (id),
  security_id text references public.securities (id),
  name text not null check (char_length(name) between 1 and 120),
  type public.investment_type not null,
  country public.country_code not null,
  currency public.currency_code not null,
  invested_amount numeric not null check (invested_amount > 0),
  current_value numeric not null check (current_value >= 0),
  units numeric,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists investments_user_idx on public.investments (user_id);

create table if not exists public.investment_transactions (
  id text primary key default gen_random_uuid()::text,
  investment_id text not null references public.investments (id) on delete cascade,
  transaction_date date not null,
  units numeric,
  purchase_price numeric,
  invested_amount numeric not null check (invested_amount > 0)
);

-- ---------------------------------------------------------------------------
-- Scraping registry
-- ---------------------------------------------------------------------------
create table if not exists public.data_sources (
  id text primary key,
  name text not null,
  url text not null,
  type public.source_type not null,
  last_scraped_at timestamptz not null,
  last_successful_at timestamptz,
  status public.data_status not null default 'pending'
);

create table if not exists public.scraping_logs (
  id text primary key default gen_random_uuid()::text,
  data_source_id text not null references public.data_sources (id) on delete cascade,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  status public.scrape_status not null,
  records_processed integer not null default 0,
  error_message text
);

create table if not exists public.fx_rates (
  base public.currency_code not null,
  quote public.currency_code not null,
  rate numeric not null check (rate > 0),
  as_of date not null,
  primary key (base, quote)
);

-- ---------------------------------------------------------------------------
-- Profile trigger
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, display_currency)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'Investor'),
    'INR'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Sample portfolio for a newly registered user
-- ---------------------------------------------------------------------------
create or replace function public.clone_sample_portfolio()
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.investments where user_id = uid) then
    return;
  end if;

  insert into public.investments (
    user_id, fund_id, security_id, name, type, country, currency,
    invested_amount, current_value, units, created_at, updated_at
  ) values
    (uid, 'fund-ppfcf', null, 'Parag Parikh Flexi Cap Fund', 'mutual_fund', 'IN', 'INR', 1000000, 1240000, 1245.32, '2023-01-15T00:00:00Z', '2026-09-01T00:00:00Z'),
    (uid, 'fund-hdfcmid', null, 'HDFC Mid-Cap Opportunities Fund', 'mutual_fund', 'IN', 'INR', 500000, 580000, 312.4, '2023-06-10T00:00:00Z', '2026-09-01T00:00:00Z'),
    (uid, 'fund-niftybees', null, 'Nippon India ETF Nifty BeES', 'etf', 'IN', 'INR', 300000, 345000, 1180, '2024-02-01T00:00:00Z', '2026-09-02T00:00:00Z'),
    (uid, null, 'sec-reliance', 'Reliance Industries', 'stock', 'IN', 'INR', 200000, 235000, 75, '2024-04-20T00:00:00Z', '2026-09-01T00:00:00Z'),
    (uid, null, 'sec-apple', 'Apple', 'stock', 'US', 'USD', 5000, 6200, 28, '2023-11-02T00:00:00Z', '2026-09-03T00:00:00Z'),
    (uid, null, 'sec-msft', 'Microsoft', 'stock', 'US', 'USD', 2000, 2400, 6, '2024-01-18T00:00:00Z', '2026-09-03T00:00:00Z'),
    (uid, null, 'sec-nvda', 'NVIDIA', 'stock', 'US', 'USD', 1000, 1350, 8, '2024-05-12T00:00:00Z', '2026-09-03T00:00:00Z'),
    (uid, 'fund-voo', null, 'Vanguard S&P 500 ETF', 'etf', 'US', 'USD', 10000, 12000, 22, '2023-08-08T00:00:00Z', '2026-09-03T00:00:00Z'),
    (uid, 'fund-qqq', null, 'Invesco QQQ Trust', 'etf', 'US', 'USD', 5000, 6100, 12, '2024-03-22T00:00:00Z', '2026-09-03T00:00:00Z');
end;
$$;

grant execute on function public.clone_sample_portfolio() to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.securities enable row level security;
alter table public.funds enable row level security;
alter table public.fund_holdings enable row level security;
alter table public.investments enable row level security;
alter table public.investment_transactions enable row level security;
alter table public.data_sources enable row level security;
alter table public.scraping_logs enable row level security;
alter table public.fx_rates enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "catalog_select" on public.securities;
create policy "catalog_select" on public.securities
  for select to authenticated using (true);

drop policy if exists "funds_select" on public.funds;
create policy "funds_select" on public.funds
  for select to authenticated using (true);

drop policy if exists "funds_update" on public.funds;
create policy "funds_update" on public.funds
  for update to authenticated using (true) with check (true);

drop policy if exists "holdings_select" on public.fund_holdings;
create policy "holdings_select" on public.fund_holdings
  for select to authenticated using (true);

drop policy if exists "investments_select_own" on public.investments;
create policy "investments_select_own" on public.investments
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "investments_insert_own" on public.investments;
create policy "investments_insert_own" on public.investments
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "investments_update_own" on public.investments;
create policy "investments_update_own" on public.investments
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "investments_delete_own" on public.investments;
create policy "investments_delete_own" on public.investments
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "txn_select_own" on public.investment_transactions;
create policy "txn_select_own" on public.investment_transactions
  for select to authenticated
  using (exists (
    select 1 from public.investments i
    where i.id = investment_id and i.user_id = auth.uid()
  ));

drop policy if exists "txn_insert_own" on public.investment_transactions;
create policy "txn_insert_own" on public.investment_transactions
  for insert to authenticated
  with check (exists (
    select 1 from public.investments i
    where i.id = investment_id and i.user_id = auth.uid()
  ));

drop policy if exists "txn_delete_own" on public.investment_transactions;
create policy "txn_delete_own" on public.investment_transactions
  for delete to authenticated
  using (exists (
    select 1 from public.investments i
    where i.id = investment_id and i.user_id = auth.uid()
  ));

drop policy if exists "sources_select" on public.data_sources;
create policy "sources_select" on public.data_sources
  for select to authenticated using (true);

drop policy if exists "sources_update" on public.data_sources;
create policy "sources_update" on public.data_sources
  for update to authenticated using (true) with check (true);

drop policy if exists "logs_select" on public.scraping_logs;
create policy "logs_select" on public.scraping_logs
  for select to authenticated using (true);

drop policy if exists "logs_insert" on public.scraping_logs;
create policy "logs_insert" on public.scraping_logs
  for insert to authenticated with check (true);

drop policy if exists "fx_select" on public.fx_rates;
create policy "fx_select" on public.fx_rates
  for select to authenticated using (true);

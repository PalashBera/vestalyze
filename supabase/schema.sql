-- Vestalyze public schema.
-- Safe on a new project, or on an existing one: drops app tables then recreates them.
-- Does not drop auth.users.
--
-- Design rules enforced here:
--   1. Every nested table carries user_id so RLS filters without a join.
--   2. Nothing derivable is stored. Currency is a function of country, and
--      effective exposure is computed at read time, never persisted.
--   3. fund_holdings holds the latest snapshot only. A sync replaces the rows
--      for that fund, so there is no per-row history to date-stamp.
--   4. In the portfolio book, investments.invested_amount is the only money
--      column. stock_trades and stock_analysis are a separate trade journal
--      and watchlist: they carry their own prices and never reach the
--      dashboard, market, exposure, or overlap pages.
--
-- See docs/SCHEMA_GUIDE.md for the per-column feature mapping.

drop function if exists public.delete_own_account() cascade;
drop table if exists public.stock_analysis cascade;
drop table if exists public.stock_trades cascade;
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

-- profiles ------------------------------------------------------------------
-- One row per auth user, created by the on_auth_user_created trigger.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  display_currency public.currency_code not null default 'INR',
  fx_usd_inr numeric not null default 87.25 check (fx_usd_inr > 0),
  fx_as_of date not null default (timezone('utc', now()))::date,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.profiles is
  'Per-user settings. Mirrors auth.users one-to-one; email lives in auth, not here.';
comment on column public.profiles.id is
  'Same uuid as auth.users.id. Primary key and foreign key at once, so a profile cannot outlive its login.';
comment on column public.profiles.name is
  'Display name shown in the sidebar and Settings. Seeded from signup metadata.';
comment on column public.profiles.display_currency is
  'Reporting currency for consolidated totals. Does not change how holdings are stored.';
comment on column public.profiles.fx_usd_inr is
  'User-supplied USD/INR rate used to combine Indian and US amounts into one number.';
comment on column public.profiles.fx_as_of is
  'Date the user last set fx_usd_inr. Shown next to the rate so a stale rate is visible.';
comment on column public.profiles.created_at is 'Account creation timestamp.';

-- securities ----------------------------------------------------------------
-- A company. Created on demand while parsing fund holdings, or when a direct
-- stock is added. Scoped per user: two users tracking Apple get two rows.

create table public.securities (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  standardized_name text not null,
  ticker text not null,
  country public.country_code not null,
  unique (user_id, ticker, country)
);

create index securities_ticker_idx on public.securities (ticker);
create index securities_user_idx on public.securities (user_id);

comment on table public.securities is
  'Companies you have exposure to, whether through a fund or held directly. Per-user, not a shared catalogue.';
comment on column public.securities.id is
  'Deterministic slug built from ticker and country, so repeated syncs reuse one row.';
comment on column public.securities.user_id is 'Owner. RLS filters on this column.';
comment on column public.securities.standardized_name is
  'Cleaned company name. Fund factsheets spell the same company several ways; this is the one the UI shows.';
comment on column public.securities.ticker is
  'Exchange symbol. Used with country to merge the same company arriving from different funds.';
comment on column public.securities.country is
  'Listing market. Also determines the currency, which is why currency is not stored.';

-- funds ---------------------------------------------------------------------
-- A mutual fund or ETF whose holdings have been scraped. Deduplicated per user
-- by source_url so two investments pointing at the same fund share one row.

create table public.funds (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type public.fund_type not null,
  country public.country_code not null,
  latest_portfolio_date date not null,
  source_url text not null
);

create unique index funds_user_source_url_idx
  on public.funds (user_id, source_url)
  where length(trim(source_url)) > 0;

create index funds_user_idx on public.funds (user_id);

comment on table public.funds is
  'A scraped mutual fund or ETF. One row per (user, source_url) so two investments in the same fund share its holdings.';
comment on column public.funds.id is 'Generated slug. Referenced by fund_holdings and investments.';
comment on column public.funds.user_id is 'Owner. RLS filters on this column.';
comment on column public.funds.name is 'Fund name as entered on the investment that created it.';
comment on column public.funds.type is 'mutual_fund or etf. Stocks never create a fund row.';
comment on column public.funds.country is 'Market the fund is domiciled in. Determines currency.';
comment on column public.funds.latest_portfolio_date is
  'Portfolio date read from the factsheet. Shown on the investment page so you know how old the split is.';
comment on column public.funds.source_url is
  'Public holdings page that was scraped. Doubles as the dedupe key via funds_user_source_url_idx.';

-- fund_holdings -------------------------------------------------------------
-- The stock split of a fund. Latest snapshot only: a sync deletes this fund's
-- rows and reinserts them, so there is no history and no per-row date.

create table public.fund_holdings (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  fund_id text not null references public.funds (id) on delete cascade,
  security_id text not null references public.securities (id),
  allocation_percentage numeric(8, 4) not null check (
    allocation_percentage >= 0 and allocation_percentage <= 100
  ),
  unique (fund_id, security_id)
);

create index fund_holdings_fund_idx on public.fund_holdings (fund_id);
create index fund_holdings_user_idx on public.fund_holdings (user_id);

comment on table public.fund_holdings is
  'Which companies a fund holds and at what weight. Latest snapshot only; a sync replaces every row for the fund.';
comment on column public.fund_holdings.id is 'Surrogate key. Rows are replaced wholesale on each sync.';
comment on column public.fund_holdings.user_id is 'Owner. Denormalised from funds so RLS filters without a join.';
comment on column public.fund_holdings.fund_id is 'Fund this row belongs to.';
comment on column public.fund_holdings.security_id is 'Company held.';
comment on column public.fund_holdings.allocation_percentage is
  'Percent of the fund in this company. Multiplied by invested_amount to get your real exposure. Never stores a money amount.';

-- investments ---------------------------------------------------------------
-- What the user actually bought. The only table holding a money amount.

create table public.investments (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users (id) on delete cascade,
  fund_id text references public.funds (id),
  security_id text references public.securities (id),
  name text not null check (char_length(name) between 1 and 120),
  type public.investment_type not null,
  country public.country_code not null,
  invested_amount numeric not null check (invested_amount > 0),
  source_url text,
  last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index investments_user_idx on public.investments (user_id);

comment on table public.investments is
  'A position the user holds. The only place a money amount is stored; every exposure figure is derived from invested_amount.';
comment on column public.investments.id is 'Generated uuid.';
comment on column public.investments.user_id is 'Owner. RLS filters on this column.';
comment on column public.investments.fund_id is
  'Set for mutual funds and ETFs once synced. Null for direct stocks and for funds not yet synced.';
comment on column public.investments.security_id is
  'Set for direct stocks only. Null for funds, whose companies come through fund_holdings.';
comment on column public.investments.name is 'Label the user typed. Also seeds funds.name on first sync.';
comment on column public.investments.type is
  'mutual_fund, etf, or stock. Decides whether look-through applies and which of fund_id / security_id is set.';
comment on column public.investments.country is
  'Market. Determines the currency, drives the India and US pages, and is the reason currency is not stored.';
comment on column public.investments.invested_amount is
  'Amount invested, in the currency implied by country. The root of every exposure calculation.';
comment on column public.investments.source_url is
  'Fund holdings URL to scrape. Required for mutual funds and ETFs, null for stocks.';
comment on column public.investments.last_synced_at is
  'When the fund split was last pulled. Shown in the investments list; null means never synced.';
comment on column public.investments.created_at is 'Row creation timestamp.';

-- investment_syncs ----------------------------------------------------------
-- Audit trail for scrape attempts, shown as sync history on the detail page.

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

comment on table public.investment_syncs is
  'One row per scrape attempt. Gives the user a reason when a fund URL stops working.';
comment on column public.investment_syncs.id is 'Generated uuid.';
comment on column public.investment_syncs.user_id is 'Owner. Denormalised from investments so RLS filters without a join.';
comment on column public.investment_syncs.investment_id is 'Investment that was synced.';
comment on column public.investment_syncs.started_at is 'Attempt start. Sync history is ordered by this, newest first.';
comment on column public.investment_syncs.status is
  'running while in flight, then success or failed. A stuck running row means the request died mid-scrape.';
comment on column public.investment_syncs.records_processed is 'Holdings written on success. Zero on failure.';
comment on column public.investment_syncs.error_message is 'Failure reason shown in sync history. Null on success.';

-- stock_trades --------------------------------------------------------------
-- A trade journal, independent of the look-through portfolio above. Nothing
-- here feeds dashboard totals. A trade with no sell is still open, so the sell
-- columns are nullable and must be filled in as a pair.

create table public.stock_trades (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  symbol text not null check (char_length(symbol) between 1 and 20),
  buy_date date not null,
  buy_price numeric not null check (buy_price > 0),
  quantity numeric not null check (quantity > 0),
  sell_date date,
  sell_price numeric check (sell_price >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  constraint stock_trades_sell_pair check (
    (sell_date is null) = (sell_price is null)
  ),
  constraint stock_trades_sell_after_buy check (
    sell_date is null or sell_date >= buy_date
  )
);

create index stock_trades_user_idx on public.stock_trades (user_id, buy_date desc);

comment on table public.stock_trades is
  'Realised and open stock trades. A standalone journal: these rows never affect portfolio totals or look-through exposure.';
comment on column public.stock_trades.id is 'Generated uuid.';
comment on column public.stock_trades.user_id is 'Owner. RLS filters on this column.';
comment on column public.stock_trades.name is 'Company name as the user typed it.';
comment on column public.stock_trades.symbol is 'Exchange symbol, uppercased on write. Groups trades in the same company.';
comment on column public.stock_trades.buy_date is 'Purchase date. Start of the holding duration.';
comment on column public.stock_trades.buy_price is 'Price per share paid. Multiplied by quantity to get the total purchase amount.';
comment on column public.stock_trades.quantity is 'Shares bought. Numeric rather than integer so fractional lots are allowed.';
comment on column public.stock_trades.sell_date is 'Sale date, or null while the trade is open. End of the holding duration.';
comment on column public.stock_trades.sell_price is
  'Price per share received, or null while the trade is open. Paired with sell_date by stock_trades_sell_pair.';
comment on column public.stock_trades.created_at is 'Row creation timestamp.';

-- stock_analysis ------------------------------------------------------------
-- A watchlist of price targets. Target price is derived, never stored.

create table public.stock_analysis (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  symbol text not null check (char_length(symbol) between 1 and 20),
  buy_date date not null,
  buy_price numeric not null check (buy_price > 0),
  target_return_percentage numeric not null check (target_return_percentage > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index stock_analysis_user_idx on public.stock_analysis (user_id, created_at desc);

comment on table public.stock_analysis is
  'Price targets the user is tracking. Standalone, like stock_trades: nothing here reaches the portfolio pages.';
comment on column public.stock_analysis.id is 'Generated uuid.';
comment on column public.stock_analysis.user_id is 'Owner. RLS filters on this column.';
comment on column public.stock_analysis.name is 'Company name as the user typed it.';
comment on column public.stock_analysis.symbol is 'Exchange symbol, uppercased on write.';
comment on column public.stock_analysis.buy_date is 'Date the entry price was taken.';
comment on column public.stock_analysis.buy_price is 'Entry price per share. The base the target is calculated from.';
comment on column public.stock_analysis.target_return_percentage is
  'Return the user is aiming for. Target price is buy_price * (1 + this / 100), computed at read time and never stored.';
comment on column public.stock_analysis.created_at is 'Row creation timestamp.';

-- new user trigger ----------------------------------------------------------

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

comment on function public.handle_new_user() is
  'Creates the profile row for a new auth user. Runs as security definer because the signup has no session yet.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

-- row level security --------------------------------------------------------
-- Every policy is owner-only. There is no shared or public row anywhere.

alter table public.profiles enable row level security;
alter table public.securities enable row level security;
alter table public.funds enable row level security;
alter table public.fund_holdings enable row level security;
alter table public.investments enable row level security;
alter table public.investment_syncs enable row level security;
alter table public.stock_trades enable row level security;
alter table public.stock_analysis enable row level security;

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

create policy "trades_select_own" on public.stock_trades
  for select to authenticated using (user_id = auth.uid());

create policy "trades_insert_own" on public.stock_trades
  for insert to authenticated with check (user_id = auth.uid());

create policy "trades_update_own" on public.stock_trades
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "trades_delete_own" on public.stock_trades
  for delete to authenticated using (user_id = auth.uid());

create policy "analysis_select_own" on public.stock_analysis
  for select to authenticated using (user_id = auth.uid());

create policy "analysis_insert_own" on public.stock_analysis
  for insert to authenticated with check (user_id = auth.uid());

create policy "analysis_update_own" on public.stock_analysis
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "analysis_delete_own" on public.stock_analysis
  for delete to authenticated using (user_id = auth.uid());

-- account deletion ----------------------------------------------------------

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

  delete from public.stock_analysis where user_id = uid;
  delete from public.stock_trades where user_id = uid;
  delete from public.investment_syncs where user_id = uid;
  delete from public.fund_holdings where user_id = uid;
  delete from public.investments where user_id = uid;
  delete from public.funds where user_id = uid;
  delete from public.securities where user_id = uid;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$$;

comment on function public.delete_own_account() is
  'Hard-deletes the caller and everything they own, in foreign-key order, then removes the login. No soft delete.';

revoke all on function public.delete_own_account() from public;
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;

-- backfill ------------------------------------------------------------------
-- The drop above removes profiles, but auth.users survives. Without this,
-- anyone who signed up before the script ran would be left without a profile
-- and the app would fail on first load. The trigger only covers new signups.

insert into public.profiles (id, name)
select u.id, coalesce(nullif(trim(u.raw_user_meta_data ->> 'name'), ''), 'Investor')
from auth.users u
on conflict (id) do nothing;

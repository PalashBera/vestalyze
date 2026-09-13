# Schema implementation guide

A column-by-column map of the database to the features that use it. For each column you get the feature it serves, the code that writes it, the code that reads it, and a concrete way to verify it is behaving.

Use this when you change the schema, review a PR that touches data, or want to confirm a column still earns its place.

- Shape of the data: [ER.md](./ER.md)
- Source of truth: [`supabase/schema.sql`](../supabase/schema.sql)
- Setup and RLS: [SUPABASE.md](./SUPABASE.md)

---

## The four design rules

Every column below is justified against these. A column that breaks one of them should be removed, not documented.

1. **Owner-scoped.** Every table carries `user_id` (or is keyed by it) so an RLS policy can filter without a join. This is the one denormalisation the schema allows, and it is deliberate.
2. **Nothing derivable is stored.** If a value can be computed from another column, it is computed. Currency comes from country. Exposure comes from amount times weight. Neither is persisted.
3. **Latest snapshot, not history.** `fund_holdings` is replaced wholesale on each sync. The only history the product keeps is `investment_syncs`, and that is an audit log, not portfolio history.
4. **One home for money.** `investments.invested_amount` is the only money column. Every figure on every screen traces back to it.

### Verifying the rules hold

```sql
-- Rule 1: every table except profiles must have user_id.
select c.relname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'profiles'
  and not exists (
    select 1 from pg_attribute a
    where a.attrelid = c.oid and a.attname = 'user_id' and a.attnum > 0 and not a.attisdropped
  );
-- Expect: zero rows.

-- Rule 1: RLS on, with policies, everywhere.
select c.relname, c.relrowsecurity, count(p.polname) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public' and c.relkind = 'r'
group by 1, 2;
-- Expect: relrowsecurity true everywhere; 4 policies per table, 2 on profiles.

-- Rule 2: no table may reintroduce a currency column.
select table_name, column_name
from information_schema.columns
where table_schema = 'public' and column_name = 'currency';
-- Expect: zero rows. Only profiles.display_currency exists, and it is a
-- reporting preference, not the currency of a position.

-- Rule 4: invested_amount is the only money column.
select table_name, column_name
from information_schema.columns
where table_schema = 'public' and data_type = 'numeric';
-- Expect: profiles.fx_usd_inr, investments.invested_amount,
-- fund_holdings.allocation_percentage. Nothing else.
```

Every column also carries a Postgres comment, visible in the Supabase table editor:

```sql
select c.relname as table_name, a.attname as column_name, col_description(c.oid, a.attnum) as comment
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_attribute a on a.attrelid = c.oid
where n.nspname = 'public' and c.relkind = 'r' and a.attnum > 0 and not a.attisdropped
order by 1, a.attnum;
-- Expect: no null comments. A null means an undocumented column was added.
```

---

## Feature to table map

Start here to know what a change can affect.

| Feature               | Screen                                | Tables read                                                       | Tables written                                                            |
| --------------------- | ------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Sign up / sign in     | `/` auth dialog                       | `profiles`                                                        | `profiles` (via trigger)                                                  |
| Onboarding            | `/onboarding`                         | —                                                                 | `investments`, `funds`, `securities`                                      |
| Add / edit investment | `/investments`                        | `funds`, `securities`                                             | `investments`, `funds`, `securities`                                      |
| Sync fund holdings    | `/investments/[id]`                   | `investments`, `funds`                                            | `fund_holdings`, `securities`, `funds`, `investments`, `investment_syncs` |
| Sync history          | `/investments/[id]`                   | `investment_syncs`                                                | —                                                                         |
| Dashboard totals      | `/dashboard`                          | `investments`, `fund_holdings`, `funds`, `securities`, `profiles` | —                                                                         |
| Company exposure      | `/exposure`, `/exposure/[securityId]` | `investments`, `fund_holdings`, `securities`                      | —                                                                         |
| Fund overlap          | `/overlap`                            | `investments`, `fund_holdings`, `funds`, `securities`             | —                                                                         |
| India / US views      | `/india`, `/us`                       | `investments`, `fund_holdings`, `securities`, `profiles`          | —                                                                         |
| Settings and FX       | `/settings`                           | `profiles`                                                        | `profiles`                                                                |
| Delete account        | `/settings`                           | —                                                                 | all, via `delete_own_account()`                                           |

The read path is always the same: `src/app/api/v1/[...slug]/route.ts` → `src/lib/api/supabase/handlers.ts` → `src/lib/api/supabase/mappers.ts` → `src/lib/finance/exposure.ts`. No screen queries Supabase directly.

---

## `profiles`

One row per account, created by the `handle_new_user` trigger. Holds settings only; email and password stay in `auth.users`.

| Column             | Feature                                | Written by                                      | Read by                                       | How to verify                                                                                                  |
| ------------------ | -------------------------------------- | ----------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `id`               | All                                    | `handle_new_user()` trigger on signup           | Every handler, as the RLS key                 | Sign up, then `select count(*) from profiles` — exactly one new row whose id matches the new `auth.users` row. |
| `name`             | Sidebar, Settings, onboarding greeting | `supabaseUpdateProfile` (`PATCH /auth/profile`) | `mapUser` → `GET /auth/me`                    | Change the name in Edit profile; the sidebar updates without a reload.                                         |
| `display_currency` | Consolidated totals                    | `supabaseUpdateSettings` (`PATCH /settings`)    | `buildOverview` in `exposure.ts`              | Switch INR to USD in Settings; dashboard totals reprice, per-market native amounts do not.                     |
| `fx_usd_inr`       | India vs US combined totals            | `supabaseUpdateFxRate` (`PATCH /fx/rate`)       | `fxRate()` in `handlers.ts`, then `convert()` | Change the rate; the dashboard FX card and any cross-currency total move together.                             |
| `fx_as_of`         | Staleness hint next to the rate        | Same as `fx_usd_inr`, always written together   | Dashboard FX card hint, Settings "Last set"   | Save a new rate; the date becomes today. On a brand new signup it is the signup date, not a hardcoded one.     |
| `created_at`       | Account age                            | Column default                                  | `mapUser`                                     | `select created_at from profiles` is close to the `auth.users` timestamp.                                      |

Only `select` and `update` policies exist. There is deliberately no insert policy: the trigger creates the row, and the client must never be able to forge one.

> **Verify `fx_as_of` is not frozen.** This column was previously created with a literal default, so every new account inherited one stale date. Check the default is an expression:
>
> ```sql
> select pg_get_expr(d.adbin, d.adrelid)
> from pg_attrdef d join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
> where a.attname = 'fx_as_of';
> -- Expect: (timezone('utc'::text, now()))::date, never a date literal.
> ```

---

## `securities`

A company, scoped to one user. Created either when a direct stock is added or while parsing a fund's holdings. Two users tracking Apple get two rows; that is intentional so one person's scrape can never leak into another's book.

| Column              | Feature                                | Written by                                                                                 | Read by                                  | How to verify                                                                                |
| ------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `id`                | Company drill-down URL                 | `buildSecurityFromInput` / `buildSecurityFromCompany` in `src/lib/investments/security.ts` | `/exposure/[securityId]`                 | The id is deterministic. Sync the same fund twice and the row count does not grow.           |
| `user_id`           | Isolation                              | Same as above                                                                              | RLS                                      | Query as another user; you get zero rows.                                                    |
| `standardized_name` | Label on every exposure screen         | Stock: what the user typed. Holding: the cleaned name from the scraper                     | Exposure table, company page             | Add " hdfc bank " as a stock; the stored name is trimmed and shown consistently.             |
| `ticker`            | Deduplication                          | `normalizeTicker` (uppercased, symbols stripped)                                           | The dedupe lookup before every insert    | Add `hdfcbank` then `HDFCBANK` in the same market; the second reuses the first row.          |
| `country`           | Market split, and the derived currency | Copied from the parent investment                                                          | `currencyForCountry`, India and US pages | Same ticker in IN and US stays two rows, because uniqueness is `(user_id, ticker, country)`. |

No `currency` column: it is `country === 'IN' ? 'INR' : 'USD'`, applied in `mapSecurity`. No `sector` column: exposure is by company, market, and weight, never by industry tag.

---

## `funds`

A mutual fund or ETF whose holdings have been scraped, deduplicated per user by `source_url`. Two investments pointing at the same fund URL share one fund row and therefore one set of holdings.

| Column                  | Feature                                         | Written by                                     | Read by                                        | How to verify                                                                                    |
| ----------------------- | ----------------------------------------------- | ---------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `id`                    | Joins from holdings and investments             | `ensureSupabaseFund` in `handlers.ts`          | `fund_holdings.fund_id`, `investments.fund_id` | Foreign keys make an orphan impossible.                                                          |
| `user_id`               | Isolation                                       | `ensureSupabaseFund`                           | RLS                                            | As above.                                                                                        |
| `name`                  | Fund label in overlap                           | Copied from the investment name on first sync  | `/overlap`                                     | Rename the investment; the fund keeps its original name, which is expected — the fund is shared. |
| `type`                  | Distinguishing a fund from an ETF               | Copied from the investment type                | `/overlap`                                     | A `stock` investment must never create a fund row.                                               |
| `country`               | Market of the product, and its derived currency | Copied from the investment                     | `currencyForCountry`                           | —                                                                                                |
| `latest_portfolio_date` | "Portfolio as of" on the investment page        | Set from the scraped holding date on each sync | `/investments/[id]`                            | Sync a fund; the date matches the as-of date printed on the source page.                         |
| `source_url`            | Scrape target and dedupe key                    | `ensureSupabaseFund`, refreshed on each sync   | The sync path                                  | Add two investments with the same URL; `select count(*) from funds` increases by one, not two.   |

Uniqueness is a partial index, `funds_user_source_url_idx`, applied only when `source_url` is non-empty, so blank URLs never collide with each other.

No `last_scraped_at`: it duplicated `investments.last_synced_at`, which is what the UI actually shows.

---

## `fund_holdings`

The look-through book: which companies a fund holds and at what weight. This is the table that makes the product work.

| Column                  | Feature                               | Written by                              | Read by                               | How to verify                                                                                     |
| ----------------------- | ------------------------------------- | --------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `id`                    | Surrogate key                         | `supabaseSyncInvestment`                | —                                     | Rows are replaced wholesale, so the value itself is not meaningful.                               |
| `user_id`               | Isolation                             | `supabaseSyncInvestment`                | RLS                                   | Denormalised from `funds` on purpose, so a policy does not need a join.                           |
| `fund_id`               | Which product the weight belongs to   | `supabaseSyncInvestment`                | `calculateExposures`, `buildOverlaps` | Deleting the fund cascades these rows away.                                                       |
| `security_id`           | Which company                         | `supabaseSyncInvestment`                | `calculateExposures`                  | The same company in two funds produces two rows that the exposure page sums into one.             |
| `allocation_percentage` | Every exposure number on every screen | Parsed by `src/lib/extract/holdings.ts` | `calculateExposures`                  | Weights for one fund should total roughly 100. A check constraint rejects anything outside 0–100. |

The core calculation, in `src/lib/finance/exposure.ts`:

```text
effective_exposure = invested_amount × (allocation_percentage / 100)
```

**Verifying the snapshot rule.** Sync deletes every row for the fund and reinserts, so:

```sql
-- One company appears at most once per fund.
select fund_id, security_id, count(*)
from fund_holdings group by 1, 2 having count(*) > 1;
-- Expect: zero rows. The unique constraint enforces it.

-- Weights are plausible.
select fund_id, round(sum(allocation_percentage), 2) as total
from fund_holdings group by 1;
-- Expect: near 100 per fund. Well under means the source page was partially parsed.
```

Sync twice in a row and the row count for that fund must stay the same, not double.

No `holding_date`: every row written by one sync shares a single date, which is stored once on `funds.latest_portfolio_date`. Repeating it per row implied a history that the delete-and-reinsert strategy never actually kept.

---

## `investments`

What the user bought. The only table with a money amount, and the root of every number the product displays.

| Column            | Feature                                | Written by                                         | Read by                                                       | How to verify                                                                                                                    |
| ----------------- | -------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `id`              | Detail route, sync history FK          | Default `gen_random_uuid()::text`                  | `/investments/[id]`                                           | —                                                                                                                                |
| `user_id`         | Isolation                              | `supabaseCreateInvestment`                         | RLS                                                           | —                                                                                                                                |
| `fund_id`         | Look-through link                      | Set on create and on each sync, for funds and ETFs | `calculateExposures`                                          | Null for stocks, and null for a fund that has never synced.                                                                      |
| `security_id`     | Direct stock link                      | Set on create for stocks only                      | `calculateExposures`                                          | Exactly one of `fund_id` / `security_id` is set in practice; a stock never has both.                                             |
| `name`            | List and detail title                  | What the user typed, trimmed                       | Investments list, detail                                      | Also seeds `funds.name` the first time a fund is created.                                                                        |
| `type`            | Whether look-through applies           | The form's type selector                           | Sync button visibility, exposure branching                    | A `stock` must not show a Fund URL field or a Sync button.                                                                       |
| `country`         | Market views, and the derived currency | The form's country selector                        | India / US pages, `currencyForCountry`                        | Add an IN investment; it appears on `/india` and not on `/us`.                                                                   |
| `invested_amount` | Every figure in the product            | The form                                           | `calculateExposures`, `buildOverview`, `buildMarketDashboard` | Change the amount; every exposure for that fund's companies moves proportionally. A check constraint rejects zero and negatives. |
| `source_url`      | Scrape target                          | The form, normalised by `normalizeSourceUrl`       | The sync path                                                 | Required for funds and ETFs, rejected as missing with a 400. Null for stocks.                                                    |
| `last_synced_at`  | "Last sync" column                     | Set on each successful sync                        | Investments list and detail                                   | Null until the first successful sync. Stocks show a dash rather than a date.                                                     |
| `created_at`      | List ordering                          | Column default                                     | Investments list                                              | —                                                                                                                                |

**Verifying the shape of the data:**

```sql
-- A stock must not be linked to a fund, and a fund must not be linked to a security.
select id, type, fund_id, security_id from investments
where (type = 'stock' and fund_id is not null)
   or (type <> 'stock' and security_id is not null);
-- Expect: zero rows.

-- Funds and ETFs must have a URL to sync.
select id, name from investments where type <> 'stock' and coalesce(source_url, '') = '';
-- Expect: zero rows.
```

No `units` column: amount plus allocation percentage is the whole look-through input, so quantity and unit price would be dead weight.

---

## `investment_syncs`

An audit trail of scrape attempts. Its job is to explain a failure, not to store portfolio history.

| Column              | Feature               | Written by                                              | Read by                                    | How to verify                                                                           |
| ------------------- | --------------------- | ------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| `id`                | Row key               | Default `gen_random_uuid()::text`                       | —                                          | —                                                                                       |
| `user_id`           | Isolation             | `supabaseSyncInvestment`                                | RLS                                        | Denormalised from `investments` so a policy does not need a join.                       |
| `investment_id`     | Which lot was synced  | `supabaseSyncInvestment`                                | `supabaseListSyncs`                        | Deleting the investment cascades its sync rows away.                                    |
| `started_at`        | History ordering      | Default at insert                                       | `/investments/[id]`, ordered newest first  | Two syncs in a row appear in the right order.                                           |
| `status`            | Badge in sync history | Inserted as `running`, updated to `success` or `failed` | `/investments/[id]`                        | Point an investment at a URL that cannot be parsed; the row lands on `failed`.          |
| `records_processed` | "Holdings" count      | Set to the number of rows written                       | `/investments/[id]`, and the success toast | Matches `select count(*) from fund_holdings where fund_id = …` after a successful sync. |
| `error_message`     | Why a sync failed     | Set in the `catch` of `supabaseSyncInvestment`          | `/investments/[id]`                        | Null on success, populated with a readable reason on failure.                           |

```sql
-- A stuck 'running' row means a request died mid-scrape.
select * from investment_syncs
where status = 'running' and started_at < now() - interval '15 minutes';
-- Expect: zero rows in normal operation.
```

---

## Account deletion

`delete_own_account()` is `security definer` and granted to `authenticated`, so a signed-in user can delete themselves and nothing else. It reads `auth.uid()` and ignores any argument, so one user cannot pass another user's id.

Defence in depth: `supabaseDeleteAccount` re-verifies the password with `signInWithPassword` before calling the function, and the route is rate limited.

Supabase's security advisor flags this function as executable by signed-in users. That is the intent — self-service deletion cannot work otherwise — and the `auth.uid()` lookup plus password re-check are what make it safe.

```sql
-- Anonymous users must not be able to call it.
select has_function_privilege('anon', 'public.delete_own_account()', 'execute');
-- Expect: false.

select has_function_privilege('authenticated', 'public.delete_own_account()', 'execute');
-- Expect: true.
```

After a deletion, every table must return zero rows for that id, including `auth.users`.

---

## Checklist for a schema change

1. **Justify it against the four rules.** If the value is derivable, derive it instead. If it is per-row history in `fund_holdings`, it does not belong there.
2. **Edit [`supabase/schema.sql`](../supabase/schema.sql)** — it is the source of truth, not a record of what happened. Add a `comment on column` in the same change; the verification query above fails without one.
3. **Apply it.** Run the file against the project, or use the Supabase MCP `apply_migration` tool. The script drops and recreates the app tables, and backfills profiles for any `auth.users` that already existed, so it is safe to re-run.
4. **Mirror it in `src/lib/supabase/database.types.ts`**, which is hand-maintained. `npx tsc --noEmit` will point at every handler that needs updating.
5. **Decide whether it reaches the API.** A column that no mapper in `src/lib/api/supabase/mappers.ts` exposes is a column no screen can use — which is usually a sign it should not exist.
6. **Update [ER.md](./ER.md)**, including the Mermaid source and the regenerated `images/er-diagram.png`, and add the column to the table above.
7. **Run the verification queries** in this document, plus `npx tsc --noEmit` and `npm run build`.

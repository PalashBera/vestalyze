# Supabase Backend

This document is the contract for running the Vestalyze API on **Supabase Auth + Postgres**.

The browser still calls Next.js `/api/v1/...`. Next.js is the BFF:

1. The browser sends the request with cookies.
2. Next.js creates a Supabase server client from those cookies.
3. Supabase Auth identifies the user. Row Level Security scopes every query to that user.
4. Look-through math stays in `src/lib/finance`. Supabase stores data; it does not reimplement exposure formulas.

Local development and Vercel both use this path. Nested data is scoped by the signed-in user.

---

## 1. Create a project

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Wait until the database is ready.
3. **Authentication → Providers → Email**: enable email + password.
4. **Authentication → Providers → Email → Confirm email**: turn **off** for local development so `signUp` returns a session immediately. Turn it on in production.
5. **Authentication → Settings**: set a Site URL of `http://localhost:3000` for local work.

Do not use the service role key in this app. Every request uses the anon key plus the user JWT so RLS applies.

---

## 2. Environment

Add these to `.env.local` (gitignored). Copy from `.env.example`.

| Variable            | Where to find it                             | Client?     |
| ------------------- | -------------------------------------------- | ----------- |
| `SUPABASE_URL`      | Project Settings → API → Project URL         | Server only |
| `SUPABASE_ANON_KEY` | Project Settings → API → `anon` `public` key | Server only |

The URL is not a secret. The anon key is meant to be used with RLS. This app keeps both on the server because the browser never talks to Supabase directly.

Never commit `service_role`. Never put it in `NEXT_PUBLIC_*`.

Example:

```bash
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=
```

---

## 3. Apply schema and seed

In the Supabase SQL editor, run in order:

1. [`supabase/schema.sql`](../supabase/schema.sql) — drops existing app tables, then creates tables, trigger, and owner-only RLS
2. [`supabase/seed.sql`](../supabase/seed.sql) — notes only; FX defaults live on `profiles`

`schema.sql` wipes `profiles`, `securities`, `funds`, `fund_holdings`, `investments`, and `investment_syncs`. It does not drop `auth.users`. After a reset, existing accounts need a new profile row (sign up again, or insert into `profiles`).

There is no sample portfolio. New users add holdings in onboarding. Company names from fund syncs and direct stocks they enter are stored in `securities` under their `user_id`.

You do **not** need a new Supabase project unless you want one. Pasting `schema.sql` in the SQL editor drops and recreates the app tables, then backfills a profile for any `auth.users` row that already existed, so re-running it will not strand an existing login.

---

## 4. Tables

Field-by-field purpose and an ER diagram: [ER.md](./ER.md). Per-column feature mapping and verification queries: [SCHEMA_GUIDE.md](./SCHEMA_GUIDE.md).

Every column also carries a Postgres comment, so the Supabase table editor explains each one inline.

| Table              | Columns                                                                                                                              | RLS                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `profiles`         | `id`, `name`, `display_currency`, `fx_usd_inr`, `fx_as_of`, `created_at`                                                             | Own row only (select + update)      |
| `securities`       | `id`, `user_id`, `standardized_name`, `ticker`, `country`                                                                            | Owner CRUD (`user_id = auth.uid()`) |
| `funds`            | `id`, `user_id`, `name`, `type`, `country`, `latest_portfolio_date`, `source_url`                                                     | Owner CRUD                          |
| `fund_holdings`    | `id`, `user_id`, `fund_id`, `security_id`, `allocation_percentage`                                                                   | Owner CRUD                          |
| `investments`      | `id`, `user_id`, `fund_id`, `security_id`, `name`, `type`, `country`, `invested_amount`, `source_url`, `last_synced_at`, `created_at` | Owner CRUD                          |
| `investment_syncs` | `id`, `user_id`, `investment_id`, `started_at`, `status`, `records_processed`, `error_message`                                       | Owner CRUD                          |

Deliberately absent, and why:

| Removed                                             | Reason                                                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `currency` on securities, funds, investments        | Derived from `country` (`IN → INR`, `US → USD`) in `currencyForCountry`.                    |
| `fund_holdings.holding_date`                        | Constant across a snapshot; the as-of date lives once on `funds.latest_portfolio_date`.     |
| `funds.last_scraped_at`                             | Duplicated `investments.last_synced_at`, which is the value the UI shows.                   |
| `securities.sector`, `investments.units`            | Exposure is company, market, and weight. Amount plus allocation % is the whole input.       |

Every remaining column is read or written by the API. `profiles.display_currency` is the only currency column left, and it is a reporting preference rather than the currency of a position.

`profiles.id` references `auth.users(id)`. A trigger `handle_new_user` inserts a profile from `raw_user_meta_data.name` on signup, with default FX `87.25`.

Securities are unique on `(user_id, ticker, country)`. Two accounts can own the same ticker without colliding.

---

## 5. Authentication

| App endpoint                  | Supabase call                   |
| ----------------------------- | ------------------------------- |
| `POST /api/v1/auth/register`  | `auth.signUp` + profile trigger |
| `POST /api/v1/auth/login`     | `auth.signInWithPassword`       |
| `POST /api/v1/auth/logout`    | `auth.signOut`                  |
| `GET /api/v1/auth/me`         | `auth.getUser` + `profiles`     |
| `DELETE /api/v1/auth/account` | `delete_own_account()` RPC      |

Sessions are stored in **HttpOnly**, `SameSite=Lax` cookies by `@supabase/ssr`. `Secure` is set in production. The proxy treats `sb-*-auth-token*` cookies as a signed-in session.

Login errors stay generic: `Invalid username or password`.

Password rules in the app: 8–128 characters. Paste is allowed.

If Confirm email is on and there is no session after signup, the API returns: `Account created. Confirm the email before signing in.`

Account deletion requires the current password. The BFF then calls `delete_own_account()`, a security-definer function that removes the caller’s `investment_syncs`, `fund_holdings`, `investments`, `funds`, `securities`, `profiles`, and `auth.users` row. Other accounts are untouched.

---

## 6. API mapping

Handlers in `src/lib/api/supabase/handlers.ts` run for every `/api/v1` request. Catalog routes require a session and only return the caller’s rows.

| HTTP             | Path                                          | Supabase work                                       |
| ---------------- | --------------------------------------------- | --------------------------------------------------- |
| GET/POST         | `/investments`                                | `investments` select / insert                       |
| GET/PATCH/DELETE | `/investments/:id`                            | Scoped by `user_id`                                 |
| POST             | `/investments/:id/sync`                       | Scrape fund URL holdings, write `investment_syncs`  |
| GET              | `/investments/:id/syncs`                      | Owner sync history                                  |
| GET              | `/funds`, `/funds/:id`, `/funds/:id/holdings` | Owner catalog                                       |
| GET              | `/securities`, `/securities/:id`              | Owner security master                               |
| GET              | `/portfolio/*`                                | Load investments + holdings, then `src/lib/finance` |
| GET/PATCH        | `/settings`                                   | `profiles.display_currency`                         |
| GET/PATCH        | `/fx/rate`                                    | `profiles.fx_usd_inr` / `fx_as_of`                  |
| DELETE           | `/auth/account`                               | Password check, then `delete_own_account()`         |

Look-through formula (unchanged):

```text
effective_exposure = invested_amount × (allocation_percentage / 100)
```

Combine the same company across funds, ETFs, and direct stocks.

---

## 7. Fund URL sync

Mutual funds and ETFs store a public **Fund URL**. Sync scrapes the page (SSRF-safe fetch: http/https only, no private hosts) and reads the `#holdings` section for company name + weight. Stock codes are not stored in the UI.

Each run writes `investment_syncs` (`started_at`, `status`, `records_processed`). The investment’s `last_synced_at` updates on success.

INDmoney pages may sit behind Cloudflare. If the fetch returns a challenge page, sync fails with a clear error instead of empty holdings.

---

## 8. Local setup

1. Create the project and disable confirm-email for local testing (Authentication → Providers → Email).
2. Run `schema.sql`. There is no seed data — every account starts empty.
3. Put `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env.local`.
4. Restart `npm run dev`.
5. Register a new account and complete onboarding. Pages show an empty state until you add holdings.

---

## 9. Production checklist

Vercel steps and the exact env vars are in [VERCEL.md](./VERCEL.md).

- Turn on email confirmation (or add a stronger factor).
- Set Site URL and redirect URLs to the real HTTPS origin.
- Enforce HTTPS. Cookies already use `Secure` when `NODE_ENV=production`.
- Keep the service role out of the Next.js app and CI logs.
- Nested catalog tables already use owner-only RLS. Keep writes on the user JWT; do not bypass RLS with a service role from the app.
- Prefer official portfolio files over HTML scraping if you extend the sync path.
- Rotate the anon key if it is ever committed.
- Enable leaked-password protection (Authentication → Policies). It is off by default and the Supabase advisor flags it.
- Run the verification queries in [SCHEMA_GUIDE.md](./SCHEMA_GUIDE.md) after any schema change.

The advisor also reports that `delete_own_account()` is a security-definer function callable by signed-in users. That is intentional: it is how self-service account deletion works. It derives the target from `auth.uid()` and takes no arguments, and the BFF re-checks the password before calling it.

---

## 10. Files

```text
docs/SUPABASE.md                 This guide
docs/ER.md                       Tables, fields, ER diagram
docs/SCHEMA_GUIDE.md             Per-column feature map and verification queries
supabase/schema.sql              Tables, comments, RLS, trigger, delete_own_account()
supabase/seed.sql                Notes (no sample portfolio)
supabase/functions/extract-url   Optional Edge Function for later crawl jobs
src/lib/supabase/server.ts       Cookie SSR client
src/lib/supabase/database.types.ts
src/lib/api/supabase/handlers.ts Data + auth
src/lib/api/provider.ts          SUPABASE_URL + SUPABASE_ANON_KEY
```

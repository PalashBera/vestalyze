# Supabase Backend

This document is the contract for running the Vestalyze API on **Supabase Auth + Postgres**.

The browser still calls Next.js `/api/v1/...`. Next.js is the BFF:

1. The browser sends the request with cookies.
2. Next.js creates a Supabase server client from those cookies.
3. Supabase Auth identifies the user. Row Level Security scopes every query to that user.
4. Look-through math stays in `src/lib/finance`. Supabase stores data; it does not reimplement exposure formulas.

Set `API_PROVIDER=supabase` to use this path. The in-memory provider (`API_PROVIDER=mock`) remains the default for local UI work without a project. Both providers scope nested data by user.

The `/api/v1` JSON shapes stay the same in both providers so the UI does not change.

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

| Variable                | Where to find it                             | Client?     |
| ----------------------- | -------------------------------------------- | ----------- |
| `API_PROVIDER=supabase` | App config                                   | Server      |
| `SUPABASE_URL`          | Project Settings → API → Project URL         | Server only |
| `SUPABASE_ANON_KEY`     | Project Settings → API → `anon` `public` key | Server only |

The URL is not a secret. The anon key is meant to be used with RLS. This app keeps both on the server because the browser never talks to Supabase directly.

Never commit `service_role`. Never put it in `NEXT_PUBLIC_*`.

Example:

```bash
API_PROVIDER=supabase
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=
```

---

## 3. Apply schema and seed

In the Supabase SQL editor, run in order:

1. [`supabase/schema.sql`](../supabase/schema.sql) — tables, trigger, owner-only RLS
2. [`supabase/seed.sql`](../supabase/seed.sql) — notes only; FX defaults live on `profiles`

There is no sample portfolio. New users add holdings in onboarding. Company names from fund syncs and direct stocks they enter are stored in `securities` under their `user_id`.

---

## 4. Tables

| Table               | Purpose                                    | RLS                                 |
| ------------------- | ------------------------------------------ | ----------------------------------- |
| `profiles`          | Name, display currency, and USD/INR rate   | Own row only                        |
| `securities`        | Per-user security master                   | Owner CRUD (`user_id = auth.uid()`) |
| `funds`             | Per-user mutual funds and ETFs             | Owner CRUD                          |
| `fund_holdings`     | Per-user allocation %                      | Owner CRUD                          |
| `investments`       | User positions (invested amount + units)   | Owner CRUD                          |
| `investment_syncs`  | Per-investment scrape history              | Owner CRUD                          |

`profiles.id` references `auth.users(id)`. A trigger `handle_new_user` inserts a profile from `raw_user_meta_data.name` on signup, with default FX `87.25`.

Securities are unique on `(user_id, ticker, country)`. Two accounts can own the same ticker without colliding.

---

## 5. Authentication

| App endpoint                 | Supabase call                   |
| ---------------------------- | ------------------------------- |
| `POST /api/v1/auth/register` | `auth.signUp` + profile trigger |
| `POST /api/v1/auth/login`    | `auth.signInWithPassword`       |
| `POST /api/v1/auth/logout`   | `auth.signOut`                  |
| `GET /api/v1/auth/me`        | `auth.getUser` + `profiles`     |

Sessions are stored in **HttpOnly**, `SameSite=Lax` cookies by `@supabase/ssr`. `Secure` is set in production. The proxy treats `sb-*-auth-token*` cookies as a signed-in session.

Login errors stay generic: `Invalid username or password`.

Password rules in the app: 8–128 characters. Paste is allowed.

If Confirm email is on and there is no session after signup, the API returns: `Account created. Confirm the email before signing in.`

---

## 6. API mapping

Same paths as the in-memory API. When `API_PROVIDER=supabase`, handlers in `src/lib/api/supabase/handlers.ts` run. Catalog routes still require a session and only return the caller’s rows.

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

## 8. How to switch

1. Create the project and disable confirm-email for local testing (Authentication → Providers → Email).
2. Run `schema.sql` then `seed.sql`.
3. Put `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env.local`.
4. Set `API_PROVIDER=supabase`.
5. Restart `npm run dev`.
6. Register a new account and complete onboarding. Pages stay on a blurred preview until you add holdings.

To go back to the in-memory API: `API_PROVIDER=mock`.

---

## 9. Production checklist

- Turn on email confirmation (or add a stronger factor).
- Set Site URL and redirect URLs to the real HTTPS origin.
- Enforce HTTPS. Cookies already use `Secure` when `NODE_ENV=production`.
- Keep the service role out of the Next.js app and CI logs.
- Nested catalog tables already use owner-only RLS. Keep writes on the user JWT; do not bypass RLS with a service role from the app.
- Prefer official portfolio files over HTML scraping when you replace the refresh stubs.
- Rotate the anon key if it is ever committed.

---

## 10. Files

```text
docs/SUPABASE.md                 This guide
supabase/schema.sql              Tables, RLS, trigger
supabase/seed.sql                Notes (no sample portfolio)
supabase/functions/extract-url   Optional Edge Function for later crawl jobs
src/lib/supabase/server.ts       Cookie SSR client
src/lib/supabase/database.types.ts
src/lib/api/supabase/handlers.ts Data + auth
src/lib/api/provider.ts          mock | supabase
```

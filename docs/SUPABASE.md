# Supabase Backend

This document is the contract for running the Look-Through Portfolio API on **Supabase Auth + Postgres**.

The browser still calls Next.js `/api/v1/...`. Next.js is the BFF:

1. The browser sends the request with cookies.
2. Next.js creates a Supabase server client from those cookies.
3. Supabase Auth identifies the user. Row Level Security scopes every query.
4. Look-through math stays in `src/lib/finance`. Supabase stores data; it does not reimplement exposure formulas.

Set `API_PROVIDER=supabase` to use this path. `mock` remains the default for local UI work without a project.

The `/api/v1` JSON shapes stay the same in both providers so the UI does not change.

---

## 1. Create a project

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Wait until the database is ready.
3. **Authentication → Providers → Email**: enable email + password.
4. **Authentication → Providers → Email → Confirm email**: turn **off** for local development so `signUp` returns a session immediately. Turn it on in production.
5. **Authentication → Settings**: set a Site URL of `http://localhost:3000` for local work.

Do not use the service role key in this app. Catalog data is loaded with SQL. Every request uses the anon key plus the user JWT so RLS applies.

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

1. [`supabase/schema.sql`](../supabase/schema.sql) — tables, trigger, `clone_sample_portfolio()`, RLS
2. [`supabase/seed.sql`](../supabase/seed.sql) — securities, funds, holdings, FX, data sources

That seed is the same catalog the mock API uses (PPFAS, HDFC Mid-Cap, Nifty BeES, VOO, QQQ, and the security master).

New users do **not** get rows from `seed.sql`. After register, Next.js calls `clone_sample_portfolio()`, which inserts the sample positions for `auth.uid()`.

---

## 4. Tables

| Table                     | Purpose                             | RLS                                         |
| ------------------------- | ----------------------------------- | ------------------------------------------- |
| `profiles`                | Display name and reporting currency | Own row only                                |
| `securities`              | Security master                     | Authenticated read                          |
| `funds`                   | Mutual funds and ETFs               | Authenticated read; update for refresh stub |
| `fund_holdings`           | Allocation % by fund and date       | Authenticated read                          |
| `investments`             | User positions                      | CRUD where `user_id = auth.uid()`           |
| `investment_transactions` | Lots                                | Via parent investment ownership             |
| `data_sources`            | Scraper registry                    | Authenticated read/update                   |
| `scraping_logs`           | Job history                         | Authenticated read/insert                   |
| `url_extractions`         | Raw page text from a pasted URL     | Own rows only                               |
| `fx_rates`                | USD/INR                             | Authenticated read                          |

`profiles.id` references `auth.users(id)`. A trigger `handle_new_user` inserts a profile from `raw_user_meta_data.name` on signup.

---

## 5. Authentication

| App endpoint                 | Supabase call                                   |
| ---------------------------- | ----------------------------------------------- |
| `POST /api/v1/auth/register` | `auth.signUp` + `rpc('clone_sample_portfolio')` |
| `POST /api/v1/auth/login`    | `auth.signInWithPassword`                       |
| `POST /api/v1/auth/logout`   | `auth.signOut`                                  |
| `GET /api/v1/auth/me`        | `auth.getUser` + `profiles`                     |

Sessions are stored in **HttpOnly**, `SameSite=Lax` cookies by `@supabase/ssr`. `Secure` is set in production. The proxy treats `sb-*-auth-token*` cookies as a signed-in session.

Login errors stay generic: `Invalid username or password`.

Password rules in the app: 8–128 characters. Paste is allowed.

If Confirm email is on and there is no session after signup, the API returns: `Account created. Confirm the email before signing in.`

---

## 6. API mapping

Same paths as the mock API. When `API_PROVIDER=supabase`, handlers in `src/lib/api/supabase/handlers.ts` run.

| HTTP             | Path                                          | Supabase work                                       |
| ---------------- | --------------------------------------------- | --------------------------------------------------- |
| GET/POST         | `/investments`                                | `investments` select / insert                       |
| GET/PATCH/DELETE | `/investments/:id`                            | Scoped by `user_id`                                 |
| GET/POST         | `/investments/:id/transactions`               | `investment_transactions`                           |
| DELETE           | `/transactions/:id`                           | Delete if the user owns the parent                  |
| GET              | `/funds`, `/funds/:id`, `/funds/:id/holdings` | Catalog read                                        |
| POST             | `/funds/:id/refresh`                          | Updates `last_scraped_at` (scraper stub)            |
| GET              | `/securities`, `/securities/:id`              | Security master                                     |
| GET              | `/portfolio/*`                                | Load investments + holdings, then `src/lib/finance` |
| GET/POST         | `/data-sources`, `/data-sources/:id/refresh`  | Registry + log insert                               |
| GET              | `/scraping-logs`                              | Recent jobs                                         |
| POST             | `/extract`                                    | Fetch a public URL, store row in `url_extractions`  |
| GET              | `/extract`                                    | Recent extractions for the signed-in user           |
| GET/PATCH        | `/settings`                                   | `profiles.display_currency`                         |
| GET              | `/fx/rate`                                    | `fx_rates`                                          |

Look-through formula (unchanged):

```text
effective_exposure = invested_amount × (allocation_percentage / 100)
```

Combine the same company across funds, ETFs, and direct stocks.

---

## 7. URL extraction

Yes — scraping can use Supabase. This first pass only extracts title, description, and text from a random public URL. Holdings parsers come later.

How it works:

1. The signed-in user posts `{ "url": "https://..." }` to `/api/v1/extract`.
2. Next.js validates the URL (http/https only, no credentials, no private/localhost hosts after DNS).
3. It fetches the page with a timeout and size cap, then strips scripts/styles to plain text.
4. The row is stored in `url_extractions` under RLS (`user_id = auth.uid()`).
5. `extract-url` is also deployed as a JWT-protected Edge Function for later crawl jobs. The app path does not need it yet.

Blocked by design: `file://`, `gopher://`, localhost, link-local, private RFC1918 ranges, and oversized/non-text responses.

Use **Data sources → Extract a URL** to try it.

---

## 8. How to switch

1. Create the project and disable confirm-email for local testing (Authentication → Providers → Email).
2. Run `schema.sql` then `seed.sql` (already applied on project `yqpigjistuentvbvlabd` via MCP).
3. Put `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env.local`.
4. Set `API_PROVIDER=supabase`.
5. Restart `npm run dev`.
6. Register a new account. You should see the sample portfolio.

To go back to the in-memory API: `API_PROVIDER=mock`.

---

## 9. Production checklist

- Turn on email confirmation (or add a stronger factor).
- Set Site URL and redirect URLs to the real HTTPS origin.
- Enforce HTTPS. Cookies already use `Secure` when `NODE_ENV=production`.
- Keep the service role out of the Next.js app and CI logs.
- Tighten `funds` / `data_sources` update policies if this is no longer a single-user app (write only from a scraper worker).
- Prefer official portfolio files over HTML scraping when you replace the refresh stubs.
- Rotate the anon key if it is ever committed.

---

## 10. Files

```text
docs/SUPABASE.md                 This guide
supabase/schema.sql              Tables, RLS, trigger, clone function
supabase/seed.sql                Catalog + FX
supabase/functions/extract-url   Optional Edge Function for later crawl jobs
src/lib/supabase/server.ts       Cookie SSR client
src/lib/supabase/database.types.ts
src/lib/api/supabase/handlers.ts Data + auth
src/lib/api/provider.ts          mock | supabase
```

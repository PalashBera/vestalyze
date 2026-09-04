# Look-Through Portfolio

Personal investment intelligence dashboard for Indian mutual funds, Indian ETFs, US stocks, and US ETFs. The app combines your invested amounts with fund/ETF holdings to show **actual company-level exposure**.

The UI talks only to Next.js `/api/v1`. The BFF can serve **mock** or **Supabase**.

See [docs/SUPABASE.md](docs/SUPABASE.md) for Auth, schema, RLS, seed, and how to switch providers.

## Stack

- Next.js 16 (App Router) and React 19
- Tailwind CSS 4 and shadcn/ui
- Cookie session authentication (mock cookie or Supabase SSR cookies)
- Dark, black, and light themes

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Copy `.env.example` to `.env.local` (gitignored).

| Variable | Notes |
| --- | --- |
| `API_PROVIDER` | `mock` (default) or `supabase` |
| `DEMO_USER_EMAIL` | Mock only. Seeds a demo login when both demo values are set. |
| `DEMO_USER_PASSWORD` | Mock only. Local only. Never commit this. |
| `SUPABASE_URL` | Required when `API_PROVIDER=supabase`. Server only. |
| `SUPABASE_ANON_KEY` | Required when `API_PROVIDER=supabase`. Server only. |

With `mock`, register a new account to get the sample portfolio.

With `supabase`, create a project, run `supabase/schema.sql` then `supabase/seed.sql`, set the two Supabase variables, and register. See [docs/SUPABASE.md](docs/SUPABASE.md).

## What you can do

- Sign in / register
- Review total invested, current value, P/L, India vs US, and type mix
- Add mutual funds, ETFs, and direct stocks
- Open look-through holdings and company drill-down
- Inspect fund overlap and data-source refresh
- Switch display currency (INR / USD) and theme (light / dark / black)

## Project layout

```text
src/app/api/v1/[...slug]     BFF routes (mock or Supabase)
src/lib/api/mock             In-memory catalog + handlers
src/lib/api/supabase         Supabase Auth + Postgres handlers
src/lib/finance              Exposure and FX math
supabase/schema.sql          Tables, RLS, sample-portfolio RPC
supabase/seed.sql            Security master, funds, holdings
docs/SUPABASE.md             Supabase setup
```

## Security notes

- Session cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- Mock passwords are hashed with scrypt. Supabase Auth hashes passwords on their side.
- Auth errors stay generic.
- Supabase secrets stay on the server. Do not add a service role key to this repo.

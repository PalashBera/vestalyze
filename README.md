# Vestalyze

Personal look-through investing for Indian mutual funds, ETFs, and US stocks. Vestalyze shows **where your money actually sits** after you add your own holdings. Nothing is preloaded. Each account only sees its own book.

The UI talks only to Next.js `/api/v1`. The BFF can serve an in-memory API or **Supabase**.

See [docs/SUPABASE.md](docs/SUPABASE.md) for Auth, schema, RLS, and how to switch providers.

## Stack

- Next.js 16 (App Router) and React 19
- Tailwind CSS 4 and shadcn/ui
- Cookie session authentication (in-memory cookie or Supabase SSR cookies)
- Dark, light, and system themes

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register, then complete onboarding.

### Environment

Copy `.env.example` to `.env.local` (gitignored).

| Variable             | Notes                                                                               |
| -------------------- | ----------------------------------------------------------------------------------- |
| `API_PROVIDER`       | `mock` (default, in-memory) or `supabase`                                           |
| `DEMO_USER_EMAIL`    | In-memory only. Seeds a local login when both demo values are set. Empty portfolio. |
| `DEMO_USER_PASSWORD` | In-memory only. Local only. Never commit this.                                      |
| `SUPABASE_URL`       | Required when `API_PROVIDER=supabase`. Server only.                                 |
| `SUPABASE_ANON_KEY`  | Required when `API_PROVIDER=supabase`. Server only.                                 |

## What you can do

- Land on the public home page, then sign in or register
- Walk through onboarding (currency + first holdings)
- Review invested totals, India vs US, and type mix
- Sort consolidated stock exposure by company, category, market, total, and weight
- Open look-through holdings and company drill-down
- Paste a fund URL on an investment and sync the stock split from the holdings section
- Switch display currency (INR / USD), set your USD/INR rate, and pick a theme (light / dark / system)

## Project layout

```text
src/app/api/v1/[...slug]     BFF routes (in-memory or Supabase)
src/lib/api/mock             In-memory handlers (still tenant-scoped by user)
src/lib/api/supabase         Supabase Auth + Postgres handlers
src/lib/finance              Exposure and FX math
supabase/schema.sql          Tables and owner-only RLS
supabase/seed.sql            Notes only; FX defaults live on profiles
docs/SUPABASE.md             Supabase setup
```

## Security notes

- Session cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- In-memory passwords are hashed with scrypt. Supabase Auth hashes passwords on their side.
- Auth errors stay generic.
- Nested catalog rows (`securities`, `funds`, `fund_holdings`) are scoped with `user_id`. FX lives on the owner profile.
- Supabase secrets stay on the server. Do not add a service role key to this repo.

# Vestalyze

Personal look-through investing for Indian mutual funds, ETFs, and US stocks. Vestalyze shows **where your money actually sits** after you add your own holdings. Nothing is preloaded. Each account only sees its own book.

The UI talks only to Next.js `/api/v1`. The BFF stores auth and holdings in **Supabase**.

See [docs/SUPABASE.md](docs/SUPABASE.md) for Auth, schema, and RLS. See [docs/VERCEL.md](docs/VERCEL.md) to deploy on Vercel and which environment variables to set.

## Stack

- Next.js 16 (App Router) and React 19
- Tailwind CSS 4 and shadcn/ui
- Supabase Auth + Postgres (HttpOnly SSR cookies)
- Dark, light, and system themes

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill `SUPABASE_URL` and `SUPABASE_ANON_KEY` from the Supabase project (Project Settings → API). Apply [`supabase/schema.sql`](supabase/schema.sql) once. Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register, then complete onboarding.

### Environment

Copy `.env.example` to `.env.local` (gitignored). Both values are server-only.

| Variable            | Notes                                         |
| ------------------- | --------------------------------------------- |
| `SUPABASE_URL`      | Project Settings → API → Project URL.         |
| `SUPABASE_ANON_KEY` | Project Settings → API → `anon` `public` key. |

Never commit the `service_role` key. Never put these in `NEXT_PUBLIC_*`.

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
src/app/api/v1/[...slug]     BFF routes (Supabase)
src/lib/api/supabase         Auth + Postgres handlers
src/lib/finance              Exposure and FX math
supabase/schema.sql          Tables and owner-only RLS
supabase/seed.sql            Notes only; FX defaults live on profiles
docs/SUPABASE.md             Supabase setup
docs/VERCEL.md               Vercel deploy
```

## Security notes

- Session cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- Supabase Auth hashes passwords.
- Auth errors stay generic.
- Nested catalog rows (`securities`, `funds`, `fund_holdings`) are scoped with `user_id`. FX lives on the owner profile.
- Supabase secrets stay on the server. Do not add a service role key to this repo.

# Vestalyze

Personal look-through investing for Indian mutual funds, ETFs, and US stocks. Vestalyze shows **where your money actually sits** after you add your own holdings. Nothing is preloaded. Each account only sees its own book.

The UI talks only to Next.js `/api/v1`. The BFF stores auth and holdings in **Supabase**.

See [docs/SUPABASE.md](docs/SUPABASE.md) for Auth, schema, and RLS. See [docs/ER.md](docs/ER.md) for the table diagram and field purposes. See [docs/VERCEL.md](docs/VERCEL.md) to deploy on Vercel and which environment variables to set.

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

Fill `SUPABASE_URL` and `SUPABASE_ANON_KEY` from the Supabase project (Project Settings → API). On a new project, apply [`supabase/schema.sql`](supabase/schema.sql) (it drops and recreates app tables). Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register, then complete onboarding.

### Environment

Copy `.env.example` to `.env.local` (gitignored). Every value is server-only.

| Variable             | Notes                                                                                |
| -------------------- | ------------------------------------------------------------------------------------ |
| `SUPABASE_URL`       | Project Settings → API → Project URL.                                                |
| `SUPABASE_ANON_KEY`  | Project Settings → API → `anon` `public` key.                                        |
| `RESEND_API_KEY`     | Contact form delivery. Create at [resend.com/api-keys](https://resend.com/api-keys). |
| `CONTACT_FROM_EMAIL` | Sender, e.g. `Vestalyze <hello@yourdomain.com>`. Domain must be verified in Resend.   |
| `CONTACT_TO_EMAIL`   | Inbox that receives contact requests.                                                  |

Never commit the `service_role` key or the Resend key. Never put these in `NEXT_PUBLIC_*`.

Without `RESEND_API_KEY` the contact form returns a 503 and tells the visitor delivery is not
configured, rather than silently dropping the message. `CONTACT_FROM_EMAIL` defaults to Resend's
sandbox sender, which only delivers to the address that owns the Resend account — the visitor
acknowledgement needs a verified domain.

## What you can do

- Land on the public home page, then sign in or register
- Walk through onboarding (currency + first holdings)
- Review invested totals, India vs US, and type mix
- Sort consolidated stock exposure by company, market, total, and weight
- Open look-through holdings and company drill-down
- Paste a fund URL on an investment and sync the stock split from the holdings section
- Switch display currency (INR / USD), set your USD/INR rate, and pick a theme (light / dark / system)
- Delete your account from Settings — that also erases every holding stored with it
- Send a note from the landing page contact form; the team is notified and the sender gets a receipt

## Project layout

```text
src/app/api/v1/[...slug]     BFF routes (Supabase)
src/lib/api/supabase         Auth + Postgres handlers
src/lib/email                Resend delivery and contact email templates
src/lib/finance              Exposure and FX math
supabase/schema.sql          Tables and owner-only RLS
supabase/seed.sql            Notes only; FX defaults live on profiles
docs/SUPABASE.md             Supabase setup
docs/ER.md                   Data model and ER diagram
docs/VERCEL.md               Vercel deploy
```

## Security notes

- Session cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- Supabase Auth hashes passwords.
- Auth errors stay generic.
- Nested catalog rows (`securities`, `funds`, `fund_holdings`) are scoped with `user_id`. FX lives on the owner profile.
- Supabase secrets stay on the server. Do not add a service role key to this repo.

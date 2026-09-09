# Deploy Vestalyze to Vercel

Use this when you ship the Next.js app to Vercel. The browser still talks only to `/api/v1`. Vercel runs that BFF against the same **Supabase** project you use locally.

---

## Environment variables

Set these in the Vercel project: **Settings → Environment Variables**. Apply them to **Production** (and **Preview** if you want preview deploys to hit the same backend).

None of these are `NEXT_PUBLIC_*`. The browser never talks to Supabase. Keep them server-only.

### Required

| Name                | Value                                  | Where to get it                                     |
| ------------------- | -------------------------------------- | --------------------------------------------------- |
| `SUPABASE_URL`      | `https://YOUR_PROJECT_REF.supabase.co` | Supabase → **Project Settings → API → Project URL** |
| `SUPABASE_ANON_KEY` | the `anon` `public` key                | Supabase → **Project Settings → API → anon public** |

The URL is not a secret. The anon key is designed to be used with Row Level Security. This app still keeps both on the server.

Example (placeholders only):

```bash
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
```

After you save variables, **redeploy** so the new values are picked up. Changing env vars does not update a running deployment.

### Do not set on Vercel

| Name                        | Why                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------- |
| Supabase `service_role` key | Bypasses RLS. This app must not have it. Never add it to Vercel or `NEXT_PUBLIC_*`. |

`NODE_ENV=production` is set by Vercel. You do not add it.

---

## Before the first deploy

1. Create a Supabase project if you do not have one. See [SUPABASE.md](./SUPABASE.md).
2. In the SQL editor, run [`supabase/schema.sql`](../supabase/schema.sql). Run [`supabase/seed.sql`](../supabase/seed.sql) if you have not already (notes only; no sample portfolio).
3. **Authentication → Providers → Email**: enable email + password.
4. **Authentication → Providers → Email → Confirm email**: turn **on** for production, or accept that anyone who can receive mail at that address can finish signup immediately if it stays off.
5. **Authentication → URL Configuration**:
   - **Site URL**: your production origin, e.g. `https://your-app.vercel.app` (or your custom domain).
   - **Redirect URLs**: add the same origin, plus `https://your-app.vercel.app/**` if you use email confirm / magic-link redirects later. Add `http://localhost:3000/**` if you still develop locally against this project.

Until Site URL matches the Vercel origin, signup/login cookies can look fine locally and fail in production.

---

## Connect the repo

1. Push this branch to GitHub.
2. In [Vercel](https://vercel.com), **Add New → Project** and import the repo.
3. Framework Preset: **Next.js**. Leave Build Command (`next build` / `npm run build`) and Output as defaults. Install Command: `npm install`.
4. Add the two required environment variables above **before** the first production deploy.
5. Deploy.

Root directory is the repo root. There is no `vercel.json`; Next.js 16 is enough.

---

## After deploy

1. Open `https://your-app.vercel.app`.
2. Register a new account (or confirm email, then sign in).
3. Complete onboarding and add a fund URL.
4. Sync holdings and confirm the Status tag shows **Success**.
5. If login fails with a generic error, confirm the two Supabase env vars and that Site URL is the HTTPS Vercel origin.

Preview deployments get a `*.vercel.app` URL per commit. Either add those patterns under Supabase Redirect URLs, or only test auth on Production.

---

## Checklist

- [ ] `schema.sql` applied on the Supabase project
- [ ] `SUPABASE_URL` and `SUPABASE_ANON_KEY` set on Vercel (Production)
- [ ] No `service_role` or `NEXT_PUBLIC_` Supabase keys
- [ ] Supabase Site URL is the Vercel HTTPS origin
- [ ] Email confirmation policy decided
- [ ] Redeployed after saving env vars

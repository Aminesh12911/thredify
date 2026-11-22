# Deploying THREADIFY to Vercel (with Supabase)

THREADIFY is an academic demo. Deploy it so your lecturer can open a link; do **not** connect a real payment provider or enter real customer data.

There are two ways to deploy. Start with **A** — it needs no database and cannot break.

## A. Demo-mode deployment (no Supabase)

1. Push the project to a GitHub repository. (`.env.local` is git-ignored; `.env.example` is committed.)
2. On [vercel.com](https://vercel.com) → **Add New… → Project** → import the repo. Framework preset: **Next.js** (auto-detected). Build/Output settings: leave defaults (`npm run build`).
3. Add **no** environment variables. Click **Deploy**.
4. Open the URL. The site runs on seed data; carts, orders, accounts and admin data live in each visitor's browser, and a "Demo mode" notice is shown wherever it matters.
5. Admin demo: sign in at `/account/login` with `admin@threadify.example` / `Admin@12345`, open `/admin`, click **Load demo data**. This admin guard exists only in the browser and is **not** real security — it is a demonstration.

## B. Full deployment with Supabase (real database + real auth)

### 1. Create the project
1. [supabase.com](https://supabase.com) → **New project** (free tier is fine). Note the database password.
2. **SQL Editor → New query**: paste `supabase/schema.sql` → **Run**.
   - Run it **once, on a fresh project**. It uses plain `create table`, so running it again on the same project fails with "already exists". To start over, create a new Supabase project.
3. New query: paste `supabase/seed.sql` → **Run**. (Regenerate it any time with `npm run db:seed-sql`. It is safe to run twice.)
4. **Project Settings → API**: copy the **Project URL**, the **anon public** key and the **service_role** key.

### 2. Configure authentication
**Authentication → Providers → Email**: enabled. Decide on **Confirm email**:
- *On* (recommended for a public site): sign-up shows "check your inbox"; Supabase's built-in mailer is heavily rate-limited, so for a class demo you may prefer *off*.
- *Off*: accounts work immediately.

**Authentication → URL Configuration**: set **Site URL** to your Vercel URL (e.g. `https://threadify-yourname.vercel.app`) and add `https://threadify-yourname.vercel.app/**` to **Redirect URLs**. Add `http://localhost:3000/**` too if you test locally against the same project.

### 3. Add environment variables in Vercel
**Project → Settings → Environment Variables** (apply to Production, Preview and Development as you like):

| Name | Value | Exposure |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | public (by design) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key | public (by design; RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | **secret — server only**. Do not tick any "expose to browser" option |
| `NEXT_PUBLIC_SITE_URL` | your site URL | public |

`NEXT_PUBLIC_*` values are baked in at build time, so **redeploy** after changing them.

### 4. Redeploy and create the first admin
1. **Deployments → ⋯ → Redeploy.** The "Demo mode" notices disappear.
2. Register a normal account on the site.
3. In Supabase **SQL Editor** promote it (roles can only be changed in SQL, never through the API):
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
4. Sign in again → `/admin`. Access is enforced by database row-level security; a customer visiting `/admin` gets a 404.

### 5. Smoke test the live site
Checklist: home loads → `/shop` lists 6 products (from the database) → add to cart → checkout with **Fill with sample test details** → order confirmation shows a `THR-…` code → `/track` finds it → in `/admin/orders` change its status → `/track` shows the new status → customer account can see only its own orders → a second customer cannot open the first one's details.

## Behaviour to know about
- **If Supabase is unreachable, pages show an error rather than silently falling back to seed data.** That is deliberate: it avoids orders for products that don't exist.
- **Stock is decremented atomically when an order is placed** (Supabase mode). A sold-out size returns a clear "just sold out" message and nothing is charged. In demo mode stock is not decremented.
- Product images are generated SVG mock-ups, so there is no image storage to configure. Uploaded design artwork is stored inside the order record, capped at 1.5 M characters per image and 6 MB per request.
- Admin product edits in Supabase mode update the live shop within about a minute (catalogue pages revalidate every 60 s).

## Not configured / out of scope (say so in your report)
- **No real payments.** The checkout simulates outcomes. A real gateway (Razorpay/Stripe in *test* mode) would need its SDK, a server-side payment-intent route and a webhook to confirm payment before creating the order.
- **No email or SMS.** Order confirmations, status updates and contact-form replies are not sent. (Supabase Auth emails for sign-up confirmation are separate and only work in Supabase mode.)
- **No rate limiting or CAPTCHA** on sign-up, the order API or the contact form (anyone may insert enquiries by design). Before a public launch add Vercel's firewall/rate limits or Cloudflare Turnstile.
- **No password-reset page** (Supabase can send reset emails, but the UI is not built).
- **Policies are sample drafts** and the business details are placeholders. They must be replaced and reviewed by a professional before any real use.
- **Custom domain:** Vercel → Settings → Domains, then update `NEXT_PUBLIC_SITE_URL` and the Supabase Site/Redirect URLs.

## Troubleshooting
| Symptom | Likely cause / fix |
|---|---|
| Build fails on Vercel with a TypeScript error | Run `npm run build` locally; Vercel uses the same command. |
| Site still says "Demo mode" after adding env vars | Variables were added after the build. Redeploy. |
| Shop shows "database couldn't be reached" | Wrong URL/anon key, project paused (free tier pauses after inactivity), or schema/seed not run. |
| Checkout says "orders API isn't configured" | `SUPABASE_SERVICE_ROLE_KEY` missing in Vercel. |
| Checkout says an item "just sold out" | Stock for that size is 0 — edit stock in `/admin/products`. |
| Sign-in loops or "confirm your email" | Email confirmation is on; click the email link, or turn confirmation off. Check Redirect URLs. |
| `/admin` returns 404 when signed in | Your profile's `role` is still `customer` — run the SQL in step 4. |

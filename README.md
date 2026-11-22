# THREADIFY — Custom T-Shirt Studio

> **Wear Your Point of View.**

An e-commerce site for ready-made graphic tees and personalised printed T-shirts, built for the *IT & E-Business Fundamentals* semester project.

**This is an academic demo.** All businesses, customers, orders and payments are fictional. No real money is ever accepted, and the site never asks for or stores card numbers, CVV codes, UPI PINs or any other payment credentials.

| | |
|---|---|
| Stack | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase (Postgres + Auth) · Vercel |
| Runs without any account | **Yes — demo mode** (seed data + browser-local storage) |
| Real database + auth | Optional — connect Supabase (guide below) |

Documents: **[Feature checklist & honest status](docs/FEATURES.md)** · **[Vercel / Supabase deployment guide](docs/DEPLOYMENT.md)**

---

## 1. Install and run

Requirements: **Node.js 20+** and npm.

```bash
npm install
cp .env.example .env.local     # optional — leave the Supabase values blank for demo mode
npm run dev                    # http://localhost:3000
```

Production build: `npm run build && npm start`.

### Things to try in demo mode
| What | How |
|---|---|
| Shop & studio | `/shop`, `/studio` |
| Coupons | `WELCOME10` (10% off), `FLAT100` (₹100 off ₹799+), `FREESHIP` |
| Checkout | Press **Fill with sample test details**, choose a payment scenario: *succeeds*, *declined* or *gateway error* |
| Track an order | `/track` with the `THR-…` code shown after checkout |
| Admin dashboard | Sign in at `/account/login` with `admin@threadify.example` / `Admin@12345`, open `/admin`, click **Load demo data** |

In demo mode the admin guard exists only in your browser (**not real security**) and product edits stay in your browser — they do not change the public shop. Both facts are labelled in the UI.

## 2. Environment variables

Copy `.env.example` to `.env.local`.

| Variable | Needed for | Exposure |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Real database/auth | Public by design |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Real database/auth | Public by design — row-level security protects data |
| `SUPABASE_SERVICE_ROLE_KEY` | Writing orders through the API route | **Secret, server-only.** Never prefix with `NEXT_PUBLIC_`; never commit |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, Open Graph | Public |

If the two `NEXT_PUBLIC_SUPABASE_*` values are blank the app runs in **demo mode**.

## 3. Database setup (optional)

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor** → run `supabase/schema.sql` (once, on a fresh project), then `supabase/seed.sql`
   (regenerate with `npm run db:seed-sql`).
3. Put the project URL, anon key and service-role key in `.env.local` (Project Settings → API).
4. Authentication → Providers → Email: choose whether to require email confirmation; set the Site URL.
5. Run the app, register an account, then make yourself an admin (roles can only be changed in SQL):
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

In Supabase mode the catalogue comes from the database and the app **shows an error rather than silently falling back to sample data** if the database is unreachable. Orders are written by one atomic SQL function (`create_order`) that re-prices the cart on the server, checks and decrements stock, and rolls everything back on any failure.

Full step-by-step instructions, including Vercel: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

## 4. Testing

```bash
npm run test:all      # everything below, in one command
npm test              # unit tests only
npm run test:sql      # SQL / row-level-security tests only
npm run test:browser  # build in demo mode + Playwright browser suites only
npm run lint && npx tsc --noEmit
```

`test:all` needs Node 20+ and, for the browser suites, Python 3 with Playwright:

```bash
pip install playwright && playwright install chromium
```

Optional env: `PYTHON`, `CHROME_PATH` (use an installed Chrome instead of Playwright's Chromium), `TEST_PORT` (3100), `TEST_PORT_SB` (3200). The runner builds into `.next`, so stop `npm run dev` first. Flags: `--only=unit,sql,browser,supabase`, `--skip-build`.

| Suite | What it covers | Checks |
|---|---|---|
| Unit (`tests/*.test.mts`) | Pricing, shipping, coupons, server-side order validation, admin stats | 24 |
| SQL (`tests/sql`) | `schema.sql` + `seed.sql` in an in-memory Postgres (PGlite): RLS, atomic orders, stock, roles, constraints | 55 |
| Browser phases 3–8 (`tests/browser`) | Shop, studio, cart/checkout, auth, admin, About/Contact/policies, SEO, security headers, responsive (360/390/768/1280 px), dead-link crawl | 312 |
| Supabase-mode (`supabase_mode.py`) | API validation with placeholder keys, fail-loudly behaviour, service-role key absent from logs and all client JS | 17 |

**What testing does not cover:** a live Supabase project, real phones, Safari/Firefox, screen readers, or Lighthouse performance scoring. See the limitations below.

## 5. Project structure

```
src/
  app/              routes: (site)/ storefront, admin/, api/orders, sitemap, robots, 404/error
  components/       layout, home, shop, studio, cart, checkout, orders, account, contact, admin, ui, seo
  lib/
    supabase/       browser / server / service-role (server-only) / public clients
    auth/           demo auth (PBKDF2) + Supabase auth, provider, addresses
    products/       seed catalogue, DB-backed service, custom-design pricing
    cart/           cart store, coupons, totals
    checkout/       validation, sandbox payment simulator
    orders/         order codes, demo store, service, lookup hooks
    admin/          admin API (Supabase under RLS | demo), stats, demo data
    enquiries/      contact / custom-design enquiries
    policies/       sample policy text      site.ts  sample business details + FAQ
    server/         server-side order pricing & validation
  proxy.ts          session refresh + early redirect of signed-out visitors from /admin
supabase/           schema.sql (tables, RLS, create_order) and seed.sql
tests/              unit, sql, browser, run-all.mjs
docs/               FEATURES.md, DEPLOYMENT.md
```

## 6. Security notes

- Prices are **never** read from the browser: `/api/orders` re-prices every line from the catalogue and applies coupons itself.
- Passwords: Supabase Auth in real mode; in demo mode salted PBKDF2-SHA256 (210k iterations) with a generic login error.
- `/admin`: proxy redirect → server layout check (404 for non-admins) → client guard → **row-level security** (the real enforcement).
- Uploaded artwork must be a PNG/JPEG data URL under a size cap; external image URLs are rejected.
- Security headers: `nosniff`, frame-deny, referrer-policy, permissions-policy. A Content-Security-Policy is not set yet.
- `npm audit --omit=dev` reports 0 vulnerabilities (at time of writing).

## 7. Build progress

- [x] Phase 1 — design system, architecture, schema, demo-mode configuration
- [x] Phase 2 — homepage and navigation
- [x] Phase 3 — shop and product pages
- [x] Phase 4 — custom T-shirt studio
- [x] Phase 5 — cart, checkout (sandbox), confirmation, tracking
- [x] Phase 6 — backend, database wiring, authentication
- [x] Phase 7 — admin dashboard
- [x] Phase 8 — About, Contact + FAQ, policy pages, SEO, responsive pass
- [x] Phase 9 — test consolidation, documentation, deployment guide

## 8. Known limitations (summary — details in docs/FEATURES.md)

- **The Supabase code paths have not been run against a live Supabase project.** The SQL is tested in an in-memory Postgres and the API with placeholder keys; sign-up/sign-in, browser-side admin queries and `/api/orders` against a real database still need the smoke test in the deployment guide.
- No real payment gateway, no email/SMS, no password-reset page, no rate limiting or CAPTCHA.
- Product pictures are generated SVG mock-ups; uploaded artwork is stored inside the order record rather than object storage.
- The newsletter form is a UI-only demo. Stock is only decremented in Supabase mode.
- Policies and business details are **sample drafts** and must be replaced and professionally reviewed before any commercial use.

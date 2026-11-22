# THREADIFY — feature checklist and honest status

**Legend**
- ✅ **Built & tested** — implemented and covered by automated tests in this repo (see "How it was verified").
- 🧪 **Demo-mode only** — works, but only against browser-local storage; labelled as such in the UI.
- 🔌 **Built, needs your Supabase project** — code and SQL are written and the SQL is tested in an in-memory Postgres, but it has **not been run against a live Supabase project** (no network/credentials were available while building).
- ⚠️ **Limitation / not built** — stated plainly so it is not mistaken for a working feature.

## Storefront
| Feature | Status | Notes |
|---|---|---|
| Homepage with all 13 elements the brief lists (announcement bar, nav, hero + description + **SEE OUR COLLECTION** → `/shop`, featured, new arrivals, custom-tee banner, brand story, why-choose, sample testimonials, newsletter, footer) | ✅ | Newsletter is a **UI-only demo form**: nothing is stored or sent, and it says so |
| Shop: search, filters (style/size/colour/price), sort, quick view | ✅ | Filters are URL-independent client state |
| Product page: colour/size selection, per-size stock, size guide, related products, care info | ✅ | Product pictures are generated SVG mock-ups, not photographs |
| Custom T-shirt studio: colour, fit, text (font/size/colour), image upload, drag/resize, front/back, live price | ✅ | Artwork limited to PNG/JPEG data URLs |
| Cart: quantities, remove, persistence, coupons (`WELCOME10`, `FLAT100`, `FREESHIP`), shipping rule (free ≥ ₹999 else ₹79) | ✅ | Cart lives in the browser |
| Checkout with validation (Indian phone/PIN/state), saved-details shortcut | ✅ | |
| **Sandbox** payment: success / failure scenarios, double-submit guard | ✅ | Simulated. No card data is ever requested or stored |
| Order confirmation page, order lookup and status timeline (`/track`) | ✅ | |
| Registration, login, logout, session, saved addresses, order history | 🧪 / 🔌 | Demo: salted PBKDF2 in browser storage. Supabase: Supabase Auth |
| About, Contact (form + FAQ), 5 policy pages (clearly labelled drafts) | ✅ | Contact messages reach the admin inbox |
| 404 and error pages, empty/loading/error states | ✅ | |

## Back end
| Feature | Status | Notes |
|---|---|---|
| Server-side order pricing (never trusts client prices), input validation, image validation | ✅ | Unit-tested; API validation checked in Supabase mode with placeholder keys |
| Atomic order creation, unique codes, retry on collision | ✅ (SQL) / 🔌 (API) | Real SQL tested in PGlite |
| **Stock check and decrement at order time**, no overselling, rollback on shortfall | ✅ (SQL) / 🔌 (API) | Supabase mode only; demo mode does not decrement stock |
| Row-level security: customers see only their own data; only admins manage catalogue/orders/enquiries; role can't be self-promoted | ✅ (SQL) | 55 checks |
| Service-role key never reaches the browser | ✅ | Checked in all client JS bundles |
| Security headers (nosniff, frame-deny, referrer, permissions-policy) | ✅ | No Content-Security-Policy yet |

## Admin dashboard
| Feature | Status | Notes |
|---|---|---|
| Overview: products, orders, demo revenue, pending, stock, low-stock, recent orders | ✅ | Revenue counts simulated paid orders |
| Products: add / edit / delete (confirm), per-size stock, validation, duplicate-slug protection | ✅ | Demo mode edits stay in the browser and **do not change the public shop** (labelled) |
| Orders: search, filter, details, status updates (reflected on customer tracking) | ✅ | |
| Customers (from orders + accounts), Enquiries (filter + status) | ✅ | |
| Role-based access | 🧪 / 🔌 | Demo guard is browser-only and **not real security**. Real enforcement = proxy + server layout + RLS in Supabase mode |

## SEO, accessibility, responsiveness
| Feature | Status | Notes |
|---|---|---|
| Unique titles, descriptions, one `<h1>` per page, canonical URLs, Open Graph image, sitemap, robots, Product & Organization JSON-LD | ✅ | Private pages are `noindex` and disallowed in robots.txt |
| No horizontal overflow at 360/390/768/1280 px on every page; tap targets ≥ 36 px on touch widths | ✅ | Tested in Chromium |
| Labelled forms, field-level errors with focus management, keyboard-operable menus/FAQ/dialogs, visible focus | ✅ | Automated checks only |
| Lazy-loaded images, self-hosted fonts | ✅ | |

## Known limitations (read before relying on anything)
- ⚠️ **Supabase paths are unproven against a live project**: sign-up/in, profile reads, the browser-side admin queries and `/api/orders` against a real database. Follow the smoke-test list in `DEPLOYMENT.md` after connecting.
- ⚠️ **No real payments, no email/SMS, no password-reset UI, no rate limiting/CAPTCHA.**
- ⚠️ **Not manually tested**: real phones/Safari/Firefox (automation used Chromium only), screen readers, or Lighthouse performance scores.
- ⚠️ Uploaded artwork is stored inside the order record rather than in object storage; fine for a demo, not for volume.
- ⚠️ Demo-mode order codes are shorter than server-generated ones.
- ⚠️ Policies and business details are samples that need professional review.
- ⚠️ Not built: product image upload, coupon management, refunds, invoices/PDF, CSV export, multi-currency, reviews.

## How it was verified
`npm run test:all` runs everything on any machine with Node 20+ and Python 3 + Playwright:

| Suite | Checks |
|---|---|
| Unit (pricing, shipping, coupons, server-side order validation, admin stats) | 24 |
| SQL / RLS / atomic orders / stock, in-memory Postgres (PGlite) | 55 |
| Browser, demo mode: phases 3–8 (shop, studio, cart/checkout, auth, admin, policies/SEO/responsive) | 312 |
| Supabase-mode API checks with placeholder keys (validation, fail-loudly, no secret leak) | 17 |

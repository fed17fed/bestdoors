# BestDoors – deploy guide (Phase 12)

Production setup:

| Part | Where | Folder |
|---|---|---|
| Shop (Next.js) | Vercel project `bestdoors-web` | `apps/web` |
| API (Express) | Vercel project `bestdoors-api` (one serverless function) | `apps/api` |
| Database | Neon (Postgres) | – |
| Photos | Vercel Blob (connected to `bestdoors-api`) | – |
| Payments / emails | Stripe / Resend | – |

The browser only talks to the shop domain. The shop forwards `/api/*` to the API (Next.js rewrite),
so cookies stay on one domain.

**Order matters: database → API → shop.** The shop build reads the catalog from the API,
so the API must be online before the shop is built. (Pages refresh their data every 60 seconds afterwards.)

---

## 0. Checked locally (done)
- `vercel build` works for both projects (API function 19 MB, shop 5.8 MB)
- CI (`.github/workflows/ci.yml`) runs green in a clean copy without `.env` files
- No secrets in the files git will take (`.env` files are ignored, only `.env.example`)

## 1. GitHub
1. On github.com create an **empty private** repository, e.g. `bestdoors` (no README, no .gitignore).
2. First commit and push (from `all_projects/bestdoors`):
   ```bash
   git add .
   git commit -m "BestDoors: shop, API, admin, tests"
   git remote add origin git@github.com:<user>/bestdoors.git
   git push -u origin main
   ```
3. GitHub → Actions: the CI run should be green.

## 2. Neon (database)
1. Create a project in an EU region close to Ireland, Postgres 16 or newer.
2. Copy two connection strings:
   - **pooled** (host contains `-pooler`) → `DATABASE_URL`
   - **direct** (host without `-pooler`) → `DIRECT_URL`
3. Create the tables (from your computer, in `apps/api`; the strings are not saved anywhere):
   ```bash
   DATABASE_URL="<direct>" DIRECT_URL="<direct>" npx prisma migrate deploy
   ```
4. Admin user and catalog data:
   ```bash
   DATABASE_URL="<direct>" ADMIN_EMAIL="<you>" ADMIN_PASSWORD="<strong password>" npm run db:seed
   ```
   ⚠ The seed also adds the **demo catalog** (doors, categories, options). Decide first if the
   live shop should start with it.

Later schema changes: run step 3 again before the new API version goes live.

## 3. Vercel – API project (`bestdoors-api`)
1. Vercel → Add New → Project → import the GitHub repo.
2. **Root Directory: `apps/api`**. Framework and build command come from `apps/api/vercel.json`
   (Express, `npm run build` = `prisma generate && tsup`). Vercel installs the whole npm workspace.
   Keep "Include files outside the root directory" **on** (needed for `packages/shared`).
3. Environment variables (Production), see `apps/api/.env.example`:
   `DATABASE_URL` (pooled), `DIRECT_URL`, `JWT_SECRET` (new random, 32+ characters),
   `WEB_URL` (for now the future shop URL, e.g. `https://bestdoors-web.vercel.app`),
   `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `SHOP_EMAIL`.
4. Deploy. Check: `https://<api>.vercel.app/api/v1/health` → `{"ok":true}`.
5. Storage → Create → **Blob** → connect to this project → `BLOB_READ_WRITE_TOKEN` is added. Redeploy.

How it runs: `apps/api/index.js` exports the ready bundle `dist/index.js`. (Vercel's own TypeScript
compile of `src/` fails with our workspace package, so it gets the bundle.)

## 4. Vercel – shop project (`bestdoors-web`)
1. Add New → Project → the same repo. **Root Directory: `apps/web`** (Next.js is detected).
2. Environment variables, see `apps/web/.env.example`:
   `API_URL` = `https://<api>.vercel.app`, `NEXT_PUBLIC_SITE_URL` = the shop URL.
3. Deploy. If the shop URL is different from step 3.3, update `WEB_URL` in the API project and redeploy the API.

## 5. Stripe webhook
1. Stripe Dashboard → Developers → Webhooks → Add endpoint:
   `https://<api>.vercel.app/api/v1/stripe/webhook`
2. Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.expired`, `checkout.session.async_payment_failed`.
3. Copy the signing secret (`whsec_…`) → `STRIPE_WEBHOOK_SECRET` in the API project → redeploy.
4. Test mode first (`sk_test_…` key + test webhook). Live keys only when the shop really opens.

## 6. Domain and emails
1. Shop project → Settings → Domains → add `bestdoors.ie` and `www.bestdoors.ie`, set the DNS records Vercel shows.
2. Then change `NEXT_PUBLIC_SITE_URL` (shop) and `WEB_URL` (API) to `https://www.bestdoors.ie`, redeploy both.
3. Resend → Domains → add `bestdoors.ie`, set its DNS records → `EMAIL_FROM` = `BestDoors <orders@bestdoors.ie>`.

## 7. Check after every deploy
- Home page EN and UK, catalog, a product page, cart
- Test payment with card `4242 4242 4242 4242` → order is PAID in `/admin`, emails arrive
- Quote form with a photo → quote in `/admin`, photo visible, email to `SHOP_EMAIL`
- `/sitemap.xml` and `/robots.txt` show the real domain

## Before the real launch (not deploy steps)
- Fill in `apps/web/src/lib/company.ts` (`[TO FILL: …]`), lawyer checks the legal pages, then `legalReviewed: true`
- Rate limit for the quote form (only a honeypot now)
- Stripe live keys + live webhook

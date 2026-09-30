# AgriTrade

A marketplace that connects agricultural **retail buyers** (supermarkets, shops, restaurants, caterers) with **wholesale sellers** (farms, fisheries, aggregators) of eggs, poultry, fish, yam, onions and other farm produce across Nigeria.

## Stack and why

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 15** (App Router, React 19, TypeScript) | One well-supported full-stack framework: server-rendered pages, server actions for mutations, route handlers, image optimisation. |
| Database | **Prisma 6** + **SQLite** (dev) | Typed queries and versioned migrations. SQLite needs zero setup; the schema also runs on PostgreSQL (see below). |
| Auth | Custom, database-backed sessions | Opaque random session tokens in an `httpOnly` cookie; only the SHA-256 hash is stored. Passwords are hashed with bcrypt (cost 12). No third-party auth service is needed. |
| Validation | **Zod** | The same schemas validate on the server for every action. The browser adds native constraints and shows server field errors inline. |
| Styling | Hand-written CSS design system (`app/globals.css`) | No UI framework. Uses design tokens, reduced-motion support and forced-colours support. |

## Getting started

Requirements: **Node.js 20.9+** (Node 22 LTS recommended) and npm.

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # then set SEED_DEMO_PASSWORD to a password of your choice
npm run db:migrate          # creates prisma/dev.db and applies migrations (also seeds)
npm run db:seed             # (re)loads the sample catalogue at any time
npm run dev                 # http://localhost:3000
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

### Demo accounts (sample data)

`npm run db:seed` creates these accounts, all with the password in `SEED_DEMO_PASSWORD`:

| Role | Email |
| --- | --- |
| Admin | `admin@agritrade.test` |
| Buyer | `buyer@agritrade.test`, `buyer2@agritrade.test` |
| Seller (approved) | `seller@agritrade.test`, `delta.fisheries@agritrade.test`, `benue.yams@agritrade.test`, `kano.harvest@agritrade.test`, `ebonyi.grains@agritrade.test` |
| Seller (awaiting approval) | `plateau.growers@agritrade.test` |

Admins can't sign up through the UI. Create them with the seed script or directly in the database, e.g. with `npm run db:studio`.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Prisma connection string. Default `file:./dev.db` (SQLite). |
| `APP_URL` | Public base URL used in password-reset links. |
| `SEED_DEMO_PASSWORD` | Password for sample accounts. The seed script refuses to run without it, and refuses in production unless `ALLOW_PRODUCTION_SEED=true`. |
| `UPLOAD_DIR` | Where uploaded listing photos are stored (default `./uploads`). |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (`sk_test_…` or `sk_live_…`). Without it, development uses a simulated checkout and production can't take payments. |
| `PLATFORM_FEE_PERCENT` | AgriTrade's commission, deducted from the seller's share when escrow is released (default `0`). |

### Using PostgreSQL

1. In `prisma/schema.prisma`, set `provider = "postgresql"`.
2. Set `DATABASE_URL="postgresql://user:pass@host:5432/agritrade?schema=public"`.
3. Delete `prisma/migrations` (they're SQLite-specific), then run `npm run db:migrate -- --name init`.

Search automatically switches to case-insensitive matching on PostgreSQL (`lib/db.ts`).

## Features

**Sign-up and sign-in (the first page, `/`).** Tabs switch between signing in and creating an account. Two clear cards let people choose buyer or seller; seller-only fields appear when "I'm selling" is chosen. Includes inline validation, a password strength meter, show/hide password, rate limiting, and a full password-reset flow (`/forgot-password` → `/reset-password`). After sign-in, each role goes to its own dashboard.

**Marketplace.**
- `/marketplace` is the landing page: hero search, category tiles, latest offers and how it works.
- `/products` lists products. It has search, category chips, and filters for category, state, price range and availability, plus sorting and pagination. Filters are plain GET forms, so they work without JavaScript and results can be shared by URL.
- `/products/[slug]` shows the photo gallery, price or "Request a quote", minimum order, stock, location and delivery options. It also has a seller card, an inquiry form (buyers), saving products, reporting a listing, and related products.
- `/sellers/[slug]` is the public seller profile.

**Buyer dashboard (`/buyer`).** Inquiry stats, recent conversations, saved products, the inquiry inbox with status filters, and account settings.

**Seller dashboard (`/seller`).** Listing and inquiry stats plus low-stock prompts. Sellers can create and edit listings with up to 4 photos (JPEG/PNG/WebP, checked by file signature, 4 MB each), fixed or quote-only pricing, minimum order, stock and delivery options. They can change availability straight from the listings table, reply to inquiries, and edit their seller profile.

**Admin (`/admin`).** Live platform stats and a review queue. Admins can:
- approve, suspend, reactivate or delete users
- approve, reject, suspend, reinstate or remove listings
- create, edit and delete categories
- resolve or dismiss reported content
- read inquiry threads (read-only)

**Inquiries (`/inquiries/[id]`).** One threaded conversation per inquiry between the buyer and the seller. It moves between *Open*, *Responded* and *Closed*.

### Payments and escrow

All payments happen on AgriTrade. Buyers never pay sellers directly.

1. **Payment request.** After agreeing on the details in an inquiry, the seller sends a payment request from the conversation: quantity, unit price, delivery fee and fulfilment. Sellers must be approved and must have saved a payout bank account (*Seller profile → Payout account*).
2. **Pay into escrow.** The buyer pays through Paystack. The payment is verified with Paystack's API, both on the redirect back and through the signed webhook, before the order moves to *Paid · held in escrow*.
3. **Dispatch.** The seller delivers the goods, or gets them ready for pickup, and marks the order as dispatched.
4. **Buyer confirms delivery.** Only the buyer can release the money. The order becomes *Completed* and a seller payout is queued.
5. **Payout.** Under *Admin → Orders & escrow*, admins see the payouts due with each seller's bank details. They make the transfer and record its reference.

If something goes wrong, the buyer opens a **dispute**. The money stays frozen until an admin releases it to the seller or refunds the buyer (a Paystack refund is issued automatically). Every change is recorded on the order's timeline (`OrderEvent`). Money that arrives unexpectedly is flagged to admins for a manual refund, never dropped. This covers wrong amounts, duplicate payments and payments made after an order was cancelled.

Set the Paystack webhook URL to `{APP_URL}/api/payments/paystack/webhook`.

### Moderation workflow

- New **seller accounts** start as `PENDING`. They can sign in and draft listings, but nothing is public until an admin approves the account.
- New **listings** start as `PENDING` until an admin approves them. A rejected listing goes back into review when the seller edits it.
- Suspending a user signs them out everywhere and hides their listings immediately.

### Security

- Every protected page and every server action checks the session and role **on the server** (`lib/auth/session.ts`: `requireUser`, `requireRole`, `requireSeller`).
- `middleware.ts` only redirects visitors who have no session cookie. It is not the security boundary.
- Sellers can only load or change their own listings; queries are scoped by `sellerId`. Inquiries are visible only to their buyer and seller, and to admins read-only.
- Session and reset tokens are stored as SHA-256 hashes. Reset tokens are single-use, expire after 30 minutes, and sign out all sessions when used.
- Post-login redirects are checked against open redirects and against the role's allowed areas.
- Login, registration, password reset, inquiries, messages and reports are rate limited.
- Security headers are set in `next.config.ts`.

### Motion and accessibility

The motion is agricultural in feel:
- a sprouting seedling for loaders, empty states and success
- cards that "grow in" one after another
- a swaying hero sprout and leaves that unfurl on the logo
- a soil-toned skeleton shimmer and a growing progress bar

All of it switches off under `prefers-reduced-motion`.

Accessibility:
- semantic landmarks and a skip link
- labelled inputs, with `aria-invalid` and `aria-describedby` linking each field to its error
- a keyboard-operable tab list, and visible focus rings throughout
- text colours checked at WCAG AA contrast or better

## Sample data vs. database

| Feature | Status |
| --- | --- |
| Users, roles, sessions, seller profiles, categories, listings, photos, saved products, inquiries and messages, reports | **Database-backed.** Everything you create in the UI is stored through Prisma. |
| Catalogue content (9 accounts, 19 listings, 4 inquiries, 1 report) | **Sample data** from `prisma/seed.ts`. These rows have `isSample = true` and show a **"Sample"** badge in the UI. Re-seeding removes only sample rows. |
| Product photography | Real photos from Wikimedia Commons (mostly Nigerian markets and farms), stored in `public/images`. Credits and licences are at `/credits` and in `public/images/credits.json`. Refresh them with `npm run images:fetch`. |
| Password-reset **email** | **Not connected.** The token and link are generated and stored for real, but no email is sent. In development the link appears on screen and in the server log. Plug a provider into `forgotPasswordAction` in `app/actions/auth.ts`. |
| Payments | **Escrow through Paystack** (see above). Seller payouts are bank transfers that an admin makes and then records. Automating them with Paystack Transfers is a possible next step. |
| Ratings, notifications | **Not implemented.** |

## Project structure

```
app/
  page.tsx                     Sign-in / registration (first page)
  forgot-password/, reset-password/
  (site)/                      Pages with the site header and footer
    marketplace/, products/, sellers/, credits/
    buyer/, seller/, admin/    Role dashboards (each layout guards its role)
    inquiries/[id]/, account/
  actions/                     Server actions: auth, marketplace, seller, admin, account
  api/uploads/[name]/          Serves uploaded listing photos
components/                    ui/, layout/, market/, dashboard/, seller/, admin/, auth/
lib/                           auth/, db, queries, validation (zod), access rules, constants
prisma/                        schema.prisma, migrations/, seed.ts
tests/                         Vitest unit tests (access rules, validation, helpers)
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop, build and run in production. |
| `npm run check` | Type check, lint and unit tests. |
| `npm run db:migrate` / `db:seed` / `db:reset` / `db:studio` | Database tasks. |

## Deployment notes

- Run `npm run db:deploy` (not `db:migrate`) against production databases.
- Uploaded photos are written to local disk (`UPLOAD_DIR`). That works on a normal server or VM. On serverless or ephemeral hosts, swap `lib/uploads.ts` for object storage such as S3 or Cloudflare R2.
- The rate limiter is kept in memory, per process. Use Redis or similar when running several instances.

# AgriTrade — Audit Report (Phase 1)

Date: 2026-10-16 · Branch: `master` (working tree has uncommitted WhatsApp/OAuth changes, which were audited as they are)

Everything below was checked against the code or real command and HTTP output. **UNVERIFIED** means it was not run, and the reason is given.

## 1. Stack summary

| Area | Finding | Source |
| --- | --- | --- |
| Framework | Next.js 15.5.26 (App Router), React 19.3, TypeScript 5.9 | `package.json`, `npm ls` |
| Package manager | npm (11.19, Node 24.21 locally; `engines` needs ≥ 20.9) | `package-lock.json` |
| Database / ORM | Prisma 6.19 + SQLite (`prisma/dev.db`). 3 migrations, all applied | `prisma/schema.prisma`, `prisma migrate status` |
| Auth | Custom DB-backed sessions (SHA-256 hashed token in an httpOnly cookie) and bcrypt (cost 12). Optional Google/Facebook OAuth (PKCE for Google) | `lib/auth/*` |
| Validation | Zod | `lib/validation.ts` |
| Mutations | Server actions (`app/actions/*`). Body limit `20mb` | `next.config.ts` |
| File storage | Local disk, `UPLOAD_DIR` (default `./uploads`, gitignored). URLs are `/api/uploads/<name>` | `lib/uploads.ts`, `lib/constants.ts:88` |
| Payments | Paystack (escrow) with a dev-only simulated "TEST" gateway | `lib/payments.ts` |
| Messaging | Optional WhatsApp Cloud API welcome message. No email provider | `lib/whatsapp.ts`, `app/actions/auth.ts:189` |
| Tests | Vitest, 5 files / 40 tests | `tests/` |
| Deploy | No Dockerfile, CI or platform config in the repo. README says to run `next build && next start` on a VM; serverless needs object storage | `README.md` "Deployment notes" |

## 2. Commands run and real output

| Command | Result |
| --- | --- |
| `npm install` | OK. Dependencies are already in sync and the lockfile is unchanged. npm 11 warns that the install scripts of 5 packages (prisma, esbuild, …) are "not yet covered by allowScripts" |
| `npm run typecheck` (`tsc --noEmit`) | **PASS** (exit 0, no output) |
| `npm run lint` (`eslint .`) | **FAIL**: 2 errors. `scripts/seed-demo-market.js:1:26` and `:2:16`: "A `require()` style import is forbidden (@typescript-eslint/no-require-imports)" |
| `npm test` (`vitest run`) | **PASS**: 5 files, 40 tests |
| `npm run build` (`next build`) | **PASS**: compiled, 27 static pages generated. The route table has **no `/api/uploads` route** |
| `next start -p 3123` + HTTP probes | See the feature table. No errors in the server log |
| DB read-only check | 11 users (1 admin, 3 buyers, 7 sellers), 25 products, 11 categories, 0 orders. All 33 image rows point to `/images/*.jpg` (bundled). No uploaded images exist yet |

Side effect of testing: logging in as the demo buyer, seller and admin created 4 session rows in `prisma/dev.db` (one was logged out again). They expire on their own after 14 days. No other data was written.

## 3. Feature table

| Feature | Status | Evidence | File(s) | Fix needed |
| --- | --- | --- | --- | --- |
| Sign-up (email, buyer/seller) | UNVERIFIED (runtime) | Not submitted, to avoid creating accounts. The code validates with Zod, rejects duplicate emails, starts sellers as PENDING and is rate-limited. Validation tests pass | `app/actions/auth.ts:46-97`, `lib/validation.ts` | — |
| Login | **WORKING** | Real no-JS form POST for buyer, seller and admin → 303 to each dashboard with the session cookie set. A wrong password gives 200, no cookie, "don't match an account" | `app/actions/auth.ts:126-151` | — |
| Logout | **WORKING** | POST → 303 `/?mode=login&signedOut=1`. The old cookie then redirects to login (session deleted server-side) | `app/actions/auth.ts:153`, `lib/auth/session.ts` | — |
| Password reset | INCOMPLETE | The token flow is implemented (hashed, 30 min, single use), but **no email is sent**. In dev the link is shown on screen; in prod it only logs a warning. The pages return 200 | `app/actions/auth.ts:189-195` | Connect an email provider |
| Google / Facebook OAuth | UNVERIFIED | No credentials are configured. `/api/auth/oauth/google` → 307 `oauthError=unconfigured`, which is correct. Facebook is hidden from the UI by design | `lib/auth/oauth.ts`, `app/api/auth/oauth/**` | Configure keys to test |
| Roles / access control | **WORKING** | Signed out: `/buyer`, `/seller`, `/admin`, `/account`, `/orders/x` → 307 to login. Buyer → `/seller` gives 307 `/buyer`. Seller → `/admin` gives 307 `/seller`. Every action calls `requireRole`/`requireSeller`; access tests pass | `middleware.ts`, `lib/auth/session.ts`, `lib/access.ts` | — |
| Seller: create / edit / delete listing | UNVERIFIED (runtime) | The form page renders (200). It wasn't submitted, to avoid writing data. Queries are scoped by `sellerId` | `app/actions/seller.ts`, `components/seller/ListingForm.tsx` | — |
| **Seller: product image upload** | **BROKEN** | Files are saved to `UPLOAD_DIR` and stored as `/api/uploads/<name>`, but **that route doesn't exist** (not in the build route table, never in git history). `GET /api/uploads/test.jpg` → **404**. Every seller-uploaded photo will show as a broken image. Also: only JPEG/PNG/WebP are accepted, there's a 4 MB limit, no HEIC, no resize or EXIF strip, and the input has `accept="image/jpeg,image/png,image/webp"` | `lib/uploads.ts`, `lib/constants.ts:88`, `components/market/ProductImage.tsx` | Phase 2 |
| Image display fallback | INCOMPLETE | `ProductImage` shows a placeholder only when `src` is empty. It has **no `onError` fallback**, so a URL that fails to load shows the browser's broken-image icon | `components/market/ProductImage.tsx` | Phase 2 |
| Browse / marketplace | **WORKING** | `/marketplace`, `/products` → 200. Bundled images and `/_next/image` → 200 `image/jpeg` | `app/(site)/marketplace`, `app/(site)/products` | — |
| Search & filters | **WORKING** | `/products?q=egg` and `?category=eggs&state=Lagos` → 200 (GET forms, Zod-parsed) | `lib/queries.ts`, `lib/validation.ts:272` | — |
| Product detail page | **WORKING** | `/products/fresh-brown-eggs-crate-of-30` → 200, with gallery images and the inquiry form for a buyer | `app/(site)/products/[slug]/page.tsx` | — |
| Cart | INCOMPLETE / not present | There is no cart. This seems intentional: buyer sends an inquiry → seller sends a payment request → buyer pays into escrow | — | Product decision |
| Checkout / orders (escrow) | UNVERIFIED (runtime) | The order pages render (200 for buyer, seller and admin). 0 orders exist, and the full flow wasn't run because it writes data. 12 escrow unit tests pass. The Paystack webhook rejects unsigned POSTs (**401**) | `app/actions/orders.ts`, `lib/escrow.ts`, `lib/orders.ts`, `app/api/payments/**` | — |
| Payments (Paystack live) | UNVERIFIED | No Paystack key is set locally, so the TEST gateway is active in dev. Prod without a key refuses payment, which is intended | `lib/payments.ts` | Test with an `sk_test_` key |
| Inquiries & messaging | UNVERIFIED (runtime) | `/buyer/inquiries` and `/seller/inquiries` → 200. Sending wasn't tested. Rate-limited and scoped to participants | `app/actions/marketplace.ts` | — |
| Saved products | UNVERIFIED (runtime) | `/buyer/saved` → 200. Toggling wasn't tested | `app/actions/marketplace.ts:22` | — |
| User profile (account settings) | **WORKING** (page) / UNVERIFIED (save) | `/account` → 200 for all 3 roles | `app/actions/account.ts` | — |
| **Profile picture upload** | INCOMPLETE / not present | No avatar field on `User` or `SellerProfile`, and no upload UI | `prisma/schema.prisma` | Needs a schema change (Phase 2, needs approval) |
| Seller public profile | UNVERIFIED | Not fetched | `app/(site)/sellers/[slug]` | — |
| Admin: users, listings, orders, reports, categories | **WORKING** (pages) | All 6 admin pages → 200 for admin. Actions weren't run | `app/(site)/admin/**`, `app/actions/admin.ts` | — |
| Email notifications | INCOMPLETE | No email provider anywhere | — | Add a provider |
| WhatsApp welcome | UNVERIFIED | Not configured. Fails silently with a 5 s timeout; 2 unit tests pass | `lib/whatsapp.ts` | — |
| Credits page | **WORKING** | `/credits` → 200 | `app/(site)/credits` | — |
| 404 page | **WORKING** | `/does-not-exist` → 404 | `app/not-found.tsx` | — |

## 4. Build / type / lint errors

- **Lint: 2 errors** in `scripts/seed-demo-market.js` (CommonJS `require`). The script isn't referenced by `package.json` or the README; it looks like a one-off seeding script. Fix it by renaming to `.cjs` and ignoring it, or by converting it to ESM.
- Type check and build: clean.

## 5. Missing environment variables

The keys in `.env` were compared with `.env.example`. Only names were read; values were redacted.
- Missing from `.env` but listed in `.env.example`: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_WELCOME_TEMPLATE`, `WHATSAPP_TEMPLATE_LANGUAGE`, `WHATSAPP_API_VERSION`. These are optional: the feature switches off without them.
- No email-provider variable exists at all, because no provider is integrated.
- `ALLOW_PRODUCTION_SEED` is documented in the README but not in `.env.example`. It is optional.

## 6. Security findings

| Severity | Finding | Evidence |
| --- | --- | --- |
| Low | `.env` is gitignored and was never committed (`git log --all -- .env` is empty). No secret-looking strings found in tracked files | grep for `sk_live/test`, `AIza`, `EAA…`, PEM headers |
| Medium | Rate limits key on `x-forwarded-for`, which the client controls when there's no trusted proxy. A brute-force login can rotate the header to get around the per-IP limit. The key also includes the email, so per-account brute force is still limited | `app/actions/auth.ts:36-39` |
| Low | The category `imageUrl` check accepts `//host/x.jpg` (it only checks `startsWith("/")`). Admin-only, and `next/image` would refuse an unconfigured host, so the impact is low | `lib/validation.ts:268` |
| Medium (UX/func) | Uploads are checked by magic bytes (good), but files are stored as-is with **EXIF/GPS metadata kept** (privacy) and are never re-encoded | `lib/uploads.ts:30-50` |
| Info | Every protected page and action checks the session and role on the server; middleware is only an early redirect. Webhook HMAC-SHA512 is verified with a timing-safe compare | Verified in code and by the 401 probe |
| Info | `Permissions-Policy: camera=()` doesn't block `<input type="file">` camera capture, which uses the OS picker. No change needed | `next.config.ts` |

## 7. Dead / duplicate code and repo hygiene

- **~15,300 tracked files** sit in ~60 AI-agent folders (`.adal/`, `.agents/`, `.roo/`, `.windsurf/`, … plus `data/skills/` and `skills/`). Each holds the same "brag" skill with MP3/OGG assets, and `.git` is 61 MB. None of it is used by the app.
- `brag-output/` (32 MB) is untracked output from a video tool.
- The README project structure lists `app/api/uploads/[name]/`, which doesn't exist.
- `scripts/seed-demo-market.js` duplicates part of `prisma/seed.ts` (categories, demo products) and isn't wired into any script.
- `ListingForm` hard-codes `MAX_PHOTOS = 4`, duplicating `MAX_IMAGES_PER_LISTING` in `lib/uploads.ts`.

## 8. Prioritised fix list

1. **Critical: uploaded images 404.** Add a route that serves `UPLOAD_DIR` files with the correct content type and safe file names, or change the storage URL. *(Phase 2)*
2. **High: upload pipeline.** Accept HEIC, AVIF, TIFF, BMP and GIF; convert to WebP; auto-rotate; strip EXIF/GPS; resize to full size and a thumbnail; 15 MB limit; client preview, progress and errors. *(Phase 2)*
3. **High: broken-image fallback** in `ProductImage` (`onError` → placeholder). *(Phase 2)*
4. **High: lint fails** (`scripts/seed-demo-market.js`). `npm run check` and any CI would fail.
5. **Medium: password-reset email** isn't sent in production, so users can't recover their accounts.
6. **Medium: rate-limit IP spoofing.** Trust `x-forwarded-for` only behind a known proxy.
7. **Medium: profile pictures** don't exist. Adding them needs a schema change. *(Phase 2, asked separately)*
8. **Low: repo bloat.** Remove the agent/skill folders from git (needs your OK, since it deletes files).
9. **Low: README drift** (uploads route, listing count 19 vs 25 in the DB).
10. Nice-to-have: an end-to-end test for sign-up → listing → inquiry → escrow.

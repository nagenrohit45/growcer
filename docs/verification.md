# Verification record

Date: 7 November 2026. Target: https://growcer-i9j8.vercel.app/.

## Environment boundaries

No office staging server was used. Tests ran locally on 127.0.0.1 against an isolated test database or the newly connected Growcer database. Deployment and final route/browser checks used only the personal production Vercel project growcer-i9j8. No preview/staging deployment was made. Neon Free resource growcer-db was provisioned specifically for this project after the account owner accepted its terms.

## Automated results

- Production Vite build: PASS.
- ESLint: PASS, zero errors/warnings.
- Automated suite: 19 tests passed (15 HTTP/API checks and 4 search checks), zero failures.
- Dependency audit after compatible updates: zero known vulnerabilities.
- Local smoke checks: 11 frontend routes, health, catalog, session and unauthenticated-order protection passed.
- Production smoke checks: the same 11 frontend routes and API checks passed after correcting the production rewrite.

The 15 tests cover bounded discounts, vegetable-only eligibility, duplicate cart lines, decimal totals, invalid quantities and customers, public catalog, authenticated orders, Vercel route/query handling, refusal of an in-memory production fallback, cross-origin mutation rejection, registration/normalization, duplicate accounts, incorrect credentials, secure cookie attributes, session reads, authoritative server prices, persisted order reads, idempotent and concurrent duplicate submissions, simulated decline/approval, malformed JSON, unsupported methods, owner-only order access, logout, re-login, expiry and database-backed rate limiting. The test database is pg-mem; production database integration was additionally exercised through health checks and actual browser-created synthetic accounts/orders.

## Browser checks

Local browser with PostgreSQL-backed accounts:

- Account registration and session restoration.
- Add from homepage, cart coupon, nonnegative capped total and matching checkout total.
- Simulated card decline preserves the cart and displays a useful error.
- Approved card simulation saves the order, clears the cart, and returns a receipt.
- Receipt refresh reloads the saved database order.
- Order history shows the saved receipt.
- Search for milk returns both existing package variants; low-to-high sort shows INR 30 then INR 55.
- Mobile navigation expands and exposes category/account controls.
- Sampled desktop and 390px mobile layouts, broken-image check, and document overflow check.

Production browser:

- Catalog loads all 22 preserved product/package variants.
- Add-to-cart and SAVE10: INR 40 subtotal, INR 4 discount, INR 36 checkout/order total.
- Checkout requests sign-in while preserving the basket.
- A synthetic test account registers and receives a server session.
- A cash-on-delivery demo order is saved to PostgreSQL with payment due, rather than incorrectly marked paid.
- Receipt refresh preserves the order and totals.
- Logout protects the receipt; signing in restores authorized access.
- Production order history loads the saved order.
- No warnings/errors were captured in the sampled production console check.

Synthetic QA data uses example.com email addresses, sample names, sample addresses and a dummy phone number. No real payment or delivery was made. These records are demonstration/test data, not customers. Payment simulation intentionally returns an expected HTTP 402 on decline; this is handled in the UI and is not an unhandled application error.

## Defects corrected

- Negative coupon totals and inconsistent cart/checkout pricing.
- Orders existing only in router memory and disappearing on refresh.
- Frontend-only hardcoded authentication and insecure local login flags.
- Checkout and other nested routes returning deployment 404 on refresh.
- Placeholder footer links.
- Hidden mobile search and inaccessible navigation/category controls.
- Duplicate homepage/catalog identities for equivalent tomato/apple products.
- Cash-on-delivery receipt incorrectly claiming payment had already been made.
- Corrupted local cart storage crashing initial render.
- Double-submission risk and trusting browser-supplied product prices.
- Multi-megabyte image transfers; optimized WebP variants preserve originals.
- Starter title/favicon and vulnerable dependency versions.

A production-only rewrite defect was found by live smoke checks during the first deployment, fixed, and retested successfully. It is also covered by regression tests.

## Limits of this verification

These results establish the flows listed above; they are not a guarantee against every possible defect or a load/security penetration test. Real payment processing, actual delivery operations, staffed support, email verification/password recovery, merchant administration and live inventory are not claimed. Card payments are deliberately simulated as requested. Informational pages describe the actual demo behavior. Those operational services and verified business policies would be needed before accepting real commerce.

## Follow-up hero layout check

The current requested design uses one combined hero on phones and tablets (up to 1024 CSS pixels). The grocery picture is positioned behind the content at 20% opacity, with readable text and side-by-side buttons above it. It does not occupy a separate image block. Browser checks at 320, 390, 768 and 1024 CSS pixels confirmed background positioning, opacity, content stacking, side-by-side buttons and no horizontal document overflow. At 1280 pixels the existing desktop two-column image/text layout remains intact. Lint and the production build pass for this change.

## Approved desktop image, search suggestions and Contact update

The desktop hero uses a tightly cropped transparent grocery cutout so the actual groceries appear larger without a pale rectangular image background. The original image remains selected on phones/tablets up to 1024 CSS pixels, with its existing 20% opacity. Desktop cutout transparency and responsive source selection were checked at 390, 768, 1024, 1280 and 1440 pixels without horizontal overflow.

Search suggestions match names, categories and pack sizes while typing, display pictures/prices, and support mouse selection, arrow keys, Enter, Escape and a full-results link. Selecting a suggestion shows the intended pack variant. Local browser checks covered both milk variants, keyboard and mouse selection, an unmatched query, Escape dismissal, all-results navigation, and mobile dropdown placement. Four search regression tests were added.

The Contact page includes yellanurunagendra45@gmail.com with a verified mailto link. Its 320px layout was checked for overflow. No email was sent. All 19 automated tests, lint and the production build passed before publication. The changes were held locally for review until the user explicitly requested the push and Vercel update.

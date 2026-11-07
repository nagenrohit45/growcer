# Growcer

A responsive grocery demonstration built on the existing React, React Router, Bootstrap and Vite application. Node API routes run on Vercel; PostgreSQL stores users, sessions and orders. Card payments are simulated and never charge money or collect card numbers. No actual deliveries are dispatched.

## Run locally

Requires Node 22.12+ (Node 24 recommended).

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and supply your PostgreSQL `DATABASE_URL`. Do not commit this file. For a linked Vercel project, `vercel env pull .env.local --environment=development` supplies its development configuration.
3. Run `npm run dev` and open the printed localhost URL. Vite serves both the UI and local API middleware.
4. Create an account in the application. Passwords require 8–128 characters. The previous hardcoded browser-only login has been replaced by database-backed accounts.

For isolated local testing only, `GROWCER_TEST_DB=memory` uses pg-mem. It is explicitly refused on Vercel and in production; this mode is not persistent and is never a production fallback. API automated tests supply their own isolated test database without needing secrets.

## Checks

- `npm run lint`
- `npm test` — pricing, delivery validation, registration/login/logout, expiry, rate limits, ownership, tampered prices, idempotency, payment outcomes, malformed requests.
- `npm run build`
- `npm run test:smoke` — route/health checks against localhost. Set `BASE_URL` for the explicitly approved deployment.
- `npm audit --audit-level=high`

Browser verification covers registration, sign-in, search, sort, all category links, coupons, quantities, checkout validation, simulated declined and approved cards, cash on delivery, refreshed receipts, order history, logout, and mobile navigation. See `docs/verification.md` for evidence and limits.

## Project structure

- `src/`: existing React UI, responsive components, pages and browser cart state.
- `shared/catalog.js`: canonical product catalog, coupons, delivery validation and price calculation used by client and server.
- `server/app.js`: HTTP API, session cookies, auth validation and order authorization.
- `server/db.js`: PostgreSQL pool and idempotent schema initialization.
- `api/index.js`: Vercel function entry point.
- `vercel.json`: API rewrites, SPA deep-link fallback and response headers.
- `tests/`: isolated HTTP/API integration tests.
- `scripts/`: smoke checks and optional image optimization.

## API

Public: `GET /api/products`, `GET /api/auth/session`, `GET /api/health`.
Accounts: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`.
Authenticated orders: `GET /api/orders`, `GET /api/orders/:id`, `POST /api/orders`.

Create-order input includes product IDs and integer quantities, coupon, name/phone/address/city, and `payment` (`cod` or `card`). Card simulation additionally requires `simulation` (`approved` or `declined`). A unique `Idempotency-Key` header is required. The API ignores client prices and computes authoritative totals from its catalog. Declines never create orders. Concurrent retries with the same key create one order.

Passwords use salted scrypt hashes. Session tokens are random, hashed in PostgreSQL, and stored in HttpOnly SameSite=Lax cookies (Secure on Vercel). Logout revokes the session. Session lifetime is seven days. Authentication attempts are tracked in the database. An order query always checks its owner. Users can browse without signing in but must authenticate at checkout.

Tables `users`, `sessions`, `orders`, and `auth_attempts` are created with additive `CREATE TABLE IF NOT EXISTS` statements on first API database use. No existing office database, staging server, or pre-existing schema is used. Future schema changes should use reviewed migrations.

## Deployment

The authorized target is the existing personal project `growcer-i9j8` at https://growcer-i9j8.vercel.app/. Deploy from its linked checkout with `vercel --prod`. Configure `DATABASE_URL` through its connected database integration. Never place database credentials in `VITE_*` variables or source. No session signing secret is needed because sessions are opaque, database-validated tokens.

The connected database is Neon Free resource `growcer-db`, created specifically for this app after account-owner terms acceptance. Do not use any office staging server. No preview/staging deployment is needed for the documented local-to-production workflow.

## Demo limitations

There is no real payment gateway, delivery dispatch, verified support operation, password-reset email service, or inventory/merchant administration interface. These are not represented as working integrations. Existing storefront catalog values are preserved; unspecified pack sizes are displayed as “per pack.” The informational pages accurately describe this demonstration rather than inventing commercial terms or contact details. Real commerce requires verified business policies, product units, operational support, and the relevant integrations.

Original image files are preserved. WebP variants reduce transfer size; `npm run images:optimize` regenerates them using sharp. No credentials, real card data, or real customer data should be used in test orders.

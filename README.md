# Growcer

A responsive grocery shopping demo with a React frontend and a Java 21 / Spring Boot backend. PostgreSQL stores accounts, sessions, and orders. Card payments are simulated; there are no real charges or deliveries.

The deployment configuration uses Vercel Services: React is built with Vite, and the Java API runs in a Docker container. Requests under /api go directly to Spring Boot. The existing Neon PostgreSQL database is retained. See the production verification record for release status.

## Local setup

Install Java 21 and Node 22.12 or newer.

1. Run `npm ci`.
2. Add the Growcer PostgreSQL `DATABASE_URL` to untracked `.env.local`.
3. Run `npm run dev:backend` in one terminal.
4. Run `npm run dev` in another terminal and open the printed local URL.

The Maven Wrapper handles Maven installation. Local Java development uses the separate, persistent `growcer_java_local` schema by default. It does not modify existing public-schema accounts or orders. Deployment uses the existing public schema to retain those accounts and orders.

## Checks

- `npm test`
- `npm run lint`
- `npm run build`
- `npm run test:backend`
- `node scripts/backend.js test --postgres` for isolated PostgreSQL integration tests
- `npm run build:backend`
- `npm run test:smoke` with both local servers running

## Structure

- `src/`: React UI, responsive pages, and browser cart state.
- `shared/catalog.json`: canonical products and coupons, used by both Java and React.
- `shared/catalog.js`: frontend pricing and delivery validation.
- `backend/`: Spring MVC controllers, services, Spring Security sessions, JDBC repository, and Java tests.
- `vercel.json`: Vercel Services routing for the Vite frontend and Java container.
- `Dockerfile.backend`: Java container build, using the repository root as context.
- `tests/`: frontend/domain and adapter checks.
- `docs/java-migration.md`: compatibility, local setup, deployment, and testing details.
- `docs/java-verification.md`: results of local migration verification.

## API contract

Public: `GET /api/products`, `GET /api/health`, `GET /api/auth/session`.
Accounts: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`.
Authenticated orders: `GET /api/orders`, `GET /api/orders/{id}`, `POST /api/orders`.

Existing password hashes, session cookies, saved receipts, per-user order ownership, coupons, and checkout idempotency are preserved. Java computes authoritative prices from the packaged catalog. No real card information is collected.

## Deployment status

The owner approved the GitHub push and production deployment on 10 November 2026. Vercel now supports the Java container directly, so a separate hosting account and Node API adapter are not required. Production Java settings use DATABASE_SCHEMA=public and secure cookies. The office staging server must not be used. See [production verification](docs/production-verification.md).

## Demo limits

Real payment processing, delivery dispatch, password-reset emails, merchant administration, and live inventory are not implemented. This project is a portfolio demonstration.

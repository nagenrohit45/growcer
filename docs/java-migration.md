# Java backend migration

The owner approved publication on 10 November 2026. The final configuration uses Vercel Services for both the React frontend and the Java container. See production-verification.md for the deployment result.

## What changed

The application backend is Java 21 with Spring Boot 3.5.16, Spring MVC, Spring Security, and Spring JDBC. JDBC is intentional: it preserves the existing PostgreSQL schema and JSONB receipts without rewriting working data into a new entity model. React, its pages and responsive design, and all existing API paths remain unchanged.

`shared/catalog.json` is the single catalog resource consumed by React and packaged into the Java JAR. The Java service validates cart input, computes prices using BigDecimal, validates discounts/delivery data, handles simulated card outcomes, and stores orders. No browser-supplied price is trusted.

Vercel Services routes same-origin /api requests directly to the Java container and all remaining requests to the Vite frontend. The temporary Node forwarding adapter has been removed. Locally, Vite proxies directly to Spring Boot.

## Existing data compatibility

- Existing `users`, `sessions`, `orders`, and `auth_attempts` tables are preserved using additive CREATE TABLE IF NOT EXISTS statements. There are no destructive application migrations.
- Node scrypt passwords retain the exact salt-text encoding and N=16384, r=8, p=1, 64-byte format. A Node-generated synthetic fixture verifies Java compatibility.
- Existing session token hashes, the `growcer_session` cookie, and seven-day expiry still work.
- Receipts keep their JSON fields, order IDs, ownership checks, and payment status values.
- A per-user/request-key database constraint prevents duplicate orders, including concurrent retries.
- Every table reference includes its validated schema explicitly. No request relies on session-level search_path settings, which Neon transaction pooling does not preserve.
- Passwords and session tokens never appear in API responses. The cookie defaults to HttpOnly, SameSite=Lax and Secure for deployment.
- Mutations use strict Origin/Sec-Fetch-Site checks and JSON-only controllers rather than adding a new CSRF token requirement to React. Request bodies are bounded to 16 KiB, including chunked bodies.

## Running locally

Install Java 21 and the existing frontend's Node prerequisites. The Maven Wrapper downloads Maven on its first run; a separate Maven installation is unnecessary.

1. Run `npm ci` in the repository root.
2. Put the Growcer PostgreSQL `DATABASE_URL` in untracked `.env.local`.
3. Run `npm run dev:backend` in one terminal.
4. Run `npm run dev` in another terminal and open Vite's printed URL.

The backend listens on loopback port 8080 by default. The helper loads `.env.local`, defaults local HTTP cookies to non-Secure, and defaults local data to the separate `growcer_java_local` schema. This schema persists across restarts. It does not use office staging, replace public orders, or silently fall back to an in-memory database. Local accounts are separate from the live site's public-schema accounts.

Use `API_PROXY_TARGET` if you change the Java port. `DATABASE_SCHEMA` can explicitly choose another valid lowercase schema. The deployed Java service should use the existing `public` schema to preserve live accounts/orders; keep the local test schema out of deployment configuration.

## Tests and builds

- `npm test`: frontend search/pricing checks.
- `npm run lint` and `npm run build`: frontend validation.
- `npm run test:backend`: Java unit and real HTTP integration tests using an explicit, test-only H2 database in PostgreSQL compatibility mode. H2 is not included in the production JAR.
- `node scripts/backend.js test --postgres`: the same Java suite against the configured Growcer PostgreSQL database. It creates a random `growcer_java_test_<uuid>` schema and drops only that schema afterward. Test mutations never target public tables; read-only fingerprints of existing public tables are compared before and after the suite.
- `npm run build:backend`: creates `backend/target/growcer-api-1.0.0.jar`.
- `npm run test:smoke`: tests the locally running frontend plus Java API.

`GROWCER_MAVEN_REPO` optionally selects a custom Maven dependency cache. CI runs the Java suite against both H2 and a dedicated PostgreSQL service. CI runs after a GitHub push. See the production verification record for its result.

## Production deployment

Current Vercel documentation supports custom container runtimes and multiple services on all plans. The final configuration keeps the existing project and domain. No separate backend provider is required.

- frontend service: Vite build, output in dist, with SPA route fallback.
- backend service: Dockerfile.backend at the repository root, Java 21 executable JAR.
- top-level routing: /api and /api/* go to backend; other requests go to frontend.
- production environment: existing DATABASE_URL, DATABASE_SCHEMA=public, COOKIE_SECURE=true, PUBLIC_ORIGIN=https://growcer-i9j8.vercel.app, SERVER_ADDRESS=0.0.0.0, PORT=8080.
- JAVA_TOOL_OPTIONS bounds the heap to 70 percent of the available container memory.

Build an unaliased production deployment first with vercel deploy --prod --skip-domain, verify the Java service, then promote the verified deployment. No office staging server is used. Existing account/order tables stay in public, while local development and automated tests use separate explicitly qualified schemas.

The earlier plan for a separate Java host and BACKEND_ORIGIN is superseded. A Node API adapter is not part of the production architecture.

## Test isolation incident and recovery

An earlier implementation incorrectly relied on a pooled connection's search_path. Its test cleanup affected the demo database. With the owner's explicit approval, Neon restored main to 10:00 AM Asia/Calcutta on 10 November 2026. The original three accounts and three orders were recovered, and the previous database state was retained as a backup branch. The fix uses explicit schema-qualified SQL throughout the repository and tests. See the verification record for the recovery evidence and final checks. Do not reuse the earlier unqualified test approach.

Official references consulted: [Spring Boot 3.5 requirements](https://docs.spring.io/spring-boot/3.5/system-requirements.html), [Spring Security password storage](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html).

Pooling reference: [Neon transaction pooling and SET/search_path limitations](https://neon.com/docs/connect/connection-pooling).

Production references: https://vercel.com/docs/functions/runtimes/container and https://vercel.com/docs/services

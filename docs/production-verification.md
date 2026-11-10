# Production release: Java Spring Boot backend

Release date: 10 November 2026. The owner explicitly approved pushing to GitHub and updating the live Vercel website.

## Architecture

- Existing Vercel project: growcer-i9j8.
- Public website: https://growcer-i9j8.vercel.app/.
- Vercel frontend service: React/Vite static build with SPA fallback.
- Vercel backend service: Java 21 / Spring Boot 3.5.16, built from Dockerfile.backend and run as a custom container.
- Vercel routes /api and /api/* directly to the Java service. There is no Node application backend or forwarding adapter in the final release.
- Existing Neon PostgreSQL database and public-schema account/order data are retained. SQL always qualifies the target schema explicitly.

## Release checks

Before publication, 25 Java tests passed on H2 and real PostgreSQL, including a public-table fingerprint check before and after the isolated PostgreSQL suite. The executable JAR, frontend build, and lint passed. After removing the now-unused Node forwarding adapter, all seven remaining frontend/domain tests and lint passed.

Vercel built both services successfully in an unaliased production deployment using its remote Docker builder. The Java /api/health endpoint returned a successful simulation-mode response. The frontend rendered successfully. The temporary deployment URL's registration request was rejected by the intentional origin policy: production mutations are configured for the main public website origin. No account was created by that rejected request.

Publication and final live-flow checks are tracked in Vercel Deployments and GitHub Actions. The owner separately approved one synthetic example.com account and one simulated order to verify the full live flow. No real payment or delivery is involved. These release checks must not delete existing accounts or orders.

## Operations

Production settings: PORT=8080, SERVER_ADDRESS=0.0.0.0, DATABASE_SCHEMA=public, COOKIE_SECURE=true, PUBLIC_ORIGIN=https://growcer-i9j8.vercel.app, JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=70.0. The database connection remains in Vercel environment variables and is not committed.

Container instances can scale down when idle; a cold start can take longer than a warm request. The application stores sessions and receipts in PostgreSQL, so container restarts do not lose them. Do not replace the database with an ephemeral filesystem or in-memory production database.

No office staging server is used. The approved database-recovery incident and its prevention are documented in java-verification.md and java-migration.md.

Official platform references: https://vercel.com/docs/functions/runtimes/container and https://vercel.com/docs/services.

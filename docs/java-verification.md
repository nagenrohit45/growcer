# Java migration verification

Date: 10 November 2026, Asia/Calcutta.

## Final status

The backend is migrated locally to Java 21 / Spring Boot 3.5.16. Changes are uncommitted, unpushed, and undeployed pending the owner's review. The React UI is preserved. The existing published website still uses its previous backend; it passed read-only smoke checks after database recovery.

## Automated checks

- 25 Java tests passed using the test-only H2 database during the final Maven package build.
- The same 25 Java tests passed against real PostgreSQL on Neon in randomly named, explicitly qualified test schemas.
- Existing public users, sessions, orders, and auth_attempts table fingerprints matched before and after the final PostgreSQL suite.
- 10 JavaScript tests passed: search, shared catalog/pricing validation, and the Vercel transport adapter.
- ESLint passed after the helper-script changes.
- Vite production build passed with the shared JSON catalog and Java development proxy.
- Spring Boot executable JAR packaging passed. Artifact: backend/target/growcer-api-1.0.0.jar.
- Local smoke checks passed for 11 React routes, health/products/session APIs, and unauthenticated-order protection.
- Existing live website passed the same read-only smoke checks following the approved database restore.

Java HTTP integration tests exercise a real embedded Tomcat listener and HTTP client. Coverage includes email normalization, duplicate registration, correct/incorrect login, HttpOnly/SameSite/Secure cookies, hashed session tokens, expiry/logout, legacy Node scrypt passwords and sessions, order ownership, authoritative prices, durable receipts, idempotent/concurrent submissions, card approval/decline, cash-on-delivery status, malformed JSON, trailing JSON, wrong media types, known-length and chunked oversized bodies, unknown routes/methods, origin checks, rate-limit expiry, and cross-schema isolation. Unit tests cover decimal pricing, coupon eligibility/caps, invalid quantities, delivery normalization, URL credential decoding, fail-fast database configuration, and table qualification.

## Browser verification

React was connected through the Vite proxy to the Java backend on loopback HTTP. Java used only the separate growcer_java_local schema for browser-created sample accounts and orders.

- Registration, login, logout, and receipt access protection worked.
- Search suggestions and keyboard selection opened the intended product.
- A tomato basket with SAVE10 showed INR 40 subtotal, INR 4 discount, and INR 36 at checkout and receipt.
- A declined card simulation displayed a useful error and retained the basket. An approved simulation saved a receipt and cleared the cart.
- A final cash-on-delivery order made through the built JAR correctly showed payment due rather than paid.
- After stopping and restarting the same executable JAR, the browser session remained valid, the saved receipt still loaded on refresh, and order history retained the INR 36 order.
- Phone (390px), tablet (768px), and desktop (1440px) layouts were inspected; the frontend's existing responsive hero/search behavior was preserved.
- No browser warnings/errors were present in the final sampled console. An earlier deliberately declined card request returned the expected handled HTTP 402.

Evidence is saved outside the repository under ../output/growcer-java, including final-cod-receipt.jpg, after-java-restart.jpg, final-order-history.jpg, mobile-search.jpg, tablet-homepage.jpg, desktop-homepage.jpg, and recovery screenshots. All delivery information shown in the local checkout evidence is synthetic.

## Isolation incident, approved recovery, and prevention

An earlier PostgreSQL test implementation relied on SET/search_path/currentSchema state through Neon's transaction pool. That was insufficient isolation: cleanup affected the demo database. Read-only counts at discovery showed one account and zero orders in public, compared with three accounts and three orders in the 10:00 AM historical preview. One historical account was outside the synthetic example.com addresses. This was reported to the owner before recovery.

The owner explicitly approved restoring main to 10:00 AM on 10 November 2026 (04:30 UTC). Neon completed the restore and preserved main_old_2026-11-10T04:30:00Z as a backup. Read-only checks verified three public accounts, three public orders, and one session afterward. The existing live application passed read-only route/API checks. No source push or application deployment accompanied this recovery.

Final code does not set or depend on search_path. Every repository and test query qualifies its schema explicitly. Test cleanup refuses to run outside a randomly named test schema. A regression test creates a second schema and verifies that reads/deletes cannot affect the first. Before/after fingerprints verify that the final real-PostgreSQL suite leaves existing public rows unchanged.

## Limits and deployment prerequisites

The Java application has not been deployed. GitHub CI has been updated but cannot run remotely until a push is approved. The Dockerfile was prepared but not executed because Docker is unavailable here. No office staging server was used.

Deployment needs an approved Java-capable host and its HTTPS origin. The existing Vercel frontend can keep same-origin APIs through the forwarding adapter, but BACKEND_ORIGIN must be configured only after the Java service is ready. Do not deploy the adapter alone with that setting missing.

Card payments remain simulated; no real charges or deliveries occur. This work does not add real payment processing, delivery operations, password-reset email, merchant administration, or live inventory. Tests cover the documented flows and do not constitute exhaustive load or penetration testing.

package com.growcer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.zaxxer.hikari.HikariDataSource;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.Callable;
import java.util.List;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {"growcer.cookie-secure=false"})
class StoreApiTest {
    @LocalServerPort int port;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired PasswordService passwords;
    @Autowired SchemaSql schemas;
    @Autowired StoreRepository repository;
    final HttpClient http = HttpClient.newHttpClient();
    static HikariDataSource postgres;
    static String schema;
    static Map<String, String> publicBefore;
    String cookie;

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) throws Exception {
        String url = System.getenv("GROWCER_POSTGRES_TEST_URL");
        if (url == null || url.isBlank()) {
            registry.add("spring.datasource.url", () -> "jdbc:h2:mem:growcer;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;NON_KEYWORDS=KEY;DB_CLOSE_DELAY=-1");
            registry.add("spring.datasource.username", () -> "sa");
            registry.add("spring.datasource.password", () -> "");
        } else {
            postgres = (HikariDataSource) new DatabaseConfig().dataSource(new MockEnvironment().withProperty("DATABASE_URL", url));
            publicBefore = publicFingerprints();
            schema = "growcer_java_test_" + UUID.randomUUID().toString().replace("-", "");
            try (var connection = postgres.getConnection(); var statement = connection.createStatement()) {
                statement.execute("CREATE SCHEMA " + schema);
            }
            String jdbcUrl = postgres.getJdbcUrl();
            registry.add("growcer.schema", () -> schema);
            registry.add("spring.datasource.url", () -> jdbcUrl);
            registry.add("spring.datasource.username", postgres::getUsername);
            registry.add("spring.datasource.password", postgres::getPassword);
        }
    }

    @AfterAll
    static void cleanupSchema() throws Exception {
        if (postgres != null) {
            try {
                if (schema != null && schema.matches("growcer_java_test_[a-f0-9]{32}")) {
                    try (var c = postgres.getConnection(); var s = c.createStatement()) { s.execute("DROP SCHEMA " + schema + " CASCADE"); }
                }
                assertThat(publicFingerprints()).as("Existing public tables must remain unchanged by isolated tests").isEqualTo(publicBefore);
            } finally { postgres.close(); }
        }
    }

    static Map<String, String> publicFingerprints() throws Exception {
        var result = new java.util.TreeMap<String, String>();
        try (var connection = postgres.getConnection(); var statement = connection.createStatement()) {
            for (String table : List.of("users", "sessions", "orders", "auth_attempts")) {
                boolean exists;
                try (var rows = statement.executeQuery("SELECT to_regclass('public." + table + "') IS NOT NULL")) { rows.next(); exists = rows.getBoolean(1); }
                if (exists) {
                    try (var rows = statement.executeQuery("SELECT md5(COALESCE(string_agg(row_to_json(t)::text, '' ORDER BY row_to_json(t)::text), '')) FROM public." + table + " t")) {
                        rows.next(); result.put(table, rows.getString(1));
                    }
                }
            }
        }
        return result;
    }

    @BeforeEach
    void cleanIsolatedDatabase() {
        if (postgres != null && !schemas.schema().matches("growcer_java_test_[a-f0-9]{32}")) throw new IllegalStateException("Refusing cleanup outside the isolated test schema.");
        jdbc.update(schemas.qualify("DELETE FROM orders")); jdbc.update(schemas.qualify("DELETE FROM sessions")); jdbc.update(schemas.qualify("DELETE FROM auth_attempts")); jdbc.update(schemas.qualify("DELETE FROM users"));
        cookie = null;
    }

    record Result(int status, JsonNode data, HttpResponse<String> response) {}
    Result request(String path, String method, String body, String session, Map<String,String> extra) throws Exception {
        var builder = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api" + path)).header("Content-Type", "application/json");
        if (session != null) builder.header("Cookie", session);
        extra.forEach(builder::header);
        builder.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
        var response = http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        return new Result(response.statusCode(), json.readTree(response.body()), response);
    }
    Result get(String path) throws Exception { return request(path, "GET", null, cookie, Map.of()); }
    Result post(String path, Object body) throws Exception { return request(path, "POST", json.writeValueAsString(body), cookie, Map.of()); }
    Result register(String email) throws Exception {
        var result = post("/auth/register", Map.of("email", email, "password", "password123", "name", "Test Shopper"));
        assertThat(result.status()).as(result.data().toString()).isEqualTo(201);
        cookie = result.response().headers().firstValue("set-cookie").orElseThrow().split(";")[0];
        return result;
    }
    ObjectNode orderBody() {
        var body = json.createObjectNode();
        body.putArray("items").addObject().put("id", 1).put("quantity", 1).put("price", -999);
        body.put("coupon", "FLAT50"); body.put("payment", "cod");
        body.putObject("customer").put("name", "Test Shopper").put("phone", "9999999999").put("address", "123 Sample Street").put("city", "Hyderabad");
        return body;
    }
    Result order(ObjectNode body, String key) throws Exception { return request("/orders", "POST", body.toString(), cookie, Map.of("Idempotency-Key", key)); }

    @Test void catalogAndHealthContract() throws Exception {
        var products = get("/products"); assertThat(products.status()).isEqualTo(200);
        assertThat(products.data().path("products").size()).isEqualTo(22);
        assertThat(products.data().path("coupons").size()).isEqualTo(4);
        assertThat(get("/health").data().path("ok").asBoolean()).isTrue();
        assertThat(get("/auth/session").data().path("user").isNull()).isTrue();
        assertThat(get("/orders").status()).isEqualTo(401);
        assertThat(get("/products").response().headers().firstValue("cache-control").orElseThrow()).contains("no-store");
    }

    @Test void accountsNormalizeEmailAndKeepSessionPrivate() throws Exception {
        var result = register("TEST@example.com");
        assertThat(result.data().path("user").path("email").asText()).isEqualTo("test@example.com");
        assertThat(result.data().path("user").has("password_hash")).isFalse();
        assertThat(result.response().headers().firstValue("set-cookie").orElseThrow()).contains("HttpOnly", "SameSite=Lax", "Path=/", "Max-Age=604800");
        assertThat(get("/auth/session").data().path("user").path("email").asText()).isEqualTo("test@example.com");
        assertThat(jdbc.queryForObject(schemas.qualify("SELECT token_hash FROM sessions"), String.class)).isNotEqualTo(cookie.substring(16));
        assertThat(post("/auth/register", Map.of("email", "test@example.com", "password", "password123", "name", "Duplicate")).status()).isEqualTo(409);
        assertThat(post("/auth/login", Map.of("email", "test@example.com", "password", "incorrect")).status()).isEqualTo(401);
    }

    @Test void legacyNodePasswordsAndCookiesRemainValid() throws Exception {
        // Fixture generated by Node crypto.scryptSync with a fixed synthetic salt.
        String hash = getClass().getResourceAsStream("/legacy-password.txt") == null ? "" : new String(getClass().getResourceAsStream("/legacy-password.txt").readAllBytes(), StandardCharsets.UTF_8).trim();
        assertThat(passwords.matches("legacyPassword123", hash)).isTrue();
        assertThat(passwords.matches("wrongPassword", hash)).isFalse();
        jdbc.update(schemas.qualify("INSERT INTO users(id,email,name,password_hash) VALUES (?,?,?,?)"), "legacy-user", "legacy@example.com", "Legacy Shopper", hash);
        String token = "a".repeat(64);
        jdbc.update(schemas.qualify("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES (?,?,?)"), PasswordService.digest(token), "legacy-user", Timestamp.from(Instant.now().plusSeconds(3600)));
        cookie = "growcer_session=" + token;
        assertThat(get("/auth/session").data().path("user").path("id").asText()).isEqualTo("legacy-user");
        assertThat(post("/auth/login", Map.of("email", "legacy@example.com", "password", "legacyPassword123")).status()).isEqualTo(200);
    }

    @Test void logoutRevokesAndLoginRestoresAccess() throws Exception {
        register("shopper@example.com");
        assertThat(post("/auth/logout", Map.of()).status()).isEqualTo(200);
        assertThat(get("/auth/session").data().path("user").isNull()).isTrue();
        assertThat(get("/orders").status()).isEqualTo(401);
        var login = post("/auth/login", Map.of("email", "shopper@example.com", "password", "password123"));
        assertThat(login.status()).isEqualTo(200);
        cookie = login.response().headers().firstValue("set-cookie").orElseThrow().split(";")[0];
        assertThat(get("/orders").status()).isEqualTo(200);
    }

    @Test void expiredAndInvalidCookiesAreRejected() throws Exception {
        register("expiry@example.com");
        jdbc.update(schemas.qualify("UPDATE sessions SET expires_at=?"), Timestamp.from(Instant.now().minusSeconds(60)));
        assertThat(get("/orders").status()).isEqualTo(401);
        cookie = "growcer_session=invalid";
        assertThat(get("/auth/session").data().path("user").isNull()).isTrue();
    }

    @Test void authoritativePricesPersistAcrossRequests() throws Exception {
        register("orders@example.com");
        var result = order(orderBody(), "authoritative-order-0001");
        assertThat(result.status()).as(result.data().toString()).isEqualTo(201);
        var receipt = result.data().path("order");
        assertThat(receipt.path("subtotal").asDouble()).isEqualTo(40);
        assertThat(receipt.path("discount").asDouble()).isEqualTo(40);
        assertThat(receipt.path("total").asDouble()).isZero();
        assertThat(receipt.path("paymentStatus").asText()).isEqualTo("due_on_delivery");
        assertThat(get("/orders/" + receipt.path("id").asText()).data().path("order")).isEqualTo(receipt);
        assertThat(get("/orders").data().path("orders").size()).isEqualTo(1);
        assertThat(jdbc.queryForObject(schemas.qualify("SELECT COUNT(*) FROM orders"), Integer.class)).isEqualTo(1);
    }

    @Test void ordersAreVisibleOnlyToTheirOwner() throws Exception {
        register("owner@example.com");
        String id = order(orderBody(), "private-order-key-0001").data().path("order").path("id").asText();
        cookie = null; register("other@example.com");
        assertThat(get("/orders/" + id).status()).isEqualTo(404);
        assertThat(get("/orders").data().path("orders").isEmpty()).isTrue();
    }

    @Test void repeatAndConcurrentCheckoutDoNotDuplicateOrders() throws Exception {
        register("retry@example.com");
        var first = order(orderBody(), "repeat-order-request-0001");
        var repeat = order(orderBody(), "repeat-order-request-0001");
        assertThat(repeat.status()).isEqualTo(200);
        assertThat(repeat.data().path("order").path("id")).isEqualTo(first.data().path("order").path("id"));
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            Callable<Result> call = () -> order(orderBody(), "concurrent-request-0001");
            var calls = executor.invokeAll(List.of(call, call, call, call));
            String id = calls.getFirst().get().data().path("order").path("id").asText();
            for (var future : calls) {
                assertThat(future.get().status()).isIn(200, 201);
                assertThat(future.get().data().path("order").path("id").asText()).isEqualTo(id);
            }
        }
        assertThat(jdbc.queryForObject(schemas.qualify("SELECT COUNT(*) FROM orders"), Integer.class)).isEqualTo(2);
    }

    @Test void simulatedPaymentsApproveAndDeclineWithoutCharges() throws Exception {
        register("cards@example.com");
        var body = orderBody().put("payment", "card").put("simulation", "declined");
        assertThat(order(body, "declined-payment-0001").status()).isEqualTo(402);
        assertThat(jdbc.queryForObject(schemas.qualify("SELECT COUNT(*) FROM orders"), Integer.class)).isZero();
        body.put("simulation", "approved");
        var approved = order(body, "approved-payment-0001");
        assertThat(approved.status()).isEqualTo(201);
        assertThat(approved.data().path("order").path("paymentStatus").asText()).isEqualTo("simulated_paid");
        assertThat(approved.data().path("order").path("simulation").asBoolean()).isTrue();
        body.put("simulation", "unknown");
        assertThat(order(body, "invalid-payment-0001").status()).isEqualTo(400);
    }

    @Test void malformedAndOversizedRequestsAndMethodsAreHandled() throws Exception {
        register("invalid@example.com");
        assertThat(request("/orders", "POST", "{", cookie, Map.of()).status()).isEqualTo(400);
        assertThat(request("/orders", "POST", "{} {}", cookie, Map.of()).status()).isEqualTo(400);
        assertThat(request("/orders", "POST", "{\"unused\":\"" + "x".repeat(17000) + "\"}", cookie, Map.of()).status()).isEqualTo(413);
        assertThat(get("/auth/login").status()).isEqualTo(405);
        assertThat(get("/missing-route").status()).isEqualTo(404);
        assertThat(order(orderBody(), "bad").status()).isEqualTo(400);
    }

    @Test void crossOriginMutationsAreBlockedIncludingLogout() throws Exception {
        register("origin@example.com");
        assertThat(request("/auth/logout", "POST", "{}", cookie, Map.of("Origin", "https://other.example")).status()).isEqualTo(403);
        assertThat(request("/auth/logout", "POST", "{}", cookie, Map.of("Origin", "http://127.0.0.1:" + port)).status()).isEqualTo(200);
    }

    @Test void authenticationAttemptsAreRateLimitedInDatabase() throws Exception {
        Result last = null;
        for (int n = 0; n < 16; n++) last = post("/auth/login", Map.of("email", "limit@example.com", "password", "wrongpassword"));
        assertThat(last.status()).isEqualTo(429);
        assertThat(jdbc.queryForObject(schemas.qualify("SELECT count FROM auth_attempts"), Integer.class)).isEqualTo(16);
    }

    @Test void invalidAccountsAndDeliveryAreRejected() throws Exception {
        assertThat(post("/auth/register", Map.of("email", "bad", "password", "short", "name", "A")).status()).isEqualTo(400);
        assertThat(post("/auth/register", Map.of("email", "valid@example.com", "password", "password123", "name", "A")).status()).isEqualTo(400);
        register("validation@example.com");
        var body = orderBody(); body.withObject("/customer").put("phone", "12");
        assertThat(order(body, "invalid-delivery-0001").status()).isEqualTo(400);
        body = orderBody().put("coupon", "HACK");
        assertThat(order(body, "invalid-coupon-key-0001").status()).isEqualTo(400);
        body = orderBody(); body.withArray("items").get(0).withObject("").put("quantity", 1.5);
        assertThat(order(body, "invalid-quantity-0001").status()).isEqualTo(400);
    }

    @Test void chunkedOversizedBodiesAreBoundedAndNonJsonOrdersRejected() throws Exception {
        register("chunked@example.com");
        byte[] body = ("{\"unused\":\"" + "x".repeat(17000) + "\"}").getBytes(StandardCharsets.UTF_8);
        var request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api/orders"))
                .header("Cookie", cookie).header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofInputStream(() -> new java.io.ByteArrayInputStream(body))).build();
        assertThat(http.send(request, HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(413);
        request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api/orders"))
                .header("Cookie", cookie).header("Content-Type", "text/plain").POST(HttpRequest.BodyPublishers.ofString("{}")).build();
        assertThat(http.send(request, HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(415);
    }

    @Test void secureDeploymentCookiesAndExpiredRateLimitWindow() throws Exception {
        var controller = new StoreController(repository, passwords, new CatalogService(json), true);
        var req = new org.springframework.mock.web.MockHttpServletRequest("POST", "/api/auth/register");
        req.setRemoteAddr("127.0.0.1");
        var res = new org.springframework.mock.web.MockHttpServletResponse();
        controller.authenticate(json.readTree("{\"name\":\"Secure Shopper\",\"email\":\"secure@example.com\",\"password\":\"password123\"}"), req, res);
        assertThat(res.getHeader("Set-Cookie")).contains("Secure", "HttpOnly", "SameSite=Lax");
        String key = PasswordService.digest("127.0.0.1:limit@example.com");
        jdbc.update(schemas.qualify("INSERT INTO auth_attempts(key,count,reset_at) VALUES (?,?,?)"), key, 16, Timestamp.from(Instant.now().minusSeconds(60)));
        assertThat(post("/auth/login", Map.of("email", "limit@example.com", "password", "wrongpassword")).status()).isEqualTo(401);
        assertThat(jdbc.queryForObject(schemas.qualify("SELECT count FROM auth_attempts WHERE key=?"), Integer.class, key)).isEqualTo(1);
    }

    @Test void repositoriesCannotReadOrDeleteAnotherSchemasRows() throws Exception {
        register("isolation@example.com");
        String otherName = (schema == null ? "growcer_java_test_" + UUID.randomUUID().toString().replace("-", "") : schema) + "_other";
        var otherSchema = new SchemaSql(otherName);
        var otherStore = new StoreRepository(jdbc, json, otherSchema);
        try {
            otherStore.initialize();
            otherStore.createUser("other-schema-user", "isolation@example.com", "Other Schema", passwords.hash("password123"));
            assertThat(otherStore.userByEmail("isolation@example.com").get("id")).isEqualTo("other-schema-user");
            assertThat(repository.userByEmail("isolation@example.com").get("id")).isNotEqualTo("other-schema-user");
            jdbc.update(otherSchema.qualify("DELETE FROM users"));
            assertThat(repository.userByEmail("isolation@example.com")).isNotNull();
            assertThat(jdbc.queryForObject(schemas.qualify("SELECT COUNT(*) FROM users"), Integer.class)).isEqualTo(1);
        } finally {
            if (!otherName.matches("growcer_java_test_[a-f0-9]{32}_other")) throw new IllegalStateException("Refusing unsafe test-schema cleanup.");
            jdbc.execute("DROP SCHEMA " + otherName + " CASCADE");
        }
    }
}

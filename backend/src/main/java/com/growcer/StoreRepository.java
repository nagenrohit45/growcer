package com.growcer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class StoreRepository {
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private final SchemaSql schemas;

    public StoreRepository(JdbcTemplate jdbc, ObjectMapper json, SchemaSql schemas) { this.jdbc = jdbc; this.json = json; this.schemas = schemas; }

    @PostConstruct
    void initialize() {
        if (!schemas.schema().equals("public")) jdbc.execute("CREATE SCHEMA IF NOT EXISTS " + schemas.schema());
        jdbc.execute(schemas.qualify("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP)"));
        jdbc.execute(schemas.qualify("CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at TIMESTAMP WITH TIME ZONE NOT NULL)"));
        jdbc.execute(schemas.qualify("CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), request_key TEXT NOT NULL, payload JSONB NOT NULL, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, request_key))"));
        jdbc.execute(schemas.qualify("CREATE TABLE IF NOT EXISTS auth_attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at TIMESTAMP WITH TIME ZONE NOT NULL)"));
    }

    public Map<String, Object> userByEmail(String email) {
        var rows = jdbc.queryForList(schemas.qualify("SELECT id,email,name,password_hash FROM users WHERE email=?"), email);
        return rows.isEmpty() ? null : rows.getFirst();
    }

    public Map<String, Object> sessionUser(String tokenHash) {
        var rows = jdbc.queryForList(schemas.qualify("SELECT u.id,u.email,u.name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?"), tokenHash, Timestamp.from(Instant.now()));
        return rows.isEmpty() ? null : rows.getFirst();
    }

    public void createUser(String id, String email, String name, String hash) {
        jdbc.update(schemas.qualify("INSERT INTO users(id,email,name,password_hash) VALUES (?,?,?,?)"), id, email, name, hash);
    }

    public void createSession(String digest, String userId) {
        jdbc.update(schemas.qualify("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES (?,?,?)"), digest, userId, Timestamp.from(Instant.now().plusSeconds(7 * 86400)));
    }

    public void revokeSession(String digest) { jdbc.update(schemas.qualify("DELETE FROM sessions WHERE token_hash=?"), digest); }

    public void recordAttempt(String key) {
        var reset = Timestamp.from(Instant.now().plusSeconds(900));
        jdbc.update(schemas.qualify("INSERT INTO auth_attempts(key,count,reset_at) VALUES (?,0,?) ON CONFLICT DO NOTHING"), key, reset);
        jdbc.update(schemas.qualify("UPDATE auth_attempts SET count=0,reset_at=? WHERE key=? AND reset_at<?"), reset, key, Timestamp.from(Instant.now()));
        // The increment is atomic across application instances, not an in-memory limiter.
        jdbc.update(schemas.qualify("UPDATE auth_attempts SET count=count+1 WHERE key=?"), key);
        if (jdbc.queryForObject(schemas.qualify("SELECT count FROM auth_attempts WHERE key=?"), Integer.class, key) > 15) {
            throw new ApiException(429, "Too many sign-in attempts. Try again in 15 minutes.");
        }
    }

    public void clearAttempts(String key) { jdbc.update(schemas.qualify("DELETE FROM auth_attempts WHERE key=?"), key); }

    public List<JsonNode> orders(String userId) {
        return jdbc.query(schemas.qualify("SELECT payload FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 100"), (rs, n) -> parse(rs.getString(1)), userId);
    }

    public JsonNode order(String id, String userId) {
        var rows = jdbc.query(schemas.qualify("SELECT payload FROM orders WHERE id=? AND user_id=?"), (rs, n) -> parse(rs.getString(1)), id, userId);
        return rows.isEmpty() ? null : rows.getFirst();
    }

    public JsonNode previousOrder(String userId, String key) {
        var rows = jdbc.query(schemas.qualify("SELECT payload FROM orders WHERE user_id=? AND request_key=?"), (rs, n) -> parse(rs.getString(1)), userId, key);
        return rows.isEmpty() ? null : rows.getFirst();
    }

    public boolean saveOrder(String userId, String key, JsonNode order) {
        return jdbc.update(schemas.qualify("INSERT INTO orders(id,user_id,request_key,payload) VALUES (?,?,?,CAST(? AS JSONB)) ON CONFLICT DO NOTHING"), order.path("id").asText(), userId, key, order.toString()) == 1;
    }

    public void health() { jdbc.queryForObject(schemas.qualify("SELECT 1"), Integer.class); }

    private JsonNode parse(String value) {
        try {
            JsonNode node = json.readTree(value);
            // H2's test-only JSONB alias returns a quoted JSON string for CAST(? AS JSONB).
            return node.isTextual() ? json.readTree(node.asText()) : node;
        }
        catch (Exception exception) { throw new IllegalStateException("Stored order could not be read.", exception); }
    }
}

package com.growcer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;
import java.util.Collections;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class StoreController {
    private final StoreRepository store;
    private final PasswordService passwords;
    private final CatalogService catalog;
    private final boolean secureCookie;

    public StoreController(StoreRepository store, PasswordService passwords, CatalogService catalog, @Value("${growcer.cookie-secure:true}") boolean secureCookie) {
        this.store = store; this.passwords = passwords; this.catalog = catalog; this.secureCookie = secureCookie;
    }

    @GetMapping("/products")
    JsonNode products() { return catalog.catalog(); }

    @GetMapping("/health")
    Map<String, Object> health() { store.health(); return Map.of("ok", true, "paymentMode", "simulation"); }

    @GetMapping("/auth/session")
    Map<String, Object> session(Authentication auth) { return Collections.singletonMap("user", user(auth)); }

    @PostMapping("/auth/logout")
    Map<String, Object> logout(HttpServletRequest req, HttpServletResponse res) {
        String token = SessionFilter.cookie(req);
        if (token != null) store.revokeSession(PasswordService.digest(token));
        cookie(res, "", 0);
        return Map.of("ok", true);
    }

    @PostMapping(value = {"/auth/register", "/auth/login"}, consumes = "application/json")
    ResponseEntity<?> authenticate(@RequestBody JsonNode body, HttpServletRequest req, HttpServletResponse res) {
        String email = CatalogService.text(body, "email").strip().toLowerCase(Locale.ROOT);
        String password = CatalogService.text(body, "password");
        if (!email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+") || email.length() > 254 || password.length() < 8 || password.length() > 128) {
            throw new ApiException(400, "Enter a valid email and a password with 8–128 characters.");
        }
        // Do not trust caller-controlled X-Forwarded-For. A trusted reverse proxy must set RemoteAddr.
        String attemptKey = PasswordService.digest(req.getRemoteAddr() + ":" + email);
        store.recordAttempt(attemptKey);
        boolean register = req.getRequestURI().endsWith("/register");
        Map<String, Object> account;
        if (register) {
            String name = CatalogService.text(body, "name").strip();
            if (name.length() < 2 || name.length() > 100) throw new ApiException(400, "Enter your name (2–100 characters).");
            String id = UUID.randomUUID().toString();
            try { store.createUser(id, email, name, passwords.hash(password)); }
            catch (DuplicateKeyException exception) { throw new ApiException(409, "An account with this email already exists. Please sign in."); }
            account = Map.of("id", id, "email", email, "name", name);
        } else {
            Map<String, Object> row = store.userByEmail(email);
            if (!passwords.matches(password, row == null ? null : (String) row.get("password_hash"))) {
                throw new ApiException(401, "Email or password is incorrect.");
            }
            account = Map.of("id", row.get("id"), "email", row.get("email"), "name", row.get("name"));
        }
        String token = passwords.token();
        store.createSession(PasswordService.digest(token), account.get("id").toString());
        store.clearAttempts(attemptKey);
        cookie(res, token, 7 * 86400);
        return ResponseEntity.status(register ? 201 : 200).body(Map.of("user", account));
    }

    @GetMapping("/orders")
    Map<String, Object> orders(Authentication auth) { return Map.of("orders", store.orders(userId(auth))); }

    @GetMapping("/orders/{id}")
    Map<String, Object> order(@PathVariable String id, Authentication auth) {
        JsonNode order = store.order(id, userId(auth));
        if (order == null) throw new ApiException(404, "Order not found.");
        return Map.of("order", order);
    }

    @PostMapping(value = "/orders", consumes = "application/json")
    ResponseEntity<?> createOrder(@RequestBody JsonNode body, @RequestHeader(value = "Idempotency-Key", required = false) String key, Authentication auth) {
        if (key == null || !key.matches("[A-Za-z0-9_-]{16,100}")) throw new ApiException(400, "A valid order request key is required.");
        String userId = userId(auth);
        JsonNode previous = store.previousOrder(userId, key);
        if (previous != null) return ResponseEntity.ok(Map.of("order", previous));
        if (!body.isObject()) throw new ApiException(400, "Send a JSON object.");
        String coupon = CatalogService.text(body, "coupon");
        if (body.hasNonNull("coupon") && !body.path("coupon").isTextual()) throw new ApiException(400, "This coupon is not valid.");
        var order = catalog.price(body.get("items"), coupon);
        order.set("customer", catalog.delivery(body.get("customer")));
        String payment = CatalogService.text(body, "payment");
        if (!payment.equals("cod") && !payment.equals("card")) throw new ApiException(400, "Choose a payment method.");
        String simulation = CatalogService.text(body, "simulation");
        if (payment.equals("card") && !simulation.equals("approved") && !simulation.equals("declined")) throw new ApiException(400, "Choose a simulated card outcome.");
        if (payment.equals("card") && simulation.equals("declined")) throw new ApiException(402, "Simulated payment declined. No money was charged. Try an approved simulation or cash on delivery.");
        order.put("id", "ORD-" + UUID.randomUUID()); order.put("payment", payment);
        order.put("paymentStatus", payment.equals("cod") ? "due_on_delivery" : "simulated_paid");
        order.put("status", "confirmed"); order.put("createdAt", Instant.now().toString()); order.put("simulation", true);
        boolean created = store.saveOrder(userId, key, order);
        return ResponseEntity.status(created ? 201 : 200).body(Map.of("order", created ? order : store.previousOrder(userId, key)));
    }

    private Map<?, ?> user(Authentication auth) { return auth != null && auth.getPrincipal() instanceof Map<?, ?> map ? map : null; }
    private String userId(Authentication auth) {
        Map<?, ?> user = user(auth);
        if (user == null) throw new ApiException(401, "Please sign in to continue.");
        return user.get("id").toString();
    }
    private void cookie(HttpServletResponse res, String token, int age) {
        res.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from("growcer_session", token).httpOnly(true).sameSite("Lax").secure(secureCookie).path("/").maxAge(age).build().toString());
    }
}

package com.growcer;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class SessionFilter extends OncePerRequestFilter {
    private final StoreRepository store;
    private final ObjectMapper json;
    private final String publicOrigin;

    public SessionFilter(StoreRepository store, ObjectMapper json, @Value("${growcer.public-origin:}") String publicOrigin) {
        this.store = store; this.json = json; this.publicOrigin = publicOrigin;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-Content-Type-Options", "nosniff");
        if (!List.of("GET", "HEAD", "OPTIONS").contains(req.getMethod())) {
            String origin = req.getHeader("Origin");
            String ownOrigin = req.getScheme() + "://" + req.getServerName()
                    + ((req.getServerPort() == 80 && req.getScheme().equals("http")) || (req.getServerPort() == 443 && req.getScheme().equals("https")) ? "" : ":" + req.getServerPort());
            if ((origin != null && !origin.equals(ownOrigin) && !origin.equals(publicOrigin)) || "cross-site".equals(req.getHeader("Sec-Fetch-Site"))) {
                send(res, 403, "This request origin is not allowed."); return;
            }
            if (req.getContentLengthLong() > 16384) { send(res, 413, "Request is too large."); return; }
            // Also bound chunked requests that do not declare Content-Length.
            byte[] body = req.getInputStream().readNBytes(16385);
            if (body.length > 16384) { send(res, 413, "Request is too large."); return; }
            req = new BoundedJsonRequest(req, body);
        }
        try {
            String token = cookie(req);
            Map<String, Object> user = token == null ? null : store.sessionUser(PasswordService.digest(token));
            if (user != null) SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user, null, List.of()));
            chain.doFilter(req, res);
        } catch (org.springframework.dao.DataAccessException exception) {
            send(res, 503, "The store database is unavailable. Please try again shortly.");
        } finally { SecurityContextHolder.clearContext(); }
    }

    static String cookie(HttpServletRequest req) {
        if (req.getCookies() == null) return null;
        return Arrays.stream(req.getCookies()).filter(c -> c.getName().equals("growcer_session") && c.getValue().matches("[a-f0-9]{64}"))
                .map(jakarta.servlet.http.Cookie::getValue).findFirst().orElse(null);
    }

    private void send(HttpServletResponse res, int status, String error) throws IOException {
        res.setStatus(status); res.setContentType("application/json"); json.writeValue(res.getOutputStream(), Map.of("error", error));
    }
}

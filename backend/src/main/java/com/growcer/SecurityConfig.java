package com.growcer;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {
    @Bean
    SecurityFilterChain security(HttpSecurity http, SessionFilter sessions, ObjectMapper json) throws Exception {
        return http
                // JSON-only mutations + strict Origin/Sec-Fetch-Site checks in SessionFilter.
                // Preserve the existing frontend contract without a new CSRF-token flow.
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(cache -> cache.disable())
                .formLogin(form -> form.disable()).httpBasic(basic -> basic.disable()).logout(logout -> logout.disable())
                .authorizeHttpRequests(auth -> auth.requestMatchers("/api/orders", "/api/orders/**").authenticated().anyRequest().permitAll())
                .exceptionHandling(errors -> errors.authenticationEntryPoint((req, res, exception) -> {
                    res.setStatus(401); res.setContentType("application/json"); json.writeValue(res.getOutputStream(), Map.of("error", "Please sign in to continue."));
                }))
                .addFilterBefore(sessions, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    FilterRegistrationBean<SessionFilter> sessionRegistration(SessionFilter filter) {
        var registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false); // Run exactly once, inside the security chain.
        return registration;
    }
}

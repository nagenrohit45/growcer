package com.growcer;

import com.zaxxer.hikari.HikariDataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import javax.sql.DataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class DatabaseConfig {
    @Bean
    DataSource dataSource(Environment env) {
        var ds = new HikariDataSource();
        ds.setMaximumPoolSize(5);
        ds.setConnectionTimeout(10000);
        String jdbc = env.getProperty("spring.datasource.url");
        if (jdbc != null && !jdbc.isBlank()) {
            ds.setJdbcUrl(jdbc);
            ds.setUsername(env.getProperty("spring.datasource.username", ""));
            ds.setPassword(env.getProperty("spring.datasource.password", ""));
            // Test-only H2 is not on the production classpath.
            return ds;
        }
        String value = env.getProperty("DATABASE_URL", "");
        if (!value.startsWith("postgres://") && !value.startsWith("postgresql://")) {
            throw new IllegalStateException("Set DATABASE_URL to the Growcer PostgreSQL connection URL. No database fallback is enabled.");
        }
        URI uri;
        try { uri = URI.create(value); }
        catch (IllegalArgumentException exception) { throw new IllegalStateException("DATABASE_URL is not a valid PostgreSQL URL."); }
        String[] credentials = uri.getRawUserInfo() == null ? new String[0] : uri.getRawUserInfo().split(":", 2);
        if (credentials.length != 2) throw new IllegalStateException("DATABASE_URL must contain PostgreSQL credentials.");
        ds.setUsername(decode(credentials[0]));
        ds.setPassword(decode(credentials[1]));
        String query = uri.getRawQuery();
        // pgjdbc uses channelBinding, whereas libpq/Neon URLs use channel_binding.
        if (query != null) query = query.replace("channel_binding=", "channelBinding=");
        ds.setJdbcUrl("jdbc:postgresql://" + uri.getHost() + (uri.getPort() == -1 ? "" : ":" + uri.getPort())
                + uri.getRawPath() + (query == null ? "" : "?" + query));
        return ds;
    }

    private static String decode(String input) {
        return URLDecoder.decode(input.replace("+", "%2B"), StandardCharsets.UTF_8);
    }
}

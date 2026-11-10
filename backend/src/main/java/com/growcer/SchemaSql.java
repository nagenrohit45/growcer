package com.growcer;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class SchemaSql {
    private final String schema;
    public SchemaSql(@Value("${growcer.schema:${DATABASE_SCHEMA:public}}") String schema) {
        if (!schema.matches("[a-z][a-z0-9_]{0,62}")) throw new IllegalStateException("DATABASE_SCHEMA must be a simple lowercase SQL identifier.");
        this.schema = schema;
    }
    String schema() { return schema; }
    String qualify(String sql) {
        // SQL strings are application constants. Never rely on pooled-connection search_path.
        return sql.replaceAll("\\b(users|sessions|orders|auth_attempts)\\b", schema + ".$1");
    }
}

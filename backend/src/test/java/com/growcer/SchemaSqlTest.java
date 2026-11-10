package com.growcer;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class SchemaSqlTest {
    @Test void qualifiesEveryTableIncludingJoinsAndReferences() {
        var schema = new SchemaSql("growcer_java_local");
        assertThat(schema.qualify("SELECT u.id FROM sessions s JOIN users u ON u.id=s.user_id"))
                .isEqualTo("SELECT u.id FROM growcer_java_local.sessions s JOIN growcer_java_local.users u ON u.id=s.user_id");
        assertThat(schema.qualify("CREATE TABLE orders (user_id TEXT REFERENCES users(id))"))
                .isEqualTo("CREATE TABLE growcer_java_local.orders (user_id TEXT REFERENCES growcer_java_local.users(id))");
        assertThat(new SchemaSql("public").qualify("DELETE FROM auth_attempts WHERE key=?"))
                .isEqualTo("DELETE FROM public.auth_attempts WHERE key=?");
    }
}

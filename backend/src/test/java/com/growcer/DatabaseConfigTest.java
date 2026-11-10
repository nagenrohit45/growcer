package com.growcer;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import static org.assertj.core.api.Assertions.*;

class DatabaseConfigTest {
    @Test void refusesMissingDatabaseRatherThanUsingEphemeralProductionData() {
        assertThatThrownBy(() -> new DatabaseConfig().dataSource(new MockEnvironment())).isInstanceOf(IllegalStateException.class).hasMessageContaining("DATABASE_URL");
    }
    @Test void preservesEncodedCredentialsAndNeonConnectionOptions() {
        try (var ds = (HikariDataSource) new DatabaseConfig().dataSource(new MockEnvironment().withProperty("DATABASE_URL", "postgresql://test%40user:pass+word%3A123@db.example:5432/growcer?sslmode=require&channel_binding=require"))) {
            assertThat(ds.getUsername()).isEqualTo("test@user");
            assertThat(ds.getPassword()).isEqualTo("pass+word:123");
            assertThat(ds.getJdbcUrl()).isEqualTo("jdbc:postgresql://db.example:5432/growcer?sslmode=require&channelBinding=require");
            assertThat(ds.getConnectionInitSql()).isNull();
        }
    }
    @Test void rejectsUnsafeSchemaNames() {
        assertThatThrownBy(() -> new SchemaSql("public; DROP TABLE users")).isInstanceOf(IllegalStateException.class).hasMessageContaining("DATABASE_SCHEMA");
    }
}

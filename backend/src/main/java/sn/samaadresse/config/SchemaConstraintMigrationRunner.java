package sn.samaadresse.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Migration idempotente de la contrainte CHECK PostgreSQL sur addresses.status
 * pour inclure le statut SUSPENDED introduit au Lot 4 (complète Hibernate ddl-auto=update).
 */
@Slf4j
@Component
@Profile("dev")
@Order(1)
@RequiredArgsConstructor
public class SchemaConstraintMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("ALTER TABLE addresses DROP CONSTRAINT IF EXISTS addresses_status_check");
            jdbcTemplate.execute(
                    "ALTER TABLE addresses ADD CONSTRAINT addresses_status_check " +
                    "CHECK (status IN ('ACTIVE', 'ARCHIVED', 'SUSPENDED', 'SIGNALED'))"
            );
            log.info("[MIGRATION-LOT4] Contrainte CHECK addresses_status_check mise à jour (ACTIVE, ARCHIVED, SUSPENDED, SIGNALED).");
        } catch (Exception e) {
            log.debug("[MIGRATION-LOT4] Mise à jour de contrainte ignorée : {}", e.getMessage());
        }
    }
}

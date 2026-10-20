#!/usr/bin/env python3
"""
scripts/purge-test-data.py
Purge ciblée et idempotente des données de test générées lors des recettes.
Règle R5 : Ne supprime QUE les données préfixées test+ / TEST- sans toucher
aux comptes ou adresses de démonstration (demo@samaadresse.sn, admin@samaadresse.sn, ZIG-* démo).
"""

import os
import sys
import subprocess
import urllib.parse

def get_database_url():
    # 1. Variable d'environnement directe
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        return db_url

    # 2. Lecture dans .env s'il existe
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(root_dir, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("DATABASE_URL="):
                    return line.split("=", 1)[1].strip()
                if line.startswith("PROD_TEST_DB_PASSWORD="):
                    pwd = line.split("=", 1)[1].strip()
                    return f"postgres://samaadresse_prod_user:{pwd}@localhost:5432/samaadresse_prod"
    return None

def main():
    print("=== Purge des données de test SamaAdresse (Règle R5) ===")

    db_url = get_database_url()

    # Déterminer si on utilise docker exec ou psql direct
    docker_container = "samaadresse-prod-test-db"
    has_docker = False
    try:
        res = subprocess.run(
            ["docker", "ps", "--format", "{{.Names}}"],
            capture_output=True,
            text=True,
            check=False
        )
        if docker_container in res.stdout:
            has_docker = True
    except Exception:
        has_docker = False

    sql_statements = """
    DO $$
    DECLARE
        v_deleted_users INT := 0;
        v_deleted_addresses INT := 0;
        v_deleted_codes INT := 0;
        v_deleted_reports INT := 0;
    BEGIN
        -- 1. Supprimer les signalements liés aux adresses de test
        WITH target_addresses AS (
            SELECT a.id FROM addresses a
            JOIN users u ON a.owner_id = u.id
            WHERE u.email LIKE 'test+%' OR u.email LIKE 'TEST-%'
        )
        DELETE FROM address_reports
        WHERE address_id IN (SELECT id FROM target_addresses);
        GET DIAGNOSTICS v_deleted_reports = ROW_COUNT;

        -- 2. Supprimer les codes réservés des utilisateurs de test
        DELETE FROM reserved_codes
        WHERE user_id IN (
            SELECT id FROM users
            WHERE email LIKE 'test+%' OR email LIKE 'TEST-%'
        );
        GET DIAGNOSTICS v_deleted_codes = ROW_COUNT;

        -- 3. Supprimer les adresses des utilisateurs de test
        DELETE FROM addresses
        WHERE owner_id IN (
            SELECT id FROM users
            WHERE email LIKE 'test+%' OR email LIKE 'TEST-%'
        );
        GET DIAGNOSTICS v_deleted_addresses = ROW_COUNT;

        -- 4. Supprimer les jetons de rafraîchissement
        DELETE FROM refresh_tokens
        WHERE user_id IN (
            SELECT id FROM users
            WHERE email LIKE 'test+%' OR email LIKE 'TEST-%'
        );

        -- 5. Supprimer les utilisateurs de test
        DELETE FROM users
        WHERE email LIKE 'test+%' OR email LIKE 'TEST-%';
        GET DIAGNOSTICS v_deleted_users = ROW_COUNT;

        RAISE NOTICE 'PURGE_SUMMARY: users=%, addresses=%, reserved_codes=%, reports=%',
            v_deleted_users, v_deleted_addresses, v_deleted_codes, v_deleted_reports;
    END $$;
    """

    if has_docker:
        print(f"Exécution via conteneur Docker '{docker_container}'...")
        proc = subprocess.run(
            ["docker", "exec", "-i", docker_container, "psql", "-U", "samaadresse_prod_user", "-d", "samaadresse_prod"],
            input=sql_statements,
            text=True,
            capture_output=True
        )
        output = proc.stdout + proc.stderr
        print(output)
        if proc.returncode != 0:
            print("Erreur lors de l'exécution SQL sur le conteneur Docker.", file=sys.stderr)
            return 1
    elif db_url:
        print("Exécution via psql et DATABASE_URL...")
        proc = subprocess.run(
            ["psql", db_url],
            input=sql_statements,
            text=True,
            capture_output=True
        )
        output = proc.stdout + proc.stderr
        print(output)
        if proc.returncode != 0:
            print("Erreur lors de l'exécution SQL via psql.", file=sys.stderr)
            return 1
    else:
        print("Aucune base de données PostgreSQL joignable (ni Docker ni DATABASE_URL).")
        print("Commande SQL de purge prête et disponible.")
        return 0

    print("Purge terminée avec succès.")
    return 0

if __name__ == "__main__":
    sys.exit(main())

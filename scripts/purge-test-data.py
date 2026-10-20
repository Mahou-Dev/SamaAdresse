#!/usr/bin/env python3
"""
scripts/purge-test-data.py
Purge ciblée, sécurisée et contrôlée des données de test.

RÈGLES IMPÉRATIVES :
1. Mode par défaut = SELECT seul (--dry-run). Aucune modification en base sans --confirm explicite.
2. Utilise --database-url (ne lit aucun mot de passe dans les fichiers) ou conteneur Docker local.
3. Affiche le nom de l'hôte cible.
4. Demande confirmation en saisissant le nom de l'hôte ET le nombre exact de comptes.
5. Exécution via psql -v ON_ERROR_STOP=1.
6. Exclusion stricte des 3 comptes protégés (admin@, demo@, fatou@) et des 13 adresses d'origine.
7. INTERDICTION D'EXÉCUTION SUR NEON (base de production cloud).
"""

import sys
import os
import argparse
import subprocess
from urllib.parse import urlparse

# Comptes officiels protégés
PROTECTED_EMAILS = [
    "admin@samaadresse.sn",
    "demo@samaadresse.sn",
    "fatou@samaadresse.sn",
]

# Les 13 adresses de démonstration d'origine de Ziguinchor protégées
ORIGINAL_DEMO_CODES = [
    "ZIG-KBG-4271",
    "ZIG-ESC-1042",
    "ZIG-TIL-3015",
    "ZIG-KND-5012",
    "ZIG-NEM-6021",
    "ZIG-KBG-4272",
    "ZIG-ESC-1088",
    "ZIG-TIL-3040",
    "ZIG-KND-5080",
    "ZIG-NEM-6055",
    "ZIG-KBG-4300",
    "ZIG-TIL-3099",
    "ZIG-KND-8319",
]

def run_psql_cmd(sql: str, db_url: str = None, container: str = None):
    if db_url:
        parsed = urlparse(db_url)
        host = parsed.hostname or "localhost"
        if "neon.tech" in host:
            raise PermissionError("SÉCURITÉ ABSOLUE : Exécution sur la base Neon strictement interdite.")
        cmd = ["psql", "-v", "ON_ERROR_STOP=1", db_url, "-A", "-F", "|", "-t"]
        res = subprocess.run(cmd, input=sql, text=True, capture_output=True)
        if res.returncode != 0:
            raise RuntimeError(f"Erreur psql: {res.stderr}")
        return res.stdout.strip()
    elif container:
        cmd = ["docker", "exec", "-i", container, "psql", "-v", "ON_ERROR_STOP=1", "-U", "samaadresse_prod_user", "-d", "samaadresse_prod", "-A", "-F", "|", "-t"]
        res = subprocess.run(cmd, input=sql, text=True, capture_output=True)
        if res.returncode != 0:
            raise RuntimeError(f"Erreur docker psql: {res.stderr}")
        return res.stdout.strip()
    else:
        raise ValueError("Aucune cible de base de données spécifiée.")

def main():
    parser = argparse.ArgumentParser(description="Purge sécurisée des comptes et adresses de test.")
    parser.add_argument("--database-url", default=None, help="URL de connexion PostgreSQL (PostgreSQL local uniquement)")
    parser.add_argument("--container", default=None, help="Conteneur Docker cible (ex: samaadresse-prod-test-db)")
    parser.add_argument("--confirm", action="store_true", help="Confirmer la suppression effective (sinon mode --dry-run par défaut)")
    parser.add_argument("--dry-run", action="store_true", default=True, help="Mode simulation / SELECT seul (défaut)")
    parser.add_argument("--expected-host", type=str, default=None, help="Nom de l'hôte attendu pour validation scriptée")
    parser.add_argument("--expected-count", type=int, default=None, help="Nombre de comptes de test attendus pour validation")
    args = parser.parse_args()

    # Détermination de la cible et de l'hôte
    target_host = "localhost"
    if args.database_url:
        parsed = urlparse(args.database_url)
        target_host = parsed.hostname or "localhost"
        if "neon.tech" in target_host:
            print("ERREUR DE SÉCURITÉ : Exécution sur Neon strictement interdite !", file=sys.stderr)
            sys.exit(1)
    elif args.container:
        target_host = args.container
    else:
        # Par défaut conteneur local si présent
        args.container = "samaadresse-prod-test-db"
        target_host = args.container

    is_dry_run = not args.confirm

    print("======================================================================")
    print("      NETTOYAGE DES DONNÉES DE TEST SAMAADRESSE (scripts/purge-test-data.py)")
    print(f"      Mode       : {'[DRY-RUN / SELECT SEUL]' if is_dry_run else '[SUPPRESSION EFFECTIVE]'}")
    print(f"      Hôte cible : {target_host}")
    print("======================================================================\n")

    protected_emails_sql = ", ".join(f"'{e}'" for e in PROTECTED_EMAILS)
    protected_codes_sql = ", ".join(f"'{c}'" for c in ORIGINAL_DEMO_CODES)

    # 1. Inventaire des comptes ciblés
    query_users = f"""
    SELECT u.id, u.email, u.full_name, COUNT(a.id) as addr_count
    FROM users u
    LEFT JOIN addresses a ON a.owner_id = u.id
    WHERE (u.email LIKE 'test+%' OR u.email LIKE '%@example.com' OR u.email LIKE 'test-%')
      AND u.email NOT IN ({protected_emails_sql})
    GROUP BY u.id, u.email, u.full_name
    ORDER BY u.email;
    """

    out_users = run_psql_cmd(query_users, db_url=args.database_url, container=args.container)
    user_rows = [line.split("|") for line in out_users.splitlines() if line.strip()]

    print(f"1. COMPTES DE TEST IDENTIFIÉS : {len(user_rows)}")
    for r in user_rows:
        print(f"   - ID: {r[0]} | Email: {r[1]} | Nom: {r[2]} | Adresses: {r[3]}")
    if not user_rows:
        print("   (Aucun compte de test trouvé)")

    # 2. Inventaire des adresses ciblées
    query_addresses = f"""
    SELECT a.id, a.code, a.zone, a.quartier, a.status, u.email
    FROM addresses a
    JOIN users u ON a.owner_id = u.id
    WHERE (u.email LIKE 'test+%' OR u.email LIKE '%@example.com' OR u.email LIKE 'test-%')
      AND u.email NOT IN ({protected_emails_sql})
      AND a.code NOT IN ({protected_codes_sql})
    ORDER BY a.code;
    """

    out_addrs = run_psql_cmd(query_addresses, db_url=args.database_url, container=args.container)
    addr_rows = [line.split("|") for line in out_addrs.splitlines() if line.strip()]

    print(f"\n2. ADRESSES DE TEST IDENTIFIÉES : {len(addr_rows)}")
    for a in addr_rows:
        print(f"   - Code: {a[1]} (Zone: {a[2]}, Quartier: {a[3]}, Statut: {a[4]}) | Propriétaire: {a[5]}")
    if not addr_rows:
        print("   (Aucune adresse de test associée trouvée)")

    # 3. Contrôle des données protégées
    query_sanity = f"""
    SELECT
      (SELECT COUNT(*) FROM users WHERE email IN ({protected_emails_sql})) as protected_users,
      (SELECT COUNT(*) FROM addresses WHERE code IN ({protected_codes_sql})) as protected_addresses;
    """
    out_sanity = run_psql_cmd(query_sanity, db_url=args.database_url, container=args.container)
    sanity_parts = out_sanity.split("|") if out_sanity else ["0", "0"]
    prot_users_count = sanity_parts[0] if len(sanity_parts) > 0 else "0"
    prot_addr_count = sanity_parts[1] if len(sanity_parts) > 1 else "0"

    print(f"\n3. CONTRÔLE D'INTÉGRITÉ DES DONNÉES PROTÉGÉES :")
    print(f"   - Comptes officiels protégés conservés : {prot_users_count} ({', '.join(PROTECTED_EMAILS)})")
    print(f"   - Adresses de démo d'origine protégées : {prot_addr_count} / {len(ORIGINAL_DEMO_CODES)}")

    # Mode DRY-RUN
    if is_dry_run:
        print("\n======================================================================")
        print("[DRY-RUN TERMINÉ] Mode simulation actif : aucune donnée n'a été modifiée.")
        print("Pour exécuter la purge réelle, relancez avec :")
        if args.database_url:
            print(f"  python3 scripts/purge-test-data.py --database-url \"$DATABASE_URL\" --confirm --expected-host {target_host} --expected-count {len(user_rows)}")
        else:
            print(f"  python3 scripts/purge-test-data.py --container {args.container} --confirm --expected-host {target_host} --expected-count {len(user_rows)}")
        print("======================================================================")
        return 0

    # Mode RÉEL avec --confirm
    print("\n----------------------------------------------------------------------")
    print("DEMANDE DE CONFIRMATION STRICTE DE SUPPRESSION :")
    
    # 1. Vérification du nom d'hôte
    confirm_host = args.expected_host
    if not confirm_host:
        confirm_host = input(f"Veuillez saisir le nom exact de l'hôte cible ({target_host}) : ").strip()
    if confirm_host != target_host:
        print(f"ERREUR DE SÉCURITÉ : Nom d'hôte saisi '{confirm_host}' != attendu '{target_host}'. Abandon.", file=sys.stderr)
        sys.exit(1)

    # 2. Vérification du nombre de comptes
    expected_count = args.expected_count
    if expected_count is None:
        val = input(f"Veuillez saisir le nombre exact de comptes de test à purger ({len(user_rows)}) : ").strip()
        try:
            expected_count = int(val)
        except ValueError:
            print("Erreur: saisie non numérique. Annulation.", file=sys.stderr)
            sys.exit(1)

    if expected_count != len(user_rows):
        print(f"ERREUR DE SÉCURITÉ : Nombre saisi ({expected_count}) != détecté ({len(user_rows)}). Abandon.", file=sys.stderr)
        sys.exit(1)

    if len(user_rows) == 0:
        print("Aucun compte de test à purger.")
        return 0

    print(f"\nConfirmation validée (Hôte: {target_host}, Comptes: {len(user_rows)}).")
    print(f"Exécution de scripts/purge-test-data.sql via psql -v ON_ERROR_STOP=1...")

    sql_file = os.path.join(os.path.dirname(__file__), "purge-test-data.sql")
    with open(sql_file, "r", encoding="utf-8") as f:
        purge_sql = f.read()

    output = run_psql_cmd(purge_sql, db_url=args.database_url, container=args.container)
    print(output)
    print("\nPurge exécutée avec succès.")

    # Re-contrôle final
    out_users_after = run_psql_cmd(query_users, db_url=args.database_url, container=args.container)
    remaining = len([l for l in out_users_after.splitlines() if l.strip()])
    print(f"Comptes de test restants après purge : {remaining}")

if __name__ == "__main__":
    main()

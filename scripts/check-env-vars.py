#!/usr/bin/env python3
"""
scripts/check-env-vars.py
Vérifie la stricte cohérence des variables d'environnement (Lot 8b) :
1. Toute variable lue dans application*.yml ou dans le code Java (@Value / System.getenv)
   doit figurer dans .env.example ET dans le tableau du README.md.
2. Toute variable de .env.example doit être lue quelque part (backend ou frontend).
"""
import glob
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def main():
    # 1. Variables lues dans application*.yml
    app_yml_vars = set()
    for yml in glob.glob(str(ROOT / "backend/src/main/resources/application*.yml")):
        txt = Path(yml).read_text(encoding="utf-8")
        # Match ${VAR_NAME:...} ou ${VAR_NAME}
        for m in re.finditer(r'\$\{([A-Z0-9_]+)(?::[^}]*)?\}', txt):
            app_yml_vars.add(m.group(1))

    # 2. Variables lues dans le code Java (@Value("${VAR:...}") ou System.getenv("VAR"))
    java_vars = set()
    for jf in glob.glob(str(ROOT / "backend/src/main/java/**/*.java"), recursive=True):
        txt = Path(jf).read_text(encoding="utf-8")
        for m in re.finditer(r'@Value\(\s*["\']\$\{([A-Z0-9_]+)(?::[^}]*)?\}["\']\s*\)', txt):
            java_vars.add(m.group(1))
        for m in re.finditer(r'System\.getenv\(\s*["\']([A-Z0-9_]+)["\']\s*\)', txt):
            java_vars.add(m.group(1))

    # DATABASE_URL est également gérée par DatabaseUrlEnvironmentPostProcessor
    backend_vars = app_yml_vars | java_vars
    backend_vars.add("DATABASE_URL")

    # 3. Variables lues dans frontend/src (import.meta.env.VITE_*)
    fe_vars = set()
    for ext in ("*.ts", "*.tsx"):
        for fe in glob.glob(str(ROOT / f"frontend/src/**/{ext}"), recursive=True):
            txt = Path(fe).read_text(encoding="utf-8")
            for m in re.finditer(r'import\.meta\.env\.(VITE_[A-Z0-9_]+)', txt):
                fe_vars.add(m.group(1))

    # 4. Variables définies dans .env.example
    env_example_path = ROOT / ".env.example"
    env_example_vars = set()
    for line in env_example_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            m = re.match(r'^([A-Z0-9_]+)=', line)
            if m:
                env_example_vars.add(m.group(1))

    # 5. Variables documentées dans le tableau du README.md
    readme_path = ROOT / "README.md"
    readme_vars = set()
    for line in readme_path.read_text(encoding="utf-8").splitlines():
        m = re.match(r'^\|\s*`([A-Z0-9_]+)`\s*\|', line)
        if m:
            readme_vars.add(m.group(1))

    all_read_vars = backend_vars | fe_vars

    errors = []

    # Règle 1: toute variable lue dans backend doit figurer dans .env.example
    missing_in_env_example = backend_vars - env_example_vars
    if missing_in_env_example:
        errors.append(f"Variables backend manquantes dans .env.example : {sorted(missing_in_env_example)}")

    # Règle 2: toute variable lue dans backend doit figurer dans le tableau du README
    missing_in_readme = backend_vars - readme_vars
    if missing_in_readme:
        errors.append(f"Variables backend manquantes dans le tableau du README.md : {sorted(missing_in_readme)}")

    # Règle 3: toute variable de .env.example doit être lue quelque part (backend ou frontend)
    unused_in_env_example = env_example_vars - all_read_vars
    if unused_in_env_example:
        errors.append(f"Variables de .env.example non lues dans le code : {sorted(unused_in_env_example)}")

    # Règle 4: toute variable de .env.example doit être documentée dans le README
    env_missing_in_readme = env_example_vars - readme_vars
    if env_missing_in_readme:
        errors.append(f"Variables de .env.example non documentées dans le README.md : {sorted(env_missing_in_readme)}")

    print(f"Total variables backend lues : {len(backend_vars)}")
    print(f"Total variables frontend lues : {len(fe_vars)}")
    print(f"Total variables dans .env.example : {len(env_example_vars)}")
    print(f"Total variables dans le tableau README : {len(readme_vars)}")

    if errors:
        print("\n--- ERREURS DE COHÉRENCE DES VARIABLES ---")
        for e in errors:
            print(f"- {e}")
        return 1
    else:
        print("\nCohérence parfaite des variables d'environnement (0 divergence) — Atteint")
        return 0

if __name__ == "__main__":
    sys.exit(main())

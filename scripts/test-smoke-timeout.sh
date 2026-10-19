#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"; [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null || true' EXIT

# 1. Démarrer un faux serveur HTTP local qui simule un timeout (ne répond pas aux requêtes)
DUMMY_SERVER_LOG="$TMP_DIR/server.log"
python3 -u - << 'PYEOF' > "$DUMMY_SERVER_LOG" 2>&1 &
import socket, time

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind(('127.0.0.1', 0))
port = server.getsockname()[1]
print(f"PORT={port}", flush=True)
server.listen(5)

while True:
    try:
        conn, addr = server.accept()
        # On lit les données entrantes mais on s'endort sans répondre pour déclencher le timeout client
        _ = conn.recv(1024)
        time.sleep(10)
        conn.close()
    except Exception:
        break
PYEOF
SERVER_PID=$!

# Attendre que le port soit affiché
for _ in $(seq 1 30); do
  if grep -q "PORT=" "$DUMMY_SERVER_LOG" 2>/dev/null; then
    break
  fi
  sleep 0.1
done

PORT=$(grep "PORT=" "$DUMMY_SERVER_LOG" | head -n1 | cut -d'=' -f2)
if [ -z "$PORT" ]; then
  echo "ERREUR: Impossible d'initialiser le serveur de simulation de timeout" >&2
  exit 1
fi

TARGET_URL="http://127.0.0.1:$PORT"
OUT_REPORT="$TMP_DIR/smoke-timeout-report.md"
SMOKE_LOG="$TMP_DIR/smoke-timeout.log"

echo "Exécution de smoke-prod.sh contre le serveur de test timeout ($TARGET_URL)..."
set +e
SMOKE_WAIT_HEALTH=false \
SMOKE_TIMEOUT=1 \
SMOKE_RETRY_DELAY=1 \
DEMO_PASSWORD="dummy-password-for-timeout-test" \
bash "$ROOT_DIR/scripts/smoke-prod.sh" "$TARGET_URL" "$OUT_REPORT" > "$SMOKE_LOG" 2>&1
EXIT_STATUS=$?
set -e

# Vérifications requises :
# 1. Le script doit échouer (code de sortie non nul)
if [ "$EXIT_STATUS" -eq 0 ]; then
  echo "ÉCHEC : smoke-prod.sh aurait dû renvoyer un code de sortie non nul sur timeout" >&2
  cat "$SMOKE_LOG"
  exit 1
fi

# 2. Aucun traceback Python ne doit apparaître dans la sortie
if grep -q "Traceback (most recent call last)" "$SMOKE_LOG"; then
  echo "ÉCHEC : Une trace Python est apparue dans la sortie du script :" >&2
  cat "$SMOKE_LOG"
  exit 1
fi

# 3. Le mot-clé [Échec] doit être présent pour les contrôles en erreur
if ! grep -q "\[Échec\]" "$SMOKE_LOG"; then
  echo "ÉCHEC : La balise [Échec] n'apparaît pas dans la sortie :" >&2
  cat "$SMOKE_LOG"
  exit 1
fi

echo "SUCCÈS: Chemin d'erreur et timeout validés avec succès :"
echo "  - Code de sortie non nul ($EXIT_STATUS)"
echo "  - Balise [Échec] affichée correctement"
echo "  - Aucune trace Python dans la sortie"
grep "\[Échec\]" "$SMOKE_LOG" | head -n 3
exit 0

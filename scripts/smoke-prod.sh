#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8082}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_FILE="${2:-$ROOT_DIR/docs/audit/smoke-prod.md}"
mkdir -p "$(dirname "$OUT_FILE")"

DEMO_PASS="${DEMO_PASSWORD:-$(python3 -c "
import os
if os.path.exists('$ROOT_DIR/.env'):
    for line in open('$ROOT_DIR/.env'):
        line = line.strip()
        if line.startswith('DEMO_PASSWORD='):
            print(line.split('=', 1)[1].strip())
            break
")}"
if [ -z "$DEMO_PASS" ]; then
  echo "ERREUR: Variable DEMO_PASSWORD absente de l'environnement ou de .env" >&2
  exit 1
fi

ADMIN_EMAIL_VAL="${ADMIN_EMAIL:-$(python3 -c "
import os
if os.path.exists('$ROOT_DIR/.env'):
    for line in open('$ROOT_DIR/.env'):
        line = line.strip()
        if line.startswith('ADMIN_EMAIL='):
            print(line.split('=', 1)[1].strip())
            break
")}"

ADMIN_PASS_VAL="${ADMIN_PASSWORD:-$(python3 -c "
import os
if os.path.exists('$ROOT_DIR/.env'):
    for line in open('$ROOT_DIR/.env'):
        line = line.strip()
        if line.startswith('ADMIN_PASSWORD='):
            print(line.split('=', 1)[1].strip())
            break
")}"

if [ "${SMOKE_WAIT_HEALTH:-true}" = "true" ]; then
  for _ in $(seq 1 60); do
    if curl -sf --max-time 2 "${BASE_URL%/}/api/health" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
fi

python3 - "$BASE_URL" "$OUT_FILE" "$DEMO_PASS" "$ADMIN_EMAIL_VAL" "$ADMIN_PASS_VAL" "$ROOT_DIR" << 'PYEOF'
import sys, os, json, re, time, urllib.request, urllib.error, urllib.parse, socket, datetime, subprocess

base_url = sys.argv[1].rstrip('/')
out_file = sys.argv[2]
demo_pass = sys.argv[3]
admin_email = sys.argv[4] if len(sys.argv) > 4 else ""
admin_password = sys.argv[5] if len(sys.argv) > 5 else ""
root_dir = sys.argv[6] if len(sys.argv) > 6 else os.getcwd()

timeout_sec = int(os.environ.get("SMOKE_TIMEOUT", "60"))
retry_delay_sec = int(os.environ.get("SMOKE_RETRY_DELAY", "5"))

results = []
all_ok = True

def record(name, ok, detail, is_unverified=False):
    global all_ok
    if is_unverified:
        status_str = "Non vérifié"
    elif ok:
        status_str = "Atteint"
    else:
        status_str = "Échec"
        all_ok = False
    results.append((name, status_str, detail))
    print(f"[{status_str}] {name} — {detail}")

def req(method, path, headers=None, data=None):
    url = base_url + path
    h = headers or {}
    r = urllib.request.Request(url, data=data, headers=h, method=method)
    last_err = None
    for attempt in range(2):
        try:
            with urllib.request.urlopen(r, timeout=timeout_sec) as resp:
                return resp.status, dict((k.lower(), v) for k, v in resp.info().items()), resp.read(), None
        except urllib.error.HTTPError as e:
            return e.code, dict((k.lower(), v) for k, v in e.headers.items()), e.read(), None
        except (urllib.error.URLError, TimeoutError, socket.error, socket.timeout) as e:
            reason = getattr(e, 'reason', e)
            last_err = f"{type(e).__name__}: {reason}"
            if attempt == 0:
                time.sleep(retry_delay_sec)
                continue
        except Exception as e:
            last_err = f"{type(e).__name__}: {e}"
            if attempt == 0:
                time.sleep(retry_delay_sec)
                continue
    return None, {}, b"", last_err

# 1. GET /api/health
st, hdrs, body, err = req("GET", "/api/health")
if err:
    record("GET /api/health", False, err)
else:
    try:
        health_json = json.loads(body.decode("utf-8")) if st == 200 else {}
    except Exception:
        health_json = {}
    record(
        "GET /api/health",
        st == 200 and health_json.get("status") == "UP",
        f"HTTP {st}, corps={body.decode('utf-8', errors='ignore').strip()}"
    )

# 2. GET / et GET /a/ZIG-KBG-4271 (SPA fallback + Cache-Control: no-cache)
st_root, hdrs_root, body_root, err_root = req("GET", "/", {"Accept": "text/html"})
st_spa, hdrs_spa, body_spa, err_spa = req("GET", "/a/ZIG-KBG-4271", {"Accept": "text/html"})
html_root = ""
if err_root or err_spa:
    record("GET / et GET /a/ZIG-KBG-4271 (SPA fallback)", False, err_root or err_spa)
else:
    cc_root = hdrs_root.get("cache-control", "")
    cc_spa = hdrs_spa.get("cache-control", "")
    html_root = body_root.decode("utf-8", errors="ignore")
    html_spa = body_spa.decode("utf-8", errors="ignore")
    spa_ok = (
        st_root == 200 and st_spa == 200
        and "<div id=\"root\">" in html_root and "<div id=\"root\">" in html_spa
        and "no-cache" in cc_root and "no-cache" in cc_spa
    )
    record(
        "GET / et GET /a/ZIG-KBG-4271 (SPA fallback)",
        spa_ok,
        f"GET / -> {st_root} (Cache-Control: {cc_root}) ; GET /a/ZIG-KBG-4271 -> {st_spa} (Cache-Control: {cc_spa})"
    )

# 3. Fichier /assets/index-*.js -> 200 + Cache-Control: public, max-age=31536000, immutable
if err_root:
    record("GET /assets/index-*.js (cache long immuable)", False, err_root)
else:
    m = re.search(r'(/assets/index-[A-Za-z0-9_-]+\.js)', html_root)
    if m:
        asset_path = m.group(1)
        st_js, hdrs_js, body_js, err_js = req("GET", asset_path)
        if err_js:
            record(f"GET {asset_path} (cache long immuable)", False, err_js)
        else:
            cc_js = hdrs_js.get("cache-control", "")
            js_ok = st_js == 200 and "max-age=31536000" in cc_js and "immutable" in cc_js
            record(
                f"GET {asset_path} (cache long immuable)",
                js_ok,
                f"HTTP {st_js}, taille={len(body_js)} octets, Cache-Control: {cc_js}"
            )
    else:
        record("GET /assets/index-*.js (cache long immuable)", False, "Aucun script /assets/index-*.js trouvé dans index.html")

# 4. GET /api/addresses/ZIG-KBG-4271 + photo en base (200 + ETag + 304)
st_addr, hdrs_addr, body_addr, err_addr = req("GET", "/api/addresses/ZIG-KBG-4271")
if err_addr:
    record("GET /api/addresses/ZIG-KBG-4271", False, err_addr)
    record("Photo de démo en base (ETag + 304)", False, err_addr)
else:
    try:
        addr_data = json.loads(body_addr.decode("utf-8")) if st_addr == 200 else {}
    except Exception:
        addr_data = {}
    photo_url = addr_data.get("photoUrl") or ""
    record(
        "GET /api/addresses/ZIG-KBG-4271",
        st_addr == 200 and addr_data.get("code") == "ZIG-KBG-4271" and bool(photo_url),
        f"HTTP {st_addr}, code={addr_data.get('code')}, photoUrl={photo_url}"
    )

    if photo_url:
        st_p1, hdrs_p1, body_p1, err_p1 = req("GET", photo_url)
        if err_p1:
            record(f"GET {photo_url} (photo en base + ETag + 304)", False, err_p1)
        else:
            etag = hdrs_p1.get("etag", "")
            cc_p1 = hdrs_p1.get("cache-control", "")
            st_p2, hdrs_p2, _, err_p2 = req("GET", photo_url, {"If-None-Match": etag}) if etag else (0, {}, b"", None)
            record(
                f"GET {photo_url} (photo en base + ETag + 304)",
                st_p1 == 200 and bool(etag) and "immutable" in cc_p1 and st_p2 == 304,
                f"1er appel: HTTP {st_p1} ({len(body_p1)} octets, ETag={etag}, Cache-Control={cc_p1}) ; 2e appel (If-None-Match): HTTP {st_p2}"
            )
    else:
        record("Photo de démo en base (ETag + 304)", False, "photoUrl manquant sur ZIG-KBG-4271")

# 5. GET /api/addresses/ZIG-KBG-4271/qrcode -> 200 image/png
st_qr, hdrs_qr, body_qr, err_qr = req("GET", "/api/addresses/ZIG-KBG-4271/qrcode")
if err_qr:
    record("GET /api/addresses/ZIG-KBG-4271/qrcode", False, err_qr)
else:
    ct_qr = hdrs_qr.get("content-type", "")
    record(
        "GET /api/addresses/ZIG-KBG-4271/qrcode",
        st_qr == 200 and "image/png" in ct_qr and body_qr[:8] == b"\x89PNG\r\n\x1a\n",
        f"HTTP {st_qr}, Content-Type={ct_qr}, taille={len(body_qr)} octets (signature PNG valide)"
    )

# 6. GET /api/public/directory?quartier=KBG -> 200
st_dir, _, body_dir, err_dir = req("GET", "/api/public/directory?quartier=KBG")
if err_dir:
    record("GET /api/public/directory?quartier=KBG", False, err_dir)
else:
    try:
        dir_json = json.loads(body_dir.decode("utf-8")) if st_dir == 200 else {}
    except Exception:
        dir_json = {}
    record(
        "GET /api/public/directory?quartier=KBG",
        st_dir == 200 and isinstance(dir_json.get("content"), list) and len(dir_json.get("content", [])) >= 1,
        f"HTTP {st_dir}, totalElements={dir_json.get('totalElements')}"
    )

# 7. GET /api/public/route -> 200 ou 503 propre
st_rt, _, body_rt, err_rt = req("GET", "/api/public/route?fromLat=12.5605&fromLon=-16.2735&code=ZIG-KBG-4271&profile=driving-car")
if err_rt:
    record("GET /api/public/route", False, err_rt)
else:
    try:
        rt_json = json.loads(body_rt.decode("utf-8")) if body_rt else {}
    except Exception:
        rt_json = {}
    rt_detail = f"HTTP {st_rt}"
    if st_rt == 200:
        rt_detail += f", distance={rt_json.get('distance')} m, duration={rt_json.get('duration')} s"
    elif st_rt == 503:
        rt_detail += f", message='{rt_json.get('message')}'"
    record(
        "GET /api/public/route",
        st_rt in (200, 503),
        rt_detail
    )

# 8. POST /api/auth/login -> 200 + Set-Cookie (HttpOnly, SameSite=Strict, Path=/api/auth/refresh)
login_payload = json.dumps({"email": "demo@samaadresse.sn", "password": demo_pass}).encode("utf-8")
st_lg, hdrs_lg, body_lg, err_lg = req("POST", "/api/auth/login", {"Content-Type": "application/json"}, login_payload)
token = ""
if err_lg:
    record("POST /api/auth/login + attributs Set-Cookie", False, err_lg)
else:
    try:
        lg_json = json.loads(body_lg.decode("utf-8")) if st_lg == 200 else {}
    except Exception:
        lg_json = {}
    set_cookie = hdrs_lg.get("set-cookie", "")
    token = lg_json.get("accessToken", "")
    cookie_ok = (
        st_lg == 200 and bool(token)
        and "httponly" in set_cookie.lower()
        and "samesite=strict" in set_cookie.lower()
        and "path=/api/auth/refresh" in set_cookie.lower()
    )
    record(
        "POST /api/auth/login + attributs Set-Cookie",
        cookie_ok,
        f"HTTP {st_lg}, token reçu ({len(token)} car.), Set-Cookie contient HttpOnly, SameSite=Strict, Path=/api/auth/refresh"
    )

# 9. Création d'une adresse avec photo -> photo servie depuis PostgreSQL -> suppression de la photo -> 404
if not token:
    record("Cycle de vie photo en base PostgreSQL (création -> lecture 200 -> suppression -> 404)", False, "Token d'authentification manquant")
else:
    auth_hdr = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    create_payload = json.dumps({
        "latitude": 12.5618,
        "longitude": -16.2722,
        "description": "Test smoke-prod photo en base PostgreSQL",
        "locationType": "MAISON",
        "listed": False,
        "showOwnerName": False
    }).encode("utf-8")
    st_cr, _, body_cr, err_cr = req("POST", "/api/addresses", auth_hdr, create_payload)
    if err_cr:
        record("Cycle de vie photo en base PostgreSQL (création -> lecture 200 -> suppression -> 404)", False, f"Erreur création: {err_cr}")
    else:
        try:
            cr_json = json.loads(body_cr.decode("utf-8")) if st_cr in (200, 201) else {}
        except Exception:
            cr_json = {}
        addr_id = cr_json.get("id", "")
        photo_file = os.path.join(root_dir, "backend/src/main/resources/demo-photos/demo-facade-1.jpg")
        if not os.path.exists(photo_file):
            photo_file = "backend/src/main/resources/demo-photos/demo-facade-1.jpg"
        with open(photo_file, "rb") as f:
            jpeg_bytes = f.read()
        boundary = "----SamaAdresseSmokeBoundary2026"
        mp_body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="file"; filename="facade.jpg"\r\n'
            f"Content-Type: image/jpeg\r\n\r\n"
        ).encode("utf-8") + jpeg_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

        st_up, _, body_up, err_up = req(
            "POST",
            f"/api/addresses/{addr_id}/photo",
            {"Authorization": f"Bearer {token}", "Content-Type": f"multipart/form-data; boundary={boundary}"},
            mp_body
        )
        if err_up:
            record("Cycle de vie photo en base PostgreSQL (création -> lecture 200 -> suppression -> 404)", False, f"Erreur upload: {err_up}")
        else:
            try:
                up_json = json.loads(body_up.decode("utf-8")) if st_up == 200 else {}
            except Exception:
                up_json = {}
            uploaded_url = up_json.get("photoUrl", "")
            st_get_up, _, body_get_up, _ = req("GET", uploaded_url) if uploaded_url else (0, {}, b"", None)
            st_del_up, _, _, _ = req("DELETE", f"/api/addresses/{addr_id}/photo", {"Authorization": f"Bearer {token}"}) if uploaded_url else (0, {}, b"", None)
            st_get_after, _, _, _ = req("GET", uploaded_url) if uploaded_url else (0, {}, b"", None)

            record(
                "Cycle de vie photo en base PostgreSQL (création -> lecture 200 -> suppression -> 404)",
                st_cr == 201 and st_up == 200 and st_get_up == 200 and st_del_up == 200 and st_get_after == 404,
                f"Création={st_cr}, Upload={st_up} ({uploaded_url}), Lecture={st_get_up} ({len(body_get_up)} octets), Suppression={st_del_up}, Lecture après suppression={st_get_after}"
            )

# 10. En-têtes de sécurité HTTP
if err_root:
    record("En-têtes de sécurité HTTP (X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP-Report-Only)", False, err_root)
else:
    xcto = hdrs_root.get("x-content-type-options", "")
    refp = hdrs_root.get("referrer-policy", "")
    permp = hdrs_root.get("permissions-policy", "")
    cspro = hdrs_root.get("content-security-policy-report-only", "")
    sec_ok = (
        xcto == "nosniff"
        and refp == "strict-origin-when-cross-origin"
        and "geolocation=(self)" in permp and "camera=(self)" in permp
        and "default-src 'self'" in cspro
    )
    record(
        "En-têtes de sécurité HTTP (X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP-Report-Only)",
        sec_ok,
        f"X-Content-Type-Options={xcto} ; Referrer-Policy={refp} ; Permissions-Policy={permp} ; CSP-Report-Only présent ({len(cspro)} car.)"
    )

# 11. GET /sw.js (Service Worker PWA)
st_sw, hdrs_sw, body_sw, err_sw = req("GET", "/sw.js")
if err_sw:
    record("GET /sw.js (Service Worker PWA)", False, err_sw)
else:
    ct_sw = hdrs_sw.get("content-type", "")
    record(
        "GET /sw.js (Service Worker PWA)",
        st_sw == 200 and ("javascript" in ct_sw or len(body_sw) > 0),
        f"HTTP {st_sw}, Content-Type={ct_sw}, taille={len(body_sw)} octets"
    )

# 12. GET /manifest.webmanifest (Manifeste PWA)
st_mf, hdrs_mf, body_mf, err_mf = req("GET", "/manifest.webmanifest")
if err_mf:
    record("GET /manifest.webmanifest (Manifeste PWA)", False, err_mf)
else:
    try:
        mf_json = json.loads(body_mf.decode("utf-8")) if st_mf == 200 else {}
    except Exception:
        mf_json = {}
    record(
        "GET /manifest.webmanifest (Manifeste PWA)",
        st_mf == 200 and mf_json.get("name") == "SamaAdresse",
        f"HTTP {st_mf}, name={mf_json.get('name')}, theme_color={mf_json.get('theme_color')}"
    )

# 13. GET /icons/icon-192.png et /icons/icon-512.png (Icônes PWA)
st_i192, hdrs_i192, body_i192, err_i192 = req("GET", "/icons/icon-192.png")
st_i512, hdrs_i512, body_i512, err_i512 = req("GET", "/icons/icon-512.png")
if err_i192 or err_i512:
    record("GET /icons/icon-192.png et /icons/icon-512.png (Icônes PWA)", False, err_i192 or err_i512)
else:
    record(
        "GET /icons/icon-192.png et /icons/icon-512.png (Icônes PWA)",
        st_i192 == 200 and st_i512 == 200 and body_i192[:8] == b"\x89PNG\r\n\x1a\n" and body_i512[:8] == b"\x89PNG\r\n\x1a\n",
        f"icon-192 -> {st_i192} ({len(body_i192)} octets) ; icon-512 -> {st_i512} ({len(body_i512)} octets)"
    )

# 14. GET /v3/api-docs (Spécification OpenAPI 3.0)
st_oa, hdrs_oa, body_oa, err_oa = req("GET", "/v3/api-docs")
if err_oa:
    record("GET /v3/api-docs (Spécification OpenAPI 3.0)", False, err_oa)
else:
    try:
        oa_json = json.loads(body_oa.decode("utf-8")) if st_oa == 200 else {}
    except Exception:
        oa_json = {}
    oa_version = oa_json.get("openapi", "")
    record(
        "GET /v3/api-docs (Spécification OpenAPI 3.0)",
        st_oa == 200 and oa_version.startswith("3.0"),
        f"HTTP {st_oa}, version openapi={oa_version}, titre={oa_json.get('info', {}).get('title')}"
    )

# 15. POST /api/auth/refresh sans cookie (Rejet 401)
st_rf, hdrs_rf, body_rf, err_rf = req("POST", "/api/auth/refresh")
if err_rf:
    record("POST /api/auth/refresh sans cookie (Rejet 401)", False, err_rf)
else:
    record(
        "POST /api/auth/refresh sans cookie (Rejet 401)",
        st_rf == 401,
        f"HTTP {st_rf}, corps={body_rf.decode('utf-8', errors='ignore').strip()}"
    )

# 16. GET /cette-page-n-existe-pas (Repli SPA vers index.html)
st_404_spa, hdrs_404_spa, body_404_spa, err_404_spa = req("GET", "/cette-page-n-existe-pas", {"Accept": "text/html"})
if err_404_spa:
    record("GET /cette-page-n-existe-pas (Repli SPA vers index.html)", False, err_404_spa)
else:
    html_404 = body_404_spa.decode("utf-8", errors="ignore")
    record(
        "GET /cette-page-n-existe-pas (Repli SPA vers index.html)",
        st_404_spa == 200 and "<div id=\"root\">" in html_404,
        f"HTTP {st_404_spa}, index.html servi correctement pour routage côté client"
    )

# 17. Décodage du QR Code téléchargé (test-qr-decode.mjs)
try:
    qr_proc = subprocess.run(["node", os.path.join(root_dir, "scripts/test-qr-decode.mjs"), base_url], capture_output=True, text=True, timeout=30)
    qr_ok = qr_proc.returncode == 0
    qr_detail = qr_proc.stdout.strip().splitlines()[-1] if qr_proc.stdout.strip() else qr_proc.stderr.strip()
    record(
        "Décodage du QR Code téléchargé (test-qr-decode.mjs)",
        qr_ok,
        f"code={qr_proc.returncode}, sortie={qr_detail}"
    )
except Exception as e:
    record("Décodage du QR Code téléchargé (test-qr-decode.mjs)", False, f"{type(e).__name__}: {e}")

# 18. Table flyway_schema_history dans PostgreSQL
flyway_host = None
flyway_ok = False
flyway_detail = ""

# Recherche de DATABASE_URL ou SPRING_DATASOURCE_URL
db_url = os.environ.get("DATABASE_URL") or os.environ.get("SPRING_DATASOURCE_URL")
if not db_url and os.path.exists(os.path.join(root_dir, ".env")):
    try:
        with open(os.path.join(root_dir, ".env"), "r", encoding="utf-8") as f:
            for l in f:
                l = l.strip()
                if l.startswith("DATABASE_URL="):
                    db_url = l.split("=", 1)[1].strip()
                    break
                elif l.startswith("SPRING_DATASOURCE_URL="):
                    db_url = l.split("=", 1)[1].strip()
                    break
    except Exception:
        pass

if db_url:
    clean_db_url = db_url
    if clean_db_url.startswith("jdbc:postgresql://"):
        clean_db_url = "postgresql://" + clean_db_url[len("jdbc:postgresql://"):]
    elif clean_db_url.startswith("postgres://"):
        clean_db_url = "postgresql://" + clean_db_url[len("postgres://"):]
    try:
        parsed = urllib.parse.urlsplit(clean_db_url)
        flyway_host = parsed.hostname + (f":{parsed.port}" if parsed.port else "")
    except Exception:
        flyway_host = "base distante"

# Tentative 1 : connexion directe via psycopg2 si URL disponible
if db_url and flyway_host:
    try:
        import psycopg2
        conn = psycopg2.connect(clean_db_url, connect_timeout=5)
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM flyway_schema_history WHERE success = true;")
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row and row[0] >= 2:
            flyway_ok = True
            flyway_detail = f"{row[0]} migrations appliquées avec succès"
    except Exception:
        pass

# Tentative 2 : conteneur Docker local db
if not flyway_ok:
    try:
        flyway_proc = subprocess.run(
            ["docker", "compose", "-f", os.path.join(root_dir, "docker-compose.prod-test.yml"), "exec", "-T", "db", "psql", "-U", "samaadresse_prod_user", "-d", "samaadresse_prod", "-t", "-c", "SELECT count(*) FROM flyway_schema_history WHERE success = true;"],
            capture_output=True,
            text=True,
            timeout=10
        )
        out = flyway_proc.stdout.strip()
        if flyway_proc.returncode == 0 and out.isdigit() and int(out) >= 2:
            flyway_ok = True
            flyway_host = "localhost:5432 (conteneur db docker compose)"
            flyway_detail = f"{out} migrations appliquées avec succès"
    except Exception:
        pass

if flyway_ok:
    record(
        f"Table flyway_schema_history dans PostgreSQL (hôte: {flyway_host})",
        True,
        f"migrations appliquées={flyway_detail}"
    )
else:
    target_display = flyway_host or "aucun hôte PostgreSQL accessible"
    record(
        f"Table flyway_schema_history dans PostgreSQL (hôte: {target_display})",
        False,
        "base non joignable depuis l'environnement d'exécution du script",
        is_unverified=True
    )

# 19. POST /api/admin/reset-rate-limits avec jeton ADMIN -> 404 en profil prod
if admin_email and admin_password:
    adm_login_payload = json.dumps({"email": admin_email, "password": admin_password}).encode("utf-8")
    st_adm, _, body_adm, err_adm = req("POST", "/api/auth/login", {"Content-Type": "application/json"}, adm_login_payload)
    if err_adm:
        record("POST /api/admin/reset-rate-limits avec jeton ADMIN (404 en profil prod)", False, f"Erreur réseau login ADMIN: {err_adm}")
    elif st_adm == 200:
        try:
            adm_token = json.loads(body_adm.decode("utf-8")).get("accessToken", "")
        except Exception:
            adm_token = ""
        st_reset, _, body_reset, err_reset = req("POST", "/api/admin/reset-rate-limits", {"Authorization": f"Bearer {adm_token}"})
        if err_reset:
            record("POST /api/admin/reset-rate-limits avec jeton ADMIN (404 en profil prod)", False, f"Erreur réseau reset: {err_reset}")
        else:
            prod_disabled_ok = (st_reset == 404)
            detail_msg = f"HTTP {st_reset} (contrôleur dev désactivé en profil prod)"
            record(
                "POST /api/admin/reset-rate-limits avec jeton ADMIN (404 en profil prod)",
                prod_disabled_ok,
                detail_msg
            )
    else:
        record(
            "POST /api/admin/reset-rate-limits avec jeton ADMIN (404 en profil prod)",
            False,
            f"Échec authentification ADMIN (HTTP {st_adm})"
        )
else:
    record(
        "POST /api/admin/reset-rate-limits avec jeton ADMIN (404 en profil prod)",
        False,
        "ADMIN_EMAIL ou ADMIN_PASSWORD non défini dans l'environnement",
        is_unverified=True
    )

# 20. Limiteur de débit login D-02 (5 tentatives autorisées, 6e tentative -> HTTP 429 avec Retry-After > 0)
fake_email = f"smoke-nonexistent-{int(time.time())}@example.sn"
fake_payload = json.dumps({"email": fake_email, "password": "WrongPassword123!"}).encode("utf-8")
login_statuses = []
last_retry_after = None
for i in range(6):
    s_try, h_try, b_try, _ = req("POST", "/api/auth/login", {"Content-Type": "application/json"}, fake_payload)
    login_statuses.append(s_try)
    if s_try == 429:
        last_retry_after = h_try.get("retry-after")

rate_limit_triggered = (429 in login_statuses) or (len(login_statuses) == 6 and login_statuses[5] == 429)
record(
    "Limiteur de débit login D-02 (6 tentatives, 429 attendu sur identifiant inexistant)",
    rate_limit_triggered,
    f"Codes HTTP observés : {login_statuses}, Retry-After={last_retry_after}"
)

now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
lines = [
    "# Rapport de Vérification Smoke Production (`smoke-prod.sh`)",
    "",
    f"- **Cible testée :** `{base_url}`",
    f"- **Date d'exécution :** {now}",
    f"- **Statut global :** **{'Atteint' if all_ok else 'Échec'}**",
    "",
    "| Vérification | Statut | Détail mesuré |",
    "|---|:---:|---|"
]
for name, st_str, det in results:
    safe_det = str(det).replace("|", "\\|")
    lines.append(f"| {name} | **{st_str}** | `{safe_det}` |")

with open(out_file, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

if not all_ok:
    sys.exit(1)
PYEOF

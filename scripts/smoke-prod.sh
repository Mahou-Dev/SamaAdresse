#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8082}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_FILE="$ROOT_DIR/docs/audit/smoke-prod.md"
mkdir -p "$ROOT_DIR/docs/audit"

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

for _ in $(seq 1 60); do
  if curl -sf "${BASE_URL%/}/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

python3 - "$BASE_URL" "$OUT_FILE" "$DEMO_PASS" << 'PYEOF'
import sys, json, re, urllib.request, urllib.error, datetime

base_url = sys.argv[1].rstrip('/')
out_file = sys.argv[2]
demo_pass = sys.argv[3]

results = []
all_ok = True

def record(name, ok, detail):
    global all_ok
    if not ok:
        all_ok = False
    status_str = "Atteint" if ok else "NON ATTEINT"
    results.append((name, status_str, detail))
    print(f"[{status_str}] {name} — {detail}")

def req(method, path, headers=None, data=None):
    url = base_url + path
    h = headers or {}
    r = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=15) as resp:
            return resp.status, dict((k.lower(), v) for k, v in resp.info().items()), resp.read()
    except urllib.error.HTTPError as e:
        return e.code, dict((k.lower(), v) for k, v in e.headers.items()), e.read()

# 1. GET /api/health
st, hdrs, body = req("GET", "/api/health")
health_json = json.loads(body.decode("utf-8")) if st == 200 else {}
record(
    "GET /api/health",
    st == 200 and health_json.get("status") == "UP",
    f"HTTP {st}, corps={body.decode('utf-8').strip()}"
)

# 2. GET / et GET /a/ZIG-KBG-4271 (SPA fallback + Cache-Control: no-cache)
st_root, hdrs_root, body_root = req("GET", "/", {"Accept": "text/html"})
st_spa, hdrs_spa, body_spa = req("GET", "/a/ZIG-KBG-4271", {"Accept": "text/html"})
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
m = re.search(r'(/assets/index-[A-Za-z0-9_-]+\.js)', html_root)
if m:
    asset_path = m.group(1)
    st_js, hdrs_js, body_js = req("GET", asset_path)
    cc_js = hdrs_js.get("cache-control", "")
    js_ok = st_js == 200 and "max-age=31536000" in cc_js and "immutable" in cc_js
    record(
        f"GET {asset_path} (cache long immuable)",
        js_ok,
        f"HTTP {st_js}, taille={len(body_js)} octets, Cache-Control: {cc_js}"
    )
else:
    record("GET /assets/index-*.js", False, "Aucun script /assets/index-*.js trouvé dans index.html")

# 4. GET /api/addresses/ZIG-KBG-4271 + photo en base (200 + ETag + 304)
st_addr, hdrs_addr, body_addr = req("GET", "/api/addresses/ZIG-KBG-4271")
addr_data = json.loads(body_addr.decode("utf-8")) if st_addr == 200 else {}
photo_url = addr_data.get("photoUrl") or ""
record(
    "GET /api/addresses/ZIG-KBG-4271",
    st_addr == 200 and addr_data.get("code") == "ZIG-KBG-4271" and bool(photo_url),
    f"HTTP {st_addr}, code={addr_data.get('code')}, photoUrl={photo_url}"
)

if photo_url:
    st_p1, hdrs_p1, body_p1 = req("GET", photo_url)
    etag = hdrs_p1.get("etag", "")
    cc_p1 = hdrs_p1.get("cache-control", "")
    st_p2, hdrs_p2, _ = req("GET", photo_url, {"If-None-Match": etag}) if etag else (0, {}, b"")
    record(
        f"GET {photo_url} (photo en base + ETag + 304)",
        st_p1 == 200 and bool(etag) and "immutable" in cc_p1 and st_p2 == 304,
        f"1er appel: HTTP {st_p1} ({len(body_p1)} octets, ETag={etag}, Cache-Control={cc_p1}) ; 2e appel (If-None-Match): HTTP {st_p2}"
    )
else:
    record("Photo de démo en base (ETag + 304)", False, "photoUrl manquant sur ZIG-KBG-4271")

# 5. GET /api/addresses/ZIG-KBG-4271/qrcode -> 200 image/png
st_qr, hdrs_qr, body_qr = req("GET", "/api/addresses/ZIG-KBG-4271/qrcode")
ct_qr = hdrs_qr.get("content-type", "")
record(
    "GET /api/addresses/ZIG-KBG-4271/qrcode",
    st_qr == 200 and "image/png" in ct_qr and body_qr[:8] == b"\x89PNG\r\n\x1a\n",
    f"HTTP {st_qr}, Content-Type={ct_qr}, taille={len(body_qr)} octets (signature PNG valide)"
)

# 6. GET /api/public/directory?quartier=KBG -> 200
st_dir, _, body_dir = req("GET", "/api/public/directory?quartier=KBG")
dir_json = json.loads(body_dir.decode("utf-8")) if st_dir == 200 else {}
record(
    "GET /api/public/directory?quartier=KBG",
    st_dir == 200 and isinstance(dir_json.get("content"), list) and len(dir_json.get("content", [])) >= 1,
    f"HTTP {st_dir}, totalElements={dir_json.get('totalElements')}"
)

# 7. GET /api/public/route -> 200 ou 503 propre
st_rt, _, body_rt = req("GET", "/api/public/route?fromLat=12.5605&fromLon=-16.2735&code=ZIG-KBG-4271&profile=driving-car")
rt_json = json.loads(body_rt.decode("utf-8")) if body_rt else {}
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
st_lg, hdrs_lg, body_lg = req("POST", "/api/auth/login", {"Content-Type": "application/json"}, login_payload)
lg_json = json.loads(body_lg.decode("utf-8")) if st_lg == 200 else {}
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
auth_hdr = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
create_payload = json.dumps({
    "latitude": 12.5618,
    "longitude": -16.2722,
    "description": "Test smoke-prod photo en base PostgreSQL",
    "locationType": "MAISON",
    "listed": False,
    "showOwnerName": False
}).encode("utf-8")
st_cr, _, body_cr = req("POST", "/api/addresses", auth_hdr, create_payload)
cr_json = json.loads(body_cr.decode("utf-8")) if st_cr in (200, 201) else {}
addr_id = cr_json.get("id", "")

# Upload photo multipart (image JPEG valide depuis demo-facade-1.jpg)
with open("backend/src/main/resources/demo-photos/demo-facade-1.jpg", "rb") as f:
    jpeg_bytes = f.read()
boundary = "----SamaAdresseSmokeBoundary2026"
mp_body = (
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="file"; filename="facade.jpg"\r\n'
    f"Content-Type: image/jpeg\r\n\r\n"
).encode("utf-8") + jpeg_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

st_up, _, body_up = req(
    "POST",
    f"/api/addresses/{addr_id}/photo",
    {"Authorization": f"Bearer {token}", "Content-Type": f"multipart/form-data; boundary={boundary}"},
    mp_body
)
up_json = json.loads(body_up.decode("utf-8")) if st_up == 200 else {}
uploaded_url = up_json.get("photoUrl", "")
st_get_up, _, body_get_up = req("GET", uploaded_url) if uploaded_url else (0, {}, b"")
st_del_up, _, _ = req("DELETE", f"/api/addresses/{addr_id}/photo", {"Authorization": f"Bearer {token}"}) if uploaded_url else (0, {}, b"")
st_get_after, _, _ = req("GET", uploaded_url) if uploaded_url else (0, {}, b"")

record(
    "Cycle de vie photo en base PostgreSQL (création -> lecture 200 -> suppression -> 404)",
    st_cr == 201 and st_up == 200 and st_get_up == 200 and st_del_up == 200 and st_get_after == 404,
    f"Création={st_cr}, Upload={st_up} ({uploaded_url}), Lecture={st_get_up} ({len(body_get_up)} octets), Suppression={st_del_up}, Lecture après suppression={st_get_after}"
)

# 10. En-têtes de sécurité HTTP
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

now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
lines = [
    "# Rapport de Vérification Smoke Production (`smoke-prod.sh`)",
    "",
    f"- **Cible testée :** `{base_url}`",
    f"- **Date d'exécution :** {now}",
    f"- **Statut global :** **{'Atteint' if all_ok else 'NON ATTEINT'}**",
    "",
    "| Vérification | Statut | Détail mesuré |",
    "|---|:---:|---|"
]
for name, st_str, det in results:
    safe_det = det.replace("|", "\\|")
    lines.append(f"| {name} | **{st_str}** | `{safe_det}` |")

with open(out_file, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

if not all_ok:
    sys.exit(1)
PYEOF

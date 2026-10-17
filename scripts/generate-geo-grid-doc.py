#!/usr/bin/env python3
"""
Génère docs/geo-grid-a-verifier.md à partir de backend/src/main/resources/geo-grid.json.
"""
import json
import math
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
GEO_GRID_PATH = ROOT_DIR / "backend" / "src" / "main" / "resources" / "geo-grid.json"
OUTPUT_PATH = ROOT_DIR / "docs" / "geo-grid-a-verifier.md"


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    return 2 * r * math.asin(math.sqrt(a))


def main() -> None:
    with open(GEO_GRID_PATH, encoding="utf-8") as f:
        data = json.load(f)

    zones_by_code = {z["code"]: z for z in data["zones"]}
    lines = [
        "# Grille géographique des quartiers — Document de vérification",
        "",
        "> **Note importante :** Ces zones (boîtes englobantes rectangulaires `latMin`/`latMax`/`lonMin`/`lonMax`) "
        "sont des **estimations géométriques à confirmer sur le terrain** par l'auteur du projet. "
        "Elles ne constituent pas un découpage cadastral ni administratif.",
        "",
        "## 1. Zones urbaines couvertes",
        "",
        "| Code | Ville | Latitude min → max | Longitude min → max | Centre (lat, lon) | Dimensions approx. (N-S × E-O) | Lien OpenStreetMap |",
        "|---|---|---|---|:---:|:---:|---|",
    ]

    for z in data["zones"]:
        clat = (z["latMin"] + z["latMax"]) / 2.0
        clon = (z["lonMin"] + z["lonMax"]) / 2.0
        ns_km = haversine_km(z["latMin"], clon, z["latMax"], clon)
        ew_km = haversine_km(clat, z["lonMin"], clat, z["lonMax"])
        osm_url = f"https://www.openstreetmap.org/?mlat={clat:.5f}&mlon={clon:.5f}#map=13/{clat:.5f}/{clon:.5f}"
        lines.append(
            f"| `{z['code']}` | {z['name']} | `{z['latMin']:.4f}` → `{z['latMax']:.4f}` | "
            f"`{z['lonMin']:.4f}` → `{z['lonMax']:.4f}` | `{clat:.4f}, {clon:.4f}` | "
            f"{ns_km:.2f} km × {ew_km:.2f} km | [Voir sur OSM]({osm_url}) |"
        )

    lines.extend([
        "",
        "## 2. Quartiers à vérifier",
        "",
        "| Ville (`zoneCode`) | Code quartier | Nom du quartier | Centre (lat, lon) | Taille de la zone (N-S × E-O) | Inclusion dans la ville | Lien OpenStreetMap | Confirmé par l'auteur |",
        "|---|---|---|---|---|:---:|---|---|",
    ])

    for q in data["quartiers"]:
        z = zones_by_code[q["zoneCode"]]
        clat = (q["latMin"] + q["latMax"]) / 2.0
        clon = (q["lonMin"] + q["lonMax"]) / 2.0
        ns_km = haversine_km(q["latMin"], clon, q["latMax"], clon)
        ew_km = haversine_km(clat, q["lonMin"], clat, q["lonMax"])
        included = (
            q["latMin"] >= z["latMin"]
            and q["latMax"] <= z["latMax"]
            and q["lonMin"] >= z["lonMin"]
            and q["lonMax"] <= z["lonMax"]
        )
        inc_str = "Oui" if included else "NON"
        osm_url = (
            f"https://www.openstreetmap.org/?minlon={q['lonMin']:.4f}&minlat={q['latMin']:.4f}"
            f"&maxlon={q['lonMax']:.4f}&maxlat={q['latMax']:.4f}&box=yes#map=15/{clat:.5f}/{clon:.5f}"
        )
        lines.append(
            f"| {z['name']} (`{q['zoneCode']}`) | `{q['code']}` | {q['name']} | "
            f"`{clat:.4f}, {clon:.4f}` | {ns_km:.2f} km × {ew_km:.2f} km "
            f"(`{q['latMin']:.4f}..{q['latMax']:.4f}`, `{q['lonMin']:.4f}..{q['lonMax']:.4f}`) | "
            f"{inc_str} | [Vérifier la boîte OSM]({osm_url}) |  |"
        )

    lines.append("")
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"Généré : {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

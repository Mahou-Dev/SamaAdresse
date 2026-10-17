#!/usr/bin/env python3
"""
Génère docs/api/SamaAdresse.postman_collection.json à partir de docs/api/openapi.json.
Inclut les variables baseUrl et token ainsi que le dossier "Parcours démo" exécutable via Newman.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OPENAPI_JSON = ROOT / "docs" / "api" / "openapi.json"
POSTMAN_OUT = ROOT / "docs" / "api" / "SamaAdresse.postman_collection.json"


def build_demo_folder():
    return {
        "name": "Parcours démo",
        "description": "Parcours complet automatisé : connexion (sauvegarde du jeton), création d'adresse, résolution publique, recherche annuaire, signalement public et calcul d'itinéraire.",
        "item": [
            {
                "name": "1. Connexion (sauvegarde du jeton)",
                "event": [
                    {
                        "listen": "test",
                        "script": {
                            "type": "text/javascript",
                            "exec": [
                                "pm.test('Connexion réussie (200)', function () {",
                                "    pm.response.to.have.status(200);",
                                "    var jsonData = pm.response.json();",
                                "    pm.expect(jsonData.accessToken).to.be.a('string');",
                                "    pm.collectionVariables.set('token', jsonData.accessToken);",
                                "});"
                            ]
                        }
                    }
                ],
                "request": {
                    "method": "POST",
                    "header": [{"key": "Content-Type", "value": "application/json"}],
                    "body": {
                        "mode": "raw",
                        "raw": json.dumps({
                            "email": "{{demoEmail}}",
                            "password": "{{demoPassword}}"
                        }, indent=2)
                    },
                    "url": {
                        "raw": "{{baseUrl}}/api/auth/login",
                        "host": ["{{baseUrl}}"],
                        "path": ["api", "auth", "login"]
                    }
                }
            },
            {
                "name": "2. Création d'adresse",
                "event": [
                    {
                        "listen": "test",
                        "script": {
                            "type": "text/javascript",
                            "exec": [
                                "pm.test('Adresse créée (201)', function () {",
                                "    pm.response.to.have.status(201);",
                                "    var jsonData = pm.response.json();",
                                "    pm.expect(jsonData.code).to.match(/^ZIG-[A-Z]{3}-\\d{4}$/);",
                                "    pm.collectionVariables.set('demoCode', jsonData.code);",
                                "    pm.collectionVariables.set('demoAddressId', jsonData.id);",
                                "});"
                            ]
                        }
                    }
                ],
                "request": {
                    "auth": {
                        "type": "bearer",
                        "bearer": [{"key": "token", "value": "{{token}}", "type": "string"}]
                    },
                    "method": "POST",
                    "header": [{"key": "Content-Type", "value": "application/json"}],
                    "body": {
                        "mode": "raw",
                        "raw": json.dumps({
                            "latitude": 12.5612,
                            "longitude": -16.2725,
                            "description": "Maison démo Newman, portail bleu à Kandé",
                            "locationType": "MAISON",
                            "listed": True,
                            "showOwnerName": False
                        }, indent=2)
                    },
                    "url": {
                        "raw": "{{baseUrl}}/api/addresses",
                        "host": ["{{baseUrl}}"],
                        "path": ["api", "addresses"]
                    }
                }
            },
            {
                "name": "3. Résolution publique du code",
                "event": [
                    {
                        "listen": "test",
                        "script": {
                            "type": "text/javascript",
                            "exec": [
                                "pm.test('Fiche publique résolue (200)', function () {",
                                "    pm.response.to.have.status(200);",
                                "    var jsonData = pm.response.json();",
                                "    pm.expect(jsonData.code).to.eql(pm.collectionVariables.get('demoCode'));",
                                "});"
                            ]
                        }
                    }
                ],
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "{{baseUrl}}/api/addresses/{{demoCode}}",
                        "host": ["{{baseUrl}}"],
                        "path": ["api", "addresses", "{{demoCode}}"]
                    }
                }
            },
            {
                "name": "4. Recherche dans l'annuaire",
                "event": [
                    {
                        "listen": "test",
                        "script": {
                            "type": "text/javascript",
                            "exec": [
                                "pm.test('Recherche annuaire valide (200)', function () {",
                                "    pm.response.to.have.status(200);",
                                "    var jsonData = pm.response.json();",
                                "    pm.expect(jsonData.content).to.be.an('array');",
                                "});"
                            ]
                        }
                    }
                ],
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "{{baseUrl}}/api/public/directory?q=Newman&quartier=KBG",
                        "host": ["{{baseUrl}}"],
                        "path": ["api", "public", "directory"],
                        "query": [
                            {"key": "q", "value": "Newman"},
                            {"key": "quartier", "value": "KBG"}
                        ]
                    }
                }
            },
            {
                "name": "5. Signalement public",
                "event": [
                    {
                        "listen": "test",
                        "script": {
                            "type": "text/javascript",
                            "exec": [
                                "pm.test('Signalement enregistré (202)', function () {",
                                "    pm.response.to.have.status(202);",
                                "});"
                            ]
                        }
                    }
                ],
                "request": {
                    "method": "POST",
                    "header": [{"key": "Content-Type", "value": "application/json"}],
                    "body": {
                        "mode": "raw",
                        "raw": json.dumps({
                            "reason": "POSITION_INCORRECTE",
                            "comment": "Vérification automatisée du parcours démo"
                        }, indent=2)
                    },
                    "url": {
                        "raw": "{{baseUrl}}/api/public/addresses/{{demoCode}}/reports",
                        "host": ["{{baseUrl}}"],
                        "path": ["api", "public", "addresses", "{{demoCode}}", "reports"]
                    }
                }
            },
            {
                "name": "6. Calcul d'itinéraire",
                "event": [
                    {
                        "listen": "test",
                        "script": {
                            "type": "text/javascript",
                            "exec": [
                                "pm.test('Itinéraire calculé (200) ou clé ORS absente (503)', function () {",
                                "    pm.expect(pm.response.code).to.be.oneOf([200, 503]);",
                                "});"
                            ]
                        }
                    }
                ],
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "{{baseUrl}}/api/public/route?fromLat=12.5835&fromLon=-16.2712&code={{demoCode}}&profile=driving-car",
                        "host": ["{{baseUrl}}"],
                        "path": ["api", "public", "route"],
                        "query": [
                            {"key": "fromLat", "value": "12.5835"},
                            {"key": "fromLon", "value": "-16.2712"},
                            {"key": "code", "value": "{{demoCode}}"},
                            {"key": "profile", "value": "driving-car"}
                        ]
                    }
                }
            }
        ]
    }


def main():
    spec = json.loads(OPENAPI_JSON.read_text(encoding="utf-8"))
    tags_map = {}
    for path_str, methods in sorted(spec.get("paths", {}).items()):
        for method, op in methods.items():
            tag = (op.get("tags") or ["Général"])[0]
            tags_map.setdefault(tag, [])
            summary = op.get("summary") or f"{method.upper()} {path_str}"
            requires_auth = bool(op.get("security"))
            clean_segments = [s for s in path_str.strip("/").split("/") if s]
            query_params = []
            for param in op.get("parameters", []):
                if param.get("in") == "query":
                    example = param.get("example", "")
                    query_params.append({
                        "key": param["name"],
                        "value": str(example) if example != "" else "",
                        "description": param.get("description", "")
                    })
            req = {
                "method": method.upper(),
                "header": [{"key": "Accept", "value": "application/json"}],
                "url": {
                    "raw": "{{baseUrl}}" + path_str,
                    "host": ["{{baseUrl}}"],
                    "path": clean_segments,
                    "query": query_params
                },
                "description": op.get("description", "")
            }
            if requires_auth:
                req["auth"] = {
                    "type": "bearer",
                    "bearer": [{"key": "token", "value": "{{token}}", "type": "string"}]
                }
            if "requestBody" in op:
                req["header"].append({"key": "Content-Type", "value": "application/json"})
                req["body"] = {"mode": "raw", "raw": "{}"}
            tags_map[tag].append({"name": f"{method.upper()} {path_str} — {summary}", "request": req})

    items = [build_demo_folder()]
    for tag, endpoints in sorted(tags_map.items()):
        items.append({
            "name": tag,
            "item": endpoints
        })

    collection = {
        "info": {
            "name": spec["info"]["title"],
            "_postman_id": "00000000-0000-4000-8000-5a616d614164",
            "description": spec["info"]["description"],
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "variable": [
            {"key": "baseUrl", "value": "http://localhost:8080", "type": "string"},
            {"key": "token", "value": "", "type": "string"},
            {"key": "demoEmail", "value": "demo@samaadresse.sn", "type": "string"},
            {"key": "demoPassword", "value": "", "type": "string"},
            {"key": "demoCode", "value": "ZIG-KBG-4271", "type": "string"},
            {"key": "demoAddressId", "value": "", "type": "string"}
        ],
        "item": items
    }

    POSTMAN_OUT.write_text(json.dumps(collection, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Collection Postman générée : {POSTMAN_OUT}")


if __name__ == "__main__":
    main()

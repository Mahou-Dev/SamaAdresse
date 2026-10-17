# Audit `errors-in-console` (Lighthouse)

## Avant correctifs (extraction depuis `docs/audit/lighthouse/*.report.json`)

### addresses_mine (`http://127.0.0.1:4173/addresses/mine`) — score : 0

| URL | Description |
| --- | --- |
| `http://127.0.0.1:4173/api/address-codes/reservations?zone=ZIG` | `Failed to load resource: the server responded with a status of 429 (Too Many Requests)` |
| `http://127.0.0.1:4173/api/address-codes/reservations?zone=ZIG` | `Failed to load resource: the server responded with a status of 429 (Too Many Requests)` |

### addresses_new (`http://127.0.0.1:4173/addresses/new`) — score : 0

| URL | Description |
| --- | --- |
| `http://127.0.0.1:4173/api/address-codes/reservations?zone=ZIG` | `Failed to load resource: the server responded with a status of 429 (Too Many Requests)` |
| `http://127.0.0.1:4173/api/address-codes/reservations?zone=ZIG` | `Failed to load resource: the server responded with a status of 429 (Too Many Requests)` |

### directory (`http://127.0.0.1:4173/annuaire`) — score : 0

| URL | Description |
| --- | --- |
| `http://127.0.0.1:4173/api/address-codes/reservations?zone=ZIG` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |
| `http://127.0.0.1:4173/api/address-codes/reservations` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |

### landing (`http://127.0.0.1:4173/`) — score : 0

| URL | Description |
| --- | --- |
| `http://127.0.0.1:4173/api/address-codes/reservations?zone=ZIG` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |
| `http://127.0.0.1:4173/api/address-codes/reservations` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |

### login (`http://127.0.0.1:4173/login`) — score : 0

| URL | Description |
| --- | --- |
| `http://127.0.0.1:4173/api/address-codes/reservations?zone=ZIG` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |
| `http://127.0.0.1:4173/api/address-codes/reservations` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |

### public_address (`http://127.0.0.1:4173/a/ZIG-KBG-4271`) — score : 0

| URL | Description |
| --- | --- |
| `http://127.0.0.1:4173/api/address-codes/reservations?zone=ZIG` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |
| `http://127.0.0.1:4173/api/address-codes/reservations` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |

### register (`http://127.0.0.1:4173/register`) — score : 0

| URL | Description |
| --- | --- |
| `http://127.0.0.1:4173/api/address-codes/reservations?zone=ZIG` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |
| `http://127.0.0.1:4173/api/address-codes/reservations` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |

## Après correctifs (extraction depuis les 8 rapports JSON Lighthouse)

### landing (`http://localhost:8082/`) — score : 1

- Aucune erreur console.

### login (`http://localhost:8082/login`) — score : 1

- Aucune erreur console.

### register (`http://localhost:8082/register`) — score : 1

- Aucune erreur console.

### public_address (`http://localhost:8082/a/ZIG-KBG-4271`) — score : 1

- Aucune erreur console.

### directory (`http://localhost:8082/annuaire`) — score : 1

- Aucune erreur console.

### addresses_mine (`http://localhost:8082/addresses/mine`) — score : 1

- Aucune erreur console.

### addresses_new (`http://localhost:8082/addresses/new`) — score : 1

- Aucune erreur console.

### addresses_mine_offline (`http://localhost:8082/addresses/mine`) — score : 1

- Aucune erreur console.


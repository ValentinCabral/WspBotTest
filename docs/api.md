# API REST (MVP inicial)

## Auth
- `POST /api/auth/google`
  - body: `{ "email": "admin@trendmax.com" }`
  - response: `{ token, user }`

## Dashboard
- `GET /api/dashboard` (JWT)
  - métricas clave del tablero.

## Productos
- `GET /api/products` (JWT)
- `POST /api/products` (JWT + roles `admin|warehouse`)

## Clientes
- `GET /api/customers` (JWT)
- `POST /api/customers` (JWT + roles `admin|sales`)

## Pedidos
- `GET /api/orders` (JWT)
- `POST /api/orders` (JWT + roles `admin|sales`)
  - valida stock y cantidad mínima.
  - reserva stock y genera movimientos.

## Salud
- `GET /health`

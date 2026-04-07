# WholesaleHub B2B - MVP inicial SaaS-ready

Implementación inicial de una plataforma web de gestión mayorista orientada a negocios que venden a revendedores.

## Incluye en este MVP

- Login principal tipo Google OAuth (simulado en endpoint backend para entorno local).
- Token de sesión firmado (JWT-like).
- RBAC por roles (`admin`, `sales`, `warehouse`, `readonly`).
- Multi-tenant ready: entidades con `company_id`.
- Módulos web responsive:
  - Dashboard
  - Productos
  - Pedidos
  - Clientes
- Gestión de stock reservado/disponible al crear pedidos.
- Auditoría de acciones.
- Esquema de datos SaaS-ready en `prisma/schema.prisma` para PostgreSQL.

## Estructura del proyecto

- `index.js`: bootstrap servidor.
- `src/app.js`: router HTTP, API REST y frontend estático.
- `src/db.js`: modelo de datos en memoria + seed de ejemplo para MVP.
- `src/auth.js`: firma y validación de token + auth.
- `public/*`: frontend web responsive.
- `docs/architecture.md`: arquitectura y roadmap.
- `docs/api.md`: contrato REST inicial.
- `prisma/schema.prisma`: modelo para PostgreSQL multi-tenant.

## Ejecución local

```bash
npm start
```

Abrir: `http://localhost:3000`

### Login demo

- `admin@trendmax.com`
- `ventas@trendmax.com`

## API REST principal

- `POST /api/auth/google`
- `GET /api/dashboard`
- `GET/POST /api/products`
- `GET/POST /api/customers`
- `GET/POST /api/orders`

## Deploy sugerido (cloud)

1. Contenerizar app (Docker).
2. Variables de entorno mínimas:
   - `PORT`
   - `JWT_SECRET`
   - `DATABASE_URL` (al migrar a PostgreSQL + Prisma)
3. Deploy en AWS ECS/Fargate / Azure App Service / Render / Fly.io.
4. Configurar backups diarios en proveedor de PostgreSQL.
5. Activar monitoreo y alertas de errores.

## Siguiente paso recomendado

Migrar esta base a **Next.js + NestJS + PostgreSQL + Prisma** manteniendo el contrato REST y el modelo de dominio definidos en esta entrega.

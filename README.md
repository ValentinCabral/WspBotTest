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
- Deploy automático a **GitHub Pages** para demo frontend estático.

## Estructura del proyecto

- `index.js`: bootstrap servidor.
- `src/app.js`: router HTTP, API REST y frontend estático.
- `src/db.js`: modelo de datos en memoria + seed de ejemplo para MVP.
- `src/auth.js`: firma y validación de token + auth.
- `public/*`: frontend web responsive.
- `.github/workflows/deploy-pages.yml`: pipeline CI/CD para publicar `public/` en GitHub Pages.
- `docs/architecture.md`: arquitectura y roadmap.
- `docs/api.md`: contrato REST inicial.
- `prisma/schema.prisma`: modelo para PostgreSQL multi-tenant.

## Ejecución local (full stack)

```bash
npm start
```

Abrir: `http://localhost:3000`

### Login demo local

- `admin@trendmax.com`
- `ventas@trendmax.com`

## Deploy a GitHub Pages

1. Push a tu rama (`main`, `master` o `work`).
2. Ir a **Settings → Pages** del repo.
3. En **Build and deployment**, seleccionar **GitHub Actions** como source.
4. Esperar a que termine el workflow **Deploy GitHub Pages**.

### Importante sobre Pages

- GitHub Pages **no ejecuta backend Node.js**, solo contenido estático.
- Por eso, en Pages el frontend entra en **modo demo** con datos mock para mostrar pantallas y UX.
- Para usar APIs reales, ejecutar localmente o desplegar backend en otro hosting (Render/Fly/Azure/AWS).

## API REST principal

- `POST /api/auth/google`
- `GET /api/dashboard`
- `GET/POST /api/products`
- `GET/POST /api/customers`
- `GET/POST /api/orders`

## Deploy sugerido (producción cloud)

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

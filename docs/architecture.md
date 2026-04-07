# Arquitectura inicial - Sistema Mayorista B2B (SaaS-ready)

## 1) Arquitectura propuesta

- **Frontend web responsive:** SPA ligera mobile-first (base para migrar a Next.js App Router).
- **Backend API:** Node.js HTTP nativo (estructura preparada para evolución a NestJS).
- **DB transaccional:** modelo in-memory en MVP (runtime actual), con diseño compatible con PostgreSQL multi-tenant.
- **Auth:** flujo principal preparado para Google OAuth 2.0 (endpoint `/api/auth/google`) y emisión de JWT propio.
- **Autorización:** RBAC con roles `admin`, `sales`, `warehouse`, `readonly`.
- **Observabilidad:** auditoría de acciones en `audit_logs`.
- **Escalabilidad futura:** `company_id` en entidades clave para separación de datos por tenant.

## 2) Dominios funcionales implementados (MVP)

1. Usuarios y permisos (login demo + JWT + RBAC).
2. Productos y stock (listado + alta, margen calculado, stock reservado/disponible).
3. Ventas mayoristas (pedido con validaciones de stock y cantidades mínimas).
4. Clientes (listado + alta, crédito y saldo).
5. Dashboard (ventas mensuales, alertas de stock, pedidos pendientes).

## 3) Seguridad

- Tokens firmados (JWT-like) de 8 horas.
- Endpoints protegidos con middleware de autenticación.
- Control por roles a endpoints sensibles.
- Registro de acciones críticas en auditoría.
- Diseño preparado para encriptar secretos (`JWT_SECRET`, credenciales OAuth) via variables de entorno.

## 4) Escalado a SaaS multi-tenant completo (roadmap)

- Migrar SQLite -> PostgreSQL gestionado (RDS/Aurora/Supabase/Azure PG).
- Introducir `tenant resolver` por subdominio (`empresa.miapp.com`) + `company_id` obligatorio.
- Particionado lógico por `company_id` + índices compuestos.
- Cola de trabajos (notificaciones, reportes, backups) con Redis + workers.
- Backups automáticos diarios con retención configurable en bucket/versionado.

## 5) Deployment sugerido

- **App**: contenedor Docker (backend + assets estáticos), deploy en ECS/Fargate, Fly.io, Render o Azure App Service.
- **DB**: PostgreSQL gestionado en cloud.
- **CDN**: CloudFront/Front Door para assets.
- **Observabilidad**: OpenTelemetry + logs centralizados.

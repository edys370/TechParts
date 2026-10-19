# 🚀 Guía de Despliegue, Backup y Operaciones - TechParts
### Documento Técnico de Infraestructura - Fase 4 (Dev 1: Tech Lead & Infra Architect)

Este documento detalla la arquitectura de infraestructura, los procedimientos de despliegue en entornos locales y de producción, la política de respaldos (backup) y recuperación ante desastres (DRP), y las garantías de integridad transaccional del sistema **TechParts**.

---

## 🏛️ 1. Arquitectura de Infraestructura

El sistema TechParts opera sobre una arquitectura desacoplada de alto rendimiento y consistencia transaccional estricta:

```mermaid
flowchart TD
    subgraph Cliente["Capa Cliente / Navegador"]
        UI["Frontend React 18 + Vite + Tailwind CSS<br/>(Diseño Google Stitch, WhatsApp & Checkout)"]
    end

    subgraph Servidor["Capa de Aplicación (Node.js + Express)"]
        API["TechParts Backend API (Puerto 4000)<br/>Tipado estricto Zod & Controladores"]
        PRISMA["Prisma ORM Client<br/>Transacciones ACID & Bloqueos FOR UPDATE"]
        SMTP_CLIENT["Motor Nodemailer SMTP<br/>(Mailtrap / Brevo / TLS 587)"]
        COMPAT_ENGINE["Motor de Compatibilidad PC<br/>(Sockets, RAM DDR4/DDR5, PSU Wattage)"]
    end

    subgraph Persistencia["Capa de Persistencia (Docker Compose)"]
        PG["PostgreSQL 16 Alpine (Puerto 5435)<br/>Contenedor: techparts-postgres"]
        VOL["Volumen Persistente: techparts_pgdata"]
        INIT["Script de Inicialización: init.sql"]
    end

    subgraph Servicios_Externos["Servicios Externos / Notificaciones"]
        MAILTRAP["Servidor SMTP (Mailtrap / Brevo)"]
        WA["API Enlaces WhatsApp (wa.me)"]
    end

    UI -->|HTTP / JSON| API
    API --> PRISMA
    PRISMA -->|TCP / Conexión de Red techparts-net| PG
    PG --> VOL
    PG -.-> INIT
    API --> SMTP_CLIENT
    SMTP_CLIENT -->|SMTP / TLS| MAILTRAP
    UI -->|Redirect wa.me| WA
```

---

## 📋 2. Requisitos Previos del Sistema

Para desplegar y ejecutar TechParts en cualquier servidor o estación de desarrollo:

- **Docker Desktop** (v24.0+) o **Docker Engine + Docker Compose v2**.
- **Node.js** (v18.17.0+ o v20.x LTS recomendado).
- **npm** (v9.0+ o v10.x).
- Puertos disponibles en la máquina anfitriona:
  - `5435` (PostgreSQL de TechParts; configurable vía `POSTGRES_PORT`).
  - `4000` (Backend API Express).
  - `5173` (Frontend Vite Dev Server).

---

## ⚡ 3. Despliegue Rápido en 4 Pasos

### Paso 1: Clonar el repositorio y configurar variables de entorno
```bash
git clone <URL_REPOSITORIO> techparts
cd techparts

# Copiar archivos de configuración de ejemplo
cp .env.example .env
cp backend/.env.example backend/.env
```

> [!IMPORTANT]
> Verifique que `DATABASE_URL` en `backend/.env` apunte al puerto asignado al contenedor:
> `DATABASE_URL=postgresql://techparts_admin:techparts_secret_2026@localhost:5435/techparts_db?schema=public`

### Paso 2: Iniciar la base de datos PostgreSQL con Docker Compose
```bash
npm run db:up
```
El contenedor `techparts-postgres` iniciará en segundo plano con *healthcheck* activo (`pg_isready`). Verifique el estado ejecutando:
```bash
docker ps --filter "name=techparts-postgres"
```

### Paso 3: Cargar la base de datos (Restauración de Dump o Seed Inicial)
Dispone de dos alternativas homologadas:

**Opción A (Recomendada para Despliegues de Producción / Evaluación):**
Restaurar directamente el volcado oficial con catálogo de componentes, variantes y categorías preconfiguradas:
```bash
npm run db:restore
```

**Opción B (Para desarrollo desde cero):**
Ejecutar las migraciones de Prisma y el script de ingesta masiva CSV:
```bash
npm run db:migrate
npm run db:seed
```

### Paso 4: Iniciar Backend y Frontend
En terminales independientes (o mediante gestor de procesos como PM2 en producción):
```bash
# Terminal 1 - Microservicio Backend
npm run dev:backend

# Terminal 2 - Frontend Web React
npm run dev:frontend
```
- Frontend accesible en: [http://localhost:5173](http://localhost:5173)
- Backend API accesible en: [http://localhost:4000/api](http://localhost:4000/api)
- Healthcheck de infraestructura: [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## 💾 4. Política de Respaldos (Backup) y Recuperación (DRP)

TechParts incluye utilidades de backup automatizadas compatibles con cualquier sistema operativo (Linux, macOS, Windows):

### 1. Extracción de Respaldo en Caliente (`npm run db:backup`)
Ejecuta un volcado relacional atómico mediante `pg_dump`:
```bash
npm run db:backup
```
- **Archivo principal generado**: `backup/techparts_dump.sql` (compatible con cualquier motor PostgreSQL 16+).
- **Scripts disponibles**:
  - `backend/scripts/db-backup.ts` (multiplataforma Node.js).
  - `scripts/backup.sh` (entornos bash / Linux).

### 2. Restauración de Base de Datos (`npm run db:restore`)
Restaura el esquema relacional, datos de catálogo, variantes y auditoría de transacciones:
```bash
npm run db:restore
```
- **Scripts disponibles**:
  - `backend/scripts/db-restore.ts` (multiplataforma Node.js).
  - `scripts/restore.sh` (entornos bash / Linux).

---

## 🧪 5. Verificación de Integridad Transaccional ACID

Para certificar que el entorno desplegado mantiene consistencia frente a concurrencia extrema y no permite sobreventas (*overselling*):

```bash
npm run test:acid
```
La suite ejecuta automáticamente 4 fases de estrés:
1. **Anti-Overselling**: 25 compras concurrentes sobre stock limitado de 10 unidades (Cero sobreventas garantizadas).
2. **Aislamiento por Variante**: Salidas concurrentes sobre variaciones específicas (`ProductVariant`) sin afectar a variantes hermanas.
3. **Atomicidad y Rollback**: Simulación de fallos a mitad de transacción con reversión automática sin persistencia corrupta.
4. **Operaciones Mixtas**: Entradas (`IN`) y Salidas (`OUT`) simultáneas con balance exacto de stock final.

---

## 🔒 6. Variables de Entorno Seguras

Las variables sensibles están segregadas en archivos locales `.env` protegidos mediante `.gitignore`. Nunca deben subirse credenciales reales a repositorios públicos:

| Variable | Descripción | Valor por Defecto / Ejemplo |
| :--- | :--- | :--- |
| `PORT` | Puerto de escucha del servidor Express | `4000` |
| `NODE_ENV` | Entorno de ejecución (`development` / `production`) | `development` |
| `DATABASE_URL` | String de conexión relacional a PostgreSQL | `postgresql://techparts_admin:techparts_secret_2026@localhost:5435/techparts_db?schema=public` |
| `CORS_ORIGIN` | Origen autorizado para peticiones CORS | `http://localhost:5173` |
| `SMTP_HOST` | Host del servidor SMTP de correos transaccionales | `sandbox.smtp.mailtrap.io` |
| `SMTP_PORT` | Puerto de conexión SMTP cifrada | `2525` (o `587`) |
| `SMTP_SECURE` | Cifrado SSL/TLS directo | `false` |
| `SMTP_USER` | Usuario autenticado SMTP | `••••••••••••` |
| `SMTP_PASS` | Contraseña o token de aplicación SMTP | `••••••••••••` |
| `SMTP_FROM_NAME` | Nombre del remitente oficial de correos | `"TechParts Tienda Oficial"` |
| `SMTP_FROM_EMAIL`| Correo remitente oficial | `pedidos@techparts.com` |
| `ADMIN_EMAIL` | Correo del administrador para alertas de stock | `admin@techparts.com` |

---

## 📦 7. Nota sobre Entrega WooCommerce / All-in-One WP Migration

De acuerdo con lo estipulado en la sección 2 y 5 de [`Proyecto.md`](file:///Users/edissonmorocho/PracticasWeb/techparts/Proyecto.md), si la entrega se presentase sobre el stack alternativo WordPress + WooCommerce:
- **Herramienta de Exportación**: All-in-One WP Migration genera un archivo empaquetado `.wpress` conteniendo base de datos MySQL, plugins (WP Mail SMTP, WooCommerce, Click to Chat) y temas.
- **Despliegue Equivalente**: Instalación limpia de WordPress local (LocalWP, XAMPP o Docker), importación del archivo `.wpress` mediante la extensión de All-in-One WP Migration y restauración del dump SQL complementario.

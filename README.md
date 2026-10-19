# 🚀 TechParts - Sistema de Gestión de Inventario y Catálogo

Sistema full-stack modular de inventario y catálogo para partes y componentes tecnológicos (**TechParts**). Diseñado con arquitectura transaccional segura (ACID), tipado estricto de extremo a extremo y sistema de diseño visual basado en **Google Stitch**.

---

## 🛠️ Stack Tecnológico

| Área | Tecnologías | Propósito |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons | Interfaz moderna, reactiva, accesible y modular con tipado estricto. |
| **Diseño y Estilos** | Google Stitch Design Tokens, Tailwind CSS, Componentes modulares | Estética limpia, badges semánticos, alertas de stock e interfaces de control. |
| **Backend** | Node.js, Express, TypeScript, Zod | API REST modular, validación estricta de payloads y control de errores. |
| **Base de Datos** | PostgreSQL 16 (Docker Compose) | Persistencia relacional, transacciones ACID para evitar inconsistencias de stock. |
| **ORM** | Prisma ORM 5.22 | Modelado declarativo, migraciones automáticas, cliente fuertemente tipado. |
| **Servicio de Correo** | Nodemailer (SMTP Cifrado con Mailtrap / Brevo) | Facturación digital transaccional, alertas de stock bajo y avisos de reposición. |
| **Migración / Seed** | Scripts TypeScript + CSV | Ingesta masiva de catálogo inicial y variantes con stock independiente. |
| **Contenedores & Backup** | Docker Compose & pg_dump | Base de datos persistente, healthchecks con `pg_isready` y dumps automáticos. |

---

## 📁 Estructura del Proyecto

```text
techparts/
├── docker-compose.yml           # Orquestación de PostgreSQL con persistencia y healthcheck
├── .env.example                 # Plantilla de variables de entorno globales
├── package.json                 # Scripts unificados de ejecución en raíz
├── PLAN-DESARROLLO.md           # Plan de trabajo por fases para 3 agentes / desarrolladores
├── Proyecto.md                  # Requisitos y especificaciones funcionales y técnicas
├── DEPLOYMENT.md                # Guía integral de despliegue, backup y recuperación DRP
├── backup/
│   └── techparts_dump.sql       # Respaldo oficial de la base de datos relacional PostgreSQL
├── docs/
│   ├── INFORME-TECNICO-DEV1.md  # Informe técnico de arquitectura, dockerización y SMTP (Fase 4)
│   └── INFORME-TECNICO-DEV1.html# Versión imprimible / PDF del informe técnico con estilos
├── scripts/
│   ├── backup.sh                # Script bash de respaldo automatizado
│   └── restore.sh               # Script bash de restauración automatizada
├── data/
│   └── initial_inventory.csv    # Datos semilla de inventario inicial
├── backend/                     # API REST Node.js + Express + TypeScript + Prisma
│   ├── prisma/
│   │   ├── schema.prisma        # Modelos: Category, Product, ProductVariant, InventoryTransaction, User
│   │   ├── seed.ts              # Script de migración inicial de datos y variantes
│   │   └── init.sql             # Inicialización DDL
│   ├── scripts/
│   │   ├── test-acid-concurrency.ts # Suite automatizada de pruebas de concurrencia ACID
│   │   ├── db-backup.ts         # Respaldo multiplataforma de PostgreSQL
│   │   └── db-restore.ts        # Restauración multiplataforma de PostgreSQL
│   └── src/
│       ├── config/              # Variables de entorno y configuración SMTP
│       ├── controllers/         # Controladores HTTP (products, inventory, categories, email, compatibility)
│       ├── middlewares/         # Validación Zod y manejo centralizado de excepciones
│       ├── routes/              # Enrutadores modulares de la API
│       ├── services/            # Lógica transaccional ACID (prisma.$transaction con bloqueos FOR UPDATE)
│       ├── utils/               # Cliente Prisma singleton y helpers
│       ├── app.ts               # Configuración de Express y CORS
│       └── server.ts            # Arranque del servidor y conexión con PostgreSQL
└── frontend/                    # SPA React 18 + Vite + TypeScript + Tailwind
    ├── src/
    │   ├── api/                 # Clientes Axios para productos, inventario, compatibilidad y SMTP
    │   ├── components/layout/   # Header (con monitor DB en vivo) y Sidebar
    │   ├── components/ui/       # Botones, Cards, Modales, Badges y Tablas (Google Stitch)
    │   ├── pages/               # Dashboard, Inventario, Movimientos ACID y Settings (Diagnósticos)
    │   ├── types/               # Definición integral de tipos TypeScript
    │   ├── App.tsx              # Componente principal y navegación por pestañas
    │   └── main.tsx             # Punto de entrada de React
```

---

## 🚀 Puesta en Marcha Rápida

### 1. Iniciar la Base de Datos PostgreSQL
Asegúrate de tener Docker instalado y ejecuta en la raíz del proyecto:
```bash
npm run db:up
```

### 2. Cargar la Base de Datos (Restauración de Dump o Seed Inicial)
**Opción A (Recomendada - Restaurar dump oficial con catálogo y variantes):**
```bash
npm run db:restore
```

**Opción B (Generar y migrar desde cero):**
```bash
npm run db:generate && npm run db:migrate && npm run db:seed
```

### 3. Iniciar el Backend
En una terminal:
```bash
npm run dev:backend
```
El backend estará disponible en `http://localhost:4000/api` y el healthcheck en `http://localhost:4000/api/health`.

### 4. Iniciar el Frontend
En otra terminal:
```bash
npm run dev:frontend
```
Abre tu navegador en `http://localhost:5173`.

---

## 🧪 Pruebas Automatizadas de Concurrencia Transaccional ACID

Ejecuta la suite de auditoría técnica que certifica la consistencia transaccional y la prevención de sobreventas (*zero overselling*):

```bash
npm run test:acid
```

La suite valida:
1. **Anti-Overselling**: 25 peticiones simultáneas sobre stock de 10 unidades.
2. **Aislamiento por Variante**: Deducción concurrente sobre variantes técnicas independientes.
3. **Atomicidad y Rollback**: Reversión al 100% ante excepciones inducidas.
4. **Operaciones Mixtas**: Entradas y salidas en paralelo con balance exacto.

---

## 💾 Respaldos de Base de Datos (Backup & Restore)

```bash
# Generar un nuevo volcado en caliente (backup/techparts_dump.sql)
npm run db:backup

# Restaurar la base de datos completa desde el archivo dump
npm run db:restore
```

---

## 📑 Documentación Técnica de Fase 4 (Dev 1)

- 📘 [Informe Técnico de Arquitectura, Dockerización y SMTP](docs/INFORME-TECNICO-DEV1.md)
- 🖨️ [Versión Imprimible / PDF del Informe Técnico](docs/INFORME-TECNICO-DEV1.html)
- 🚀 [Guía Completa de Despliegue y Recuperación ante Desastres (DEPLOYMENT.md)](DEPLOYMENT.md)

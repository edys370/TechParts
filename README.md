# 🚀 TechParts - Sistema de Gestión de Inventario y Catálogo

Sistema full-stack modular de inventario y catálogo para partes y componentes tecnológicos (**TechParts**). Diseñado con arquitectura transaccional segura (ACID), tipado estricto de extremo a extremo y sistema de diseño visual basado en **Google Stitch**.

---

## 🛠️ Stack Tecnológico

| Área | Tecnologías | Propósito |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons | Interfaz moderna, reactiva, accesible y modular con tipado estricto. |
| **Diseño y Estilos** | Google Stitch Design Tokens, Tailwind CSS, Componentes modulares | Estética limpia, badges semánticos, alertas de stock e interfaces de control. |
| **Backend** | Node.js, Express, TypeScript, Zod | API REST modular, validación estricta de payloads y control de errores. |
| **Base de Datos** | PostgreSQL 16 (Docker Compose o Supabase) | Persistencia relacional, transacciones ACID para evitar inconsistencias de stock. |
| **ORM** | Prisma ORM | Modelado declarativo, migraciones automáticas, cliente fuertemente tipado. |
| **Migración / Seed** | Scripts TypeScript + CSV | Ingesta y migración automatizada de inventario inicial desde Google Sheets / CSV. |
| **Contenedores** | Docker & Docker Compose | Contenedor de PostgreSQL con volumen persistente y healthcheck integrado. |

---

## 📁 Estructura del Proyecto

```text
techparts/
├── docker-compose.yml           # Orquestación de PostgreSQL con persistencia y healthcheck
├── .env.example                 # Plantilla de variables de entorno globales
├── package.json                 # Scripts unificados de ejecución en raíz
├── contexto.m                   # Especificaciones del proyecto TechParts
├── PLAN-DESARROLLO.md           # Plan de trabajo por fases para 3 agentes / desarrolladores
├── data/
│   └── initial_inventory.csv    # Datos semilla de inventario inicial (Google Sheets)
├── backend/                     # API REST Node.js + Express + TypeScript + Prisma
│   ├── prisma/
│   │   ├── schema.prisma        # Modelos relacionales: Category, Product, Transaction, User
│   │   └── seed.ts              # Script de migración inicial de datos
│   └── src/
│       ├── config/              # Variables de entorno y configuración
│       ├── controllers/         # Controladores HTTP (products, inventory, categories, health)
│       ├── middlewares/         # Validación Zod y manejo centralizado de excepciones
│       ├── routes/              # Enrutadores modulares de la API
│       ├── services/            # Lógica transaccional ACID (prisma.$transaction)
│       ├── utils/               # Cliente Prisma singleton y helpers
│       ├── app.ts               # Configuración de Express y CORS
│       └── server.ts            # Arranque del servidor y conexión con PostgreSQL
└── frontend/                    # SPA React 18 + Vite + TypeScript + Tailwind
    ├── src/
    │   ├── api/                 # Clientes Axios para productos, inventario y métricas
    │   ├── components/layout/   # Header (con monitor DB en vivo) y Sidebar
    │   ├── components/ui/       # Botones, Cards, Modales, Badges y Tablas (Google Stitch)
    │   ├── pages/               # Dashboard (KPIs), Inventario, Movimientos ACID y Settings
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

Para verificar que el contenedor esté corriendo y saludable:
```bash
docker ps
```

### 2. Generar el Cliente de Prisma y Ejecutar el Seed

Aplica el esquema relacional en PostgreSQL y puebla el inventario inicial desde `data/initial_inventory.csv`:

```bash
# Generar el cliente de Prisma
npm run db:generate

# Crear las tablas en PostgreSQL
npm run db:migrate

# Migrar los datos iniciales
npm run db:seed
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

## 🔒 Garantía de Consistencia Transaccional (ACID)

Todas las operaciones de entrada, salida y ajuste de stock se procesan dentro de transacciones aisladas de Prisma (`prisma.$transaction`), asegurando:
1. **Prevención de sobreventas**: No es posible descontar más unidades de las existentes físicamente.
2. **Auditoría inmutable**: Cada variación de stock genera un registro histórico con fecha, tipo (`IN`/`OUT`/`ADJUSTMENT`), stock previo, stock resultante, motivo y comprobante de referencia.
3. **Actualización automática de estado**: El producto pasa dinámicamente entre `ACTIVE`, `LOW_STOCK` y `OUT_OF_STOCK` según su umbral de `minStock`.

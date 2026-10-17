# Contexto del Proyecto TechParts

Detalle de las herramientas recomendadas para cada área del proyecto TechParts:

- **Frontend**: React con TypeScript (usando Vite o Next.js). Te da tipado estricto para evitar fallos al manipular datos de inventario y facilita la creación de componentes modulares.
- **Diseño y Estilos**: Tailwind CSS combinada con shadcn/ui. Te permitirá implementar rápidamente los prototipos definidos en Google Stitch con interfaces modernas, accesibles y limpias.
- **Base de Datos**: PostgreSQL (alojado en Supabase o contenedor Docker). Es ideal para el modelo relacional, ya que garantiza transacciones seguras (ACID) para que no haya inconsistencias al descontar o ingresar stock, además de ofrecer soporte para triggers y optimización de consultas.
- **Backend y Lógica de Negocio**: Node.js (utilizando frameworks como NestJS o Express junto a un ORM como Prisma o Drizzle) o, de forma alternativa, las Edge Functions / Database Functions de Supabase. Esta capa se encarga de la lógica transaccional, autenticación y reglas de negocio.
- **Migración de Datos Iniciales**: Scripts en Node.js o Python, o la importación directa mediante CSV. Sirve para volcar fácilmente el inventario semilla que tienen armado en Google Sheets directo a PostgreSQL.
- **Gestión y Coordinación del Equipo**: GitHub junto con GitHub Projects o Trello. Indispensable para organizar el flujo de trabajo entre los tres desarrolladores mediante ramas, revisiones de código y un tablero Kanban con las cuatro fases del proyecto.

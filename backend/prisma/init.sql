-- ========================================================
-- TechParts - Script de Inicialización PostgreSQL
-- ========================================================

-- Permisos y propiedad del esquema public para PostgreSQL 15/16+
GRANT ALL ON SCHEMA public TO techparts_admin;
ALTER SCHEMA public OWNER TO techparts_admin;

-- Habilitar extensiones requeridas para generación de UUIDs y optimización de texto
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Comentario informativo
COMMENT ON DATABASE techparts_db IS 'Base de datos de TechParts - Gestión de Inventario con Garantía Transaccional ACID';

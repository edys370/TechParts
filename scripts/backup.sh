#!/usr/bin/env bash
# ==============================================================================
# TechParts - Script Automatizado de Backup de Base de Datos PostgreSQL
# Dev 1 (Tech Lead & Database / Infra Architect) - Fase 4
# ==============================================================================

set -e

BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/techparts_dump.sql"
VERSIONED_FILE="${BACKUP_DIR}/techparts_backup_${TIMESTAMP}.sql"

CONTAINER_NAME="${POSTGRES_CONTAINER:-techparts-postgres}"
DB_USER="${POSTGRES_USER:-techparts_admin}"
DB_NAME="${POSTGRES_DB:-techparts_db}"

mkdir -p "${BACKUP_DIR}"

echo "📦 [TechParts Backup] Iniciando volcado de base de datos..."
echo "   Contenedor: ${CONTAINER_NAME}"
echo "   Base de Datos: ${DB_NAME}"
echo "   Usuario: ${DB_USER}"

# Comprobar que el contenedor esté corriendo
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "❌ Error: El contenedor '${CONTAINER_NAME}' no está en ejecución."
  echo "   Inicie los servicios con: npm run db:up"
  exit 1
fi

# Generar dump limpio con DROP TABLE IF EXISTS y estructura relacional completa
docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists > "${BACKUP_FILE}"

# Crear copia con timestamp para auditoría histórica
cp "${BACKUP_FILE}" "${VERSIONED_FILE}"

FILE_SIZE=$(wc -c < "${BACKUP_FILE}" | tr -d ' ')

echo "✅ [TechParts Backup] Backup completado exitosamente!"
echo "   Archivo principal: ${BACKUP_FILE} (${FILE_SIZE} bytes)"
echo "   Archivo histórico: ${VERSIONED_FILE}"

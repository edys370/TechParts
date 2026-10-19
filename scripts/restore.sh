#!/usr/bin/env bash
# ==============================================================================
# TechParts - Script Automatizado de Restauración de Base de Datos PostgreSQL
# Dev 1 (Tech Lead & Database / Infra Architect) - Fase 4
# ==============================================================================

set -e

BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/backup"
BACKUP_FILE="${1:-${BACKUP_DIR}/techparts_dump.sql}"

CONTAINER_NAME="${POSTGRES_CONTAINER:-techparts-postgres}"
DB_USER="${POSTGRES_USER:-techparts_admin}"
DB_NAME="${POSTGRES_DB:-techparts_db}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Error: El archivo de backup no existe: ${BACKUP_FILE}"
  exit 1
fi

echo "🔄 [TechParts Restore] Iniciando restauración de base de datos..."
echo "   Archivo de origen: ${BACKUP_FILE}"
echo "   Contenedor destino: ${CONTAINER_NAME}"
echo "   Base de Datos: ${DB_NAME}"

# Comprobar que el contenedor esté corriendo
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "❌ Error: El contenedor '${CONTAINER_NAME}' no está en ejecución."
  echo "   Inicie los servicios con: npm run db:up"
  exit 1
fi

# Restaurar datos mediante stream a psql
cat "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"

echo "✅ [TechParts Restore] Restauración completada exitosamente!"

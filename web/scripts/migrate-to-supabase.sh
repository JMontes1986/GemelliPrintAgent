#!/bin/bash
# Script para migrar datos de Neon a Supabase

echo "=== Migración de Neon a Supabase ==="

# Backup desde Neon
echo "1. Haciendo backup de Neon..."
pg_dump "$NEON_DATABASE_URL" > neon_backup.sql

# Restaurar en Supabase
echo "2. Restaurando en Supabase..."
psql "$SUPABASE_DATABASE_URL" < neon_backup.sql

echo "✓ Migración completada"
echo "Verifica los datos en Supabase Dashboard"

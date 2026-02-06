-- Script para ejecutar en Supabase SQL Editor
-- Esto habilita las extensiones necesarias

-- Habilitar extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear usuario administrador inicial
-- NOTA: El hash es bcrypt de "admin123" - CAMBIAR EN PRODUCCIÓN
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
  'admin-001',
  'admin@gemelli.edu',
  '$2a$10$rOvwXqN6Y3N0Y5J6Y7K8ZeqV9xZ8Y7K6Y5N4Y3M2Y1K0J9I8H7G6F5',
  'Administrador',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Verificar instalación
SELECT * FROM "User" WHERE role = 'admin';

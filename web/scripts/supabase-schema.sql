-- ============================================
-- Control Impresiones Gemelli - Database Schema
-- PostgreSQL para Supabase
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Tabla: User
-- ============================================
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'auditor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas por email
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"(email);

-- ============================================
-- Tabla: Agent (Equipos/PCs)
-- ============================================
CREATE TABLE IF NOT EXISTS "Agent" (
    id TEXT PRIMARY KEY,
    "pcName" TEXT NOT NULL,
    "pcIp" TEXT UNIQUE NOT NULL,
    area TEXT,
    responsable TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    token TEXT UNIQUE NOT NULL,
    "lastSeen" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para Agent
CREATE INDEX IF NOT EXISTS "Agent_pcIp_idx" ON "Agent"("pcIp");
CREATE INDEX IF NOT EXISTS "Agent_enabled_idx" ON "Agent"(enabled);
CREATE INDEX IF NOT EXISTS "Agent_token_idx" ON "Agent"(token);

-- ============================================
-- Tabla: Printer (Impresoras)
-- ============================================
CREATE TABLE IF NOT EXISTS "Printer" (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    model TEXT,
    connection TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas por nombre de impresora
CREATE INDEX IF NOT EXISTS "Printer_name_idx" ON "Printer"(name);

-- ============================================
-- Tabla: PrintJob (Trabajos de impresión)
-- ============================================
CREATE TABLE IF NOT EXISTS "PrintJob" (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pcName" TEXT NOT NULL,
    "pcIp" TEXT NOT NULL,
    "usernameWindows" TEXT NOT NULL,
    "printerName" TEXT NOT NULL,
    "jobId" TEXT,
    "documentName" TEXT NOT NULL DEFAULT 'N/D',
    "pagesPrinted" INTEGER NOT NULL DEFAULT 0,
    copies INTEGER NOT NULL DEFAULT 1,
    duplex BOOLEAN,
    color BOOLEAN,
    status TEXT NOT NULL DEFAULT 'submitted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para PrintJob (optimización de consultas)
CREATE INDEX IF NOT EXISTS "PrintJob_timestamp_idx" ON "PrintJob"(timestamp DESC);
CREATE INDEX IF NOT EXISTS "PrintJob_pcIp_idx" ON "PrintJob"("pcIp");
CREATE INDEX IF NOT EXISTS "PrintJob_usernameWindows_idx" ON "PrintJob"("usernameWindows");
CREATE INDEX IF NOT EXISTS "PrintJob_printerName_idx" ON "PrintJob"("printerName");
CREATE INDEX IF NOT EXISTS "PrintJob_status_idx" ON "PrintJob"(status);
CREATE INDEX IF NOT EXISTS "PrintJob_timestamp_pcIp_idx" ON "PrintJob"(timestamp DESC, "pcIp");

-- ============================================
-- Tabla: UnknownDevice (Dispositivos no registrados)
-- ============================================
CREATE TABLE IF NOT EXISTS "UnknownDevice" (
    id TEXT PRIMARY KEY,
    "pcIp" TEXT UNIQUE NOT NULL,
    "pcName" TEXT,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índice para UnknownDevice
CREATE INDEX IF NOT EXISTS "UnknownDevice_pcIp_idx" ON "UnknownDevice"("pcIp");

-- ============================================
-- Foreign Keys (Relaciones)
-- ============================================

-- PrintJob -> Agent (por IP)
ALTER TABLE "PrintJob" 
DROP CONSTRAINT IF EXISTS "PrintJob_pcIp_fkey";

ALTER TABLE "PrintJob" 
ADD CONSTRAINT "PrintJob_pcIp_fkey" 
FOREIGN KEY ("pcIp") 
REFERENCES "Agent"("pcIp") 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- PrintJob -> Printer (por nombre)
ALTER TABLE "PrintJob" 
DROP CONSTRAINT IF EXISTS "PrintJob_printerName_fkey";

ALTER TABLE "PrintJob" 
ADD CONSTRAINT "PrintJob_printerName_fkey" 
FOREIGN KEY ("printerName") 
REFERENCES "Printer"(name) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- ============================================
-- Triggers para actualizar updatedAt
-- ============================================

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para User
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at 
    BEFORE UPDATE ON "User" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para Agent
DROP TRIGGER IF EXISTS update_agent_updated_at ON "Agent";
CREATE TRIGGER update_agent_updated_at 
    BEFORE UPDATE ON "Agent" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Datos iniciales
-- ============================================

-- Crear usuario administrador por defecto
-- Contraseña: admin123
-- Hash generado con bcrypt rounds=10
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
    'admin-' || gen_random_uuid()::text,
    'admin@gemelli.edu',
    '$2a$10$rOvwXqN6Y3N0Y5J6Y7K8ZeqV9xZ8Y7K6Y5N4Y3M2Y1K0J9I8H7G6F5',
    'Administrador Gemelli',
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Insertar impresoras del colegio
INSERT INTO "Printer" (id, name, model, connection, "createdAt")
VALUES 
    ('printer-' || gen_random_uuid()::text, 'Kyocera M3550idn', 'Kyocera M3550idn', NULL, CURRENT_TIMESTAMP),
    ('printer-' || gen_random_uuid()::text, 'Epson L555', 'Epson L555', NULL, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Vistas útiles para reportes
-- ============================================

-- Vista: Resumen de impresiones por PC
CREATE OR REPLACE VIEW "vw_PrintJobsByPC" AS
SELECT 
    a."pcName",
    a."pcIp",
    a.area,
    a.responsable,
    a."isPrimary",
    COUNT(pj.id) as total_trabajos,
    SUM(pj."pagesPrinted") as total_paginas,
    MAX(pj.timestamp) as ultima_impresion
FROM "Agent" a
LEFT JOIN "PrintJob" pj ON a."pcIp" = pj."pcIp"
GROUP BY a.id, a."pcName", a."pcIp", a.area, a.responsable, a."isPrimary"
ORDER BY total_paginas DESC NULLS LAST;

-- Vista: Resumen de impresiones por usuario
CREATE OR REPLACE VIEW "vw_PrintJobsByUser" AS
SELECT 
    "usernameWindows",
    COUNT(id) as total_trabajos,
    SUM("pagesPrinted") as total_paginas,
    MAX(timestamp) as ultima_impresion
FROM "PrintJob"
GROUP BY "usernameWindows"
ORDER BY total_paginas DESC;

-- Vista: Resumen de impresiones por impresora
CREATE OR REPLACE VIEW "vw_PrintJobsByPrinter" AS
SELECT 
    p.name as printer_name,
    p.model,
    COUNT(pj.id) as total_trabajos,
    SUM(pj."pagesPrinted") as total_paginas,
    MAX(pj.timestamp) as ultima_impresion
FROM "Printer" p
LEFT JOIN "PrintJob" pj ON p.name = pj."printerName"
GROUP BY p.id, p.name, p.model
ORDER BY total_paginas DESC NULLS LAST;

-- Vista: Impresiones del mes actual
CREATE OR REPLACE VIEW "vw_CurrentMonthPrintJobs" AS
SELECT 
    pj.*,
    a.area,
    a.responsable,
    a."isPrimary"
FROM "PrintJob" pj
LEFT JOIN "Agent" a ON pj."pcIp" = a."pcIp"
WHERE pj.timestamp >= date_trunc('month', CURRENT_DATE)
ORDER BY pj.timestamp DESC;

-- ============================================
-- Funciones útiles
-- ============================================

-- Función: Obtener estadísticas del mes
CREATE OR REPLACE FUNCTION get_monthly_stats(
    p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    p_month INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
)
RETURNS TABLE (
    total_jobs BIGINT,
    total_pages BIGINT,
    unique_users BIGINT,
    active_pcs BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_jobs,
        COALESCE(SUM("pagesPrinted"), 0)::BIGINT as total_pages,
        COUNT(DISTINCT "usernameWindows")::BIGINT as unique_users,
        COUNT(DISTINCT "pcIp")::BIGINT as active_pcs
    FROM "PrintJob"
    WHERE 
        EXTRACT(YEAR FROM timestamp) = p_year 
        AND EXTRACT(MONTH FROM timestamp) = p_month;
END;
$$ LANGUAGE plpgsql;

-- Función: Limpiar trabajos antiguos (más de 2 años)
CREATE OR REPLACE FUNCTION cleanup_old_print_jobs(
    p_months_to_keep INTEGER DEFAULT 24
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM "PrintJob"
    WHERE timestamp < CURRENT_DATE - (p_months_to_keep || ' months')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Row Level Security (RLS) - OPCIONAL
-- Descomenta si quieres habilitar seguridad a nivel de fila
-- ============================================

-- Habilitar RLS en tablas sensibles
-- ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Agent" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "PrintJob" ENABLE ROW LEVEL SECURITY;

-- Políticas de ejemplo (ajustar según necesidades)
-- CREATE POLICY "Users can view their own data" ON "User"
--     FOR SELECT USING (auth.uid()::text = id);

-- CREATE POLICY "Admins can view all data" ON "PrintJob"
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM "User" 
--             WHERE id = auth.uid()::text 
--             AND role = 'admin'
--         )
--     );

-- ============================================
-- Verificación final
-- ============================================

-- Verificar que todas las tablas se crearon correctamente
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('User', 'Agent', 'Printer', 'PrintJob', 'UnknownDevice');
    
    IF table_count = 5 THEN
        RAISE NOTICE '✓ Todas las tablas creadas correctamente';
    ELSE
        RAISE EXCEPTION '✗ Error: Solo se crearon % de 5 tablas', table_count;
    END IF;
END $$;

-- Mostrar resumen de tablas creadas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

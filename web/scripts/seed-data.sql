-- ============================================
-- Datos de prueba para desarrollo
-- ⚠️ NO EJECUTAR EN PRODUCCIÓN
-- ============================================

-- Registrar PCs de ejemplo
INSERT INTO "Agent" (id, "pcName", "pcIp", area, responsable, "isPrimary", enabled, token)
VALUES 
    ('agent-001', 'PC-SECRETARIA', '192.168.1.10', 'Secretaría', 'María González', true, true, 'token-secretaria-' || gen_random_uuid()),
    ('agent-002', 'PC-COORDINACION', '192.168.1.11', 'Coordinación', 'Juan Pérez', false, true, 'token-coordinacion-' || gen_random_uuid()),
    ('agent-003', 'PC-CONTABILIDAD', '192.168.1.12', 'Contabilidad', 'Ana Martínez', false, true, 'token-contabilidad-' || gen_random_uuid()),
    ('agent-004', 'PC-RECTORIA', '192.168.1.13', 'Rectoría', 'Carlos Rodríguez', false, true, 'token-rectoria-' || gen_random_uuid()),
    ('agent-005', 'PC-BIBLIOTECA', '192.168.1.14', 'Biblioteca', 'Laura Sánchez', false, true, 'token-biblioteca-' || gen_random_uuid())
ON CONFLICT ("pcIp") DO NOTHING;

-- Generar impresiones de ejemplo (últimos 30 días)
INSERT INTO "PrintJob" (
    id, 
    timestamp, 
    "pcName", 
    "pcIp", 
    "usernameWindows", 
    "printerName", 
    "documentName", 
    "pagesPrinted", 
    copies, 
    status
)
SELECT 
    'job-' || gen_random_uuid(),
    CURRENT_TIMESTAMP - (random() * INTERVAL '30 days'),
    a."pcName",
    a."pcIp",
    'usuario_' || (random() * 10)::int,
    (ARRAY['Kyocera M3550idn', 'Epson L555'])[1 + (random())::int],
    'Documento_' || (random() * 1000)::int || '.pdf',
    1 + (random() * 50)::int,
    1 + (random() * 3)::int,
    (ARRAY['completed', 'completed', 'completed', 'error'])[1 + (random() * 3)::int]
FROM "Agent" a
CROSS JOIN generate_series(1, 20);

-- Mostrar resumen
SELECT 
    'Agentes registrados' as metrica, 
    COUNT(*)::text as valor 
FROM "Agent"
UNION ALL
SELECT 'Impresiones generadas', COUNT(*)::text FROM "PrintJob"
UNION ALL
SELECT 'Total de páginas', SUM("pagesPrinted")::text FROM "PrintJob";

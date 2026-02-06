-- ============================================
-- Queries de prueba y mantenimiento
-- ============================================

-- 1. Ver todas las tablas y su tamaño
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- 2. Contar registros en cada tabla
SELECT 'User' as tabla, COUNT(*) as registros FROM "User"
UNION ALL
SELECT 'Agent', COUNT(*) FROM "Agent"
UNION ALL
SELECT 'Printer', COUNT(*) FROM "Printer"
UNION ALL
SELECT 'PrintJob', COUNT(*) FROM "PrintJob"
UNION ALL
SELECT 'UnknownDevice', COUNT(*) FROM "UnknownDevice";

-- 3. Ver últimas 10 impresiones
SELECT 
    timestamp,
    "pcName",
    "pcIp",
    "usernameWindows",
    "printerName",
    "documentName",
    "pagesPrinted",
    status
FROM "PrintJob"
ORDER BY timestamp DESC
LIMIT 10;

-- 4. Estadísticas del mes actual
SELECT 
    COUNT(*) as total_trabajos,
    SUM("pagesPrinted") as total_paginas,
    COUNT(DISTINCT "pcIp") as pcs_activos,
    COUNT(DISTINCT "usernameWindows") as usuarios_unicos
FROM "PrintJob"
WHERE timestamp >= date_trunc('month', CURRENT_DATE);

-- 5. Top 5 usuarios que más imprimen
SELECT 
    "usernameWindows",
    COUNT(*) as trabajos,
    SUM("pagesPrinted") as paginas_total
FROM "PrintJob"
GROUP BY "usernameWindows"
ORDER BY paginas_total DESC
LIMIT 5;

-- 6. Impresiones por PC
SELECT 
    a."pcName",
    a."pcIp",
    a.area,
    COUNT(pj.id) as trabajos,
    SUM(pj."pagesPrinted") as paginas
FROM "Agent" a
LEFT JOIN "PrintJob" pj ON a."pcIp" = pj."pcIp"
GROUP BY a.id, a."pcName", a."pcIp", a.area
ORDER BY paginas DESC NULLS LAST;

-- 7. Dispositivos no reconocidos
SELECT * FROM "UnknownDevice"
ORDER BY "lastSeen" DESC;

-- 8. Actividad de impresión por día (últimos 7 días)
SELECT 
    DATE(timestamp) as fecha,
    COUNT(*) as trabajos,
    SUM("pagesPrinted") as paginas
FROM "PrintJob"
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY fecha DESC;

-- 9. Verificar integridad referencial
SELECT 
    pj."pcIp",
    COUNT(*) as jobs_huerfanos
FROM "PrintJob" pj
LEFT JOIN "Agent" a ON pj."pcIp" = a."pcIp"
WHERE a.id IS NULL
GROUP BY pj."pcIp";

-- 10. Limpiar datos de prueba (⚠️ CUIDADO)
-- DELETE FROM "PrintJob" WHERE "documentName" LIKE '%test%';
-- DELETE FROM "UnknownDevice" WHERE "jobCount" < 2;

# Control Impresiones Gemelli

Sistema de auditoría de impresión para Windows 11 con Next.js, Vercel y PostgreSQL (Supabase).

## Stack Tecnológico

- **Agente**: .NET 8 Worker Service (Windows Service)
- **Instalador**: WiX Toolset v4
- **Frontend/Backend**: Next.js 14 (App Router)
- **Base de datos**: PostgreSQL en Supabase (serverless)
- **ORM**: Prisma
- **Deploy**: Vercel
- **CI/CD**: GitHub Actions

## Arquitectura
```
5 PCs Windows 11 → Agentes .NET → API Next.js (Vercel) → PostgreSQL (Supabase)
```

## Instalación paso a paso

### 1. Configurar Base de Datos (Supabase)

#### 1.1 Obtener credenciales

1. Ir a [Supabase Dashboard](https://supabase.com/dashboard/project/chncdlusummdopwpfvug)
2. Ve a **Settings** → **Database**
3. Copia la **Connection string** (modo Transaction)
4. Reemplaza `[YOUR-PASSWORD]` con tu contraseña real

#### 1.2 Configurar variables de entorno

Crear `web/.env.local`:
```env
DATABASE_URL="postgresql://postgres.chncdlusummdopwpfvug:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.chncdlusummdopwpfvug:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://chncdlusummdopwpfvug.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobmNkbHVzdW1tZG9wd3BmdnVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzODUxOTYsImV4cCI6MjA4NTk2MTE5Nn0.ODsCwSCTJJU7uKWlFfMSDhQBENQTm9d5wQ9h4hxxEOA"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobmNkbHVzdW1tZG9wd3BmdnVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM4NTE5NiwiZXhwIjoyMDg1OTYxMTk2fQ.1IOkyPxMJYY49ihCcS6b5SfrmhYCJl0a_Wpwos2drLk"
NEXT_PUBLIC_API_BASE_URL="https://tu-app.vercel.app"
JWT_SECRET="tu-secreto-jwt-aqui"
AGENT_TOKENS="token1,token2,token3,token4,token5"
```

#### 1.3 Ejecutar migraciones
```bash
cd web
npm install
npx prisma generate
npx prisma migrate dev --name init
```

#### 1.4 Crear usuario admin

Opción A - Desde Supabase SQL Editor:
```sql
INSERT INTO "User" (id, email, password, name, role)
VALUES (
  'admin-001',
  'admin@gemelli.edu',
  '$2a$10$rOvwXqN6Y3N0Y5J6Y7K8ZeqV9xZ8Y7K6Y5N4Y3M2Y1K0J9I8H7G6F5',
  'Administrador',
  'admin'
);
```

Contraseña: `admin123` (⚠️ CAMBIAR en producción)

Opción B - Generar tu propio hash:
```bash
npm install -g bcrypt-cli
bcrypt-cli "tu-contraseña-segura" 10
```

### 2. Deploy Web en Vercel
```bash
cd web
npm install

# Probar localmente
npm run dev

# Deploy a Vercel
vercel --prod
```

#### Configurar variables en Vercel:

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agregar TODAS las variables de `.env.local`

**Variables requeridas en Vercel:**
- `DATABASE_URL` (Pooler connection)
- `DIRECT_URL` (Direct connection para migraciones)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_API_BASE_URL`
- `JWT_SECRET`
- `AGENT_TOKENS`

- `AGENT_MSI_URL` (URL pública del MSI que se descargará desde el dashboard)
  
### 3. Habilitar Print Service Log (en cada PC)

Ejecutar como **Administrador**:
```powershell
.\scripts\enable-print-log.ps1
```

O manualmente:
1. Abrir Event Viewer (`eventvwr.msc`)
2. Ir a: `Applications and Services Logs > Microsoft > Windows > PrintService > Operational`
3. Click derecho → `Enable Log`

### 4. Compilar instalador MSI

En Windows con .NET 8 SDK y WiX v4:
```powershell
cd agent/Installer

.\build.ps1 `
  -ApiBaseUrl "https://tu-app.vercel.app" `
  -AgentToken "token-del-pc"
```

Resultado: `GemelliPrintAgent.msi`

### 5. Instalar agente en cada PC

1. Copiar `GemelliPrintAgent.msi` al PC
2. Ejecutar como Administrador
3. El servicio arranca automáticamente
4. Verificar en Services: `GemelliPrintAgent` (Running)

### 6. Registrar PCs en el dashboard

1. Ir a `https://tu-app.vercel.app/dashboard/equipos`
2. Iniciar sesión con `admin@gemelli.edu` / `admin123`
3. Click "Registrar nuevo equipo"
4. Ingresar:
   - Nombre del PC
   - **IP fija** (ej: 192.168.1.10)
   - Área (Secretaría, Rectoría, etc.)
   - Responsable
   - Marcar "PC Principal" si corresponde
5. Click en **"Descargar MSI"** para bajar el instalador Windows
6. Instalar el MSI como Administrador
7. Copiar el token generado (se muestra al descargar)
8. Configurar en `C:\Program Files\GemelliPrintAgent\appsettings.json`

### 7. Verificar en Supabase

Puedes monitorear la base de datos en tiempo real:

1. Ir a [Supabase Dashboard](https://supabase.com/dashboard/project/chncdlusummdopwpfvug)
2. **Table Editor** → Ver las tablas y datos
3. **SQL Editor** → Ejecutar consultas personalizadas
4. **Logs** → Ver logs de consultas

Ejemplo de consulta útil:
```sql
-- Ver últimas 10 impresiones
SELECT 
  timestamp,
  "pcName",
  "pcIp",
  "usernameWindows",
  "printerName",
  "pagesPrinted"
FROM "PrintJob"
ORDER BY timestamp DESC
LIMIT 10;

-- Ver total de páginas por PC este mes
SELECT 
  "pcIp",
  COUNT(*) as trabajos,
  SUM("pagesPrinted") as total_paginas
FROM "PrintJob"
WHERE timestamp >= date_trunc('month', CURRENT_DATE)
GROUP BY "pcIp"
ORDER BY total_paginas DESC;
```

## Ventajas de Supabase vs Neon

✅ **Dashboard visual** para ver datos en tiempo real  
✅ **SQL Editor** integrado para consultas rápidas  
✅ **Row Level Security (RLS)** para seguridad avanzada  
✅ **Backups automáticos** en plan gratuito  
✅ **PostgreSQL 15** con todas las extensiones  
✅ **Realtime subscriptions** (opcional para futuras mejoras)  
✅ **Auth integrado** (si quieres migrar de JWT a Supabase Auth)

## Comandos útiles

### Prisma con Supabase
```bash
# Generar cliente
npx prisma generate

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones en producción
npx prisma migrate deploy

# Sincronizar schema sin migraciones (desarrollo)
npx prisma db push

# Abrir Prisma Studio
npx prisma studio
```

### Consultas SQL directas en Supabase
```sql
-- Ver estructura de tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Ver índices creados
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Estadísticas de uso
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Troubleshooting Supabase

### Error de conexión
```bash
# Verificar que la URL sea correcta
echo $DATABASE_URL

# Test de conexión
psql "postgresql://postgres.chncdlusummdopwpfvug:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

### Migraciones fallan

Si tienes problemas con migraciones:
```bash
# Resetear migraciones (⚠️ SOLO EN DESARROLLO)
npx prisma migrate reset

# O hacer push directo del schema
npx prisma db push --accept-data-loss
```

### Ver logs en Supabase

1. Dashboard → Logs
2. Filtrar por errores de PostgreSQL
3. Ver queries lentas

## Seguridad en Supabase
```sql
-- Habilitar RLS (Row Level Security) - OPCIONAL
ALTER TABLE "PrintJob" ENABLE ROW LEVEL SECURITY;

-- Política de ejemplo: solo admins pueden ver todo
CREATE POLICY "Admins can view all print jobs"
ON "PrintJob"
FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'admin'
);
```

## Backup y Restauración

Supabase hace backups automáticos diarios. Para backup manual:
```bash
# Backup completo
pg_dump "postgresql://postgres.chncdlusummdopwpfvug:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres" > backup.sql

# Restaurar
psql "postgresql://postgres.chncdlusummdopwpfvug:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres" < backup.sql
```

## Monitoreo

### Dashboard de Supabase
- **Database** → Ver uso de storage
- **API** → Ver requests por minuto
- **Auth** → Ver usuarios activos (si usas Supabase Auth)

### Métricas útiles
```sql
-- Impresiones por día (últimos 30 días)
SELECT 
  DATE(timestamp) as fecha,
  COUNT(*) as trabajos,
  SUM("pagesPrinted") as paginas
FROM "PrintJob"
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY fecha DESC;

-- Top 10 usuarios que más imprimen
SELECT 
  "usernameWindows",
  COUNT(*) as trabajos,
  SUM("pagesPrinted") as total_paginas
FROM "PrintJob"
GROUP BY "usernameWindows"
ORDER BY total_paginas DESC
LIMIT 10;
```

## Límites del Plan Gratuito

- **Database**: 500 MB storage
- **API requests**: 50,000/mes
- **Bandwidth**: 2 GB/mes
- **Backups**: 7 días de retención

Para el colegio (5 PCs), esto es más que suficiente.

## Soporte

Para problemas con Supabase:
1. Revisar [Supabase Dashboard](https://supabase.com/dashboard/project/chncdlusummdopwpfvug)
2. Ver logs en tiempo real
3. Consultar [Supabase Docs](https://supabase.com/docs)

## Licencia

Uso interno - Colegio Gemelli

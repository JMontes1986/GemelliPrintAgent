# Control Impresiones Gemelli

Sistema de auditoría de impresión para Windows 11 con Next.js, Vercel y PostgreSQL (Neon).

## Stack Tecnológico

- **Agente**: .NET 8 Worker Service (Windows Service)
- **Instalador**: WiX Toolset v4
- **Frontend/Backend**: Next.js 14 (App Router)
- **Base de datos**: PostgreSQL en Neon (serverless)
- **ORM**: Prisma
- **Deploy**: Vercel
- **CI/CD**: GitHub Actions

## Arquitectura
```
5 PCs Windows 11 → Agentes .NET → API Next.js (Vercel) → PostgreSQL (Neon)
```

## Instalación paso a paso

### 1. Configurar Base de Datos (Neon)

La base de datos ya está creada en Neon:
- Project ID: `long-thunder-16505997`
- Obtener `DATABASE_URL` del dashboard de Neon

### 2. Deploy Web en Vercel
```bash
cd web
npm install
npx prisma generate
npx prisma migrate deploy  # Ejecutar migraciones

# Configurar variables de entorno en Vercel:
# - DATABASE_URL
# - JWT_SECRET
# - AGENT_TOKENS (5 tokens separados por comas)

vercel --prod
```

### 3. Crear usuario admin inicial

Conectarse a PostgreSQL y ejecutar:
```sql
INSERT INTO "User" (id, email, password, name, role)
VALUES (
  'admin-001',
  'admin@gemelli.edu',
  '$2a$10$ejemplo',  -- Hash de bcrypt de la contraseña
  'Administrador',
  'admin'
);
```

### 4. Habilitar Print Service Log (en cada PC)

Ejecutar como **Administrador**:
```powershell
.\scripts\enable-print-log.ps1
```

O manualmente:
1. Abrir Event Viewer (`eventvwr.msc`)
2. Ir a: `Applications and Services Logs > Microsoft > Windows > PrintService > Operational`
3. Click derecho → `Enable Log`

### 5. Compilar instalador MSI

En Windows con .NET 8 SDK y WiX v4:
```powershell
cd agent/Installer

.\build.ps1 `
  -ApiBaseUrl "https://tu-app.vercel.app" `
  -AgentToken "token-del-pc"
```

Resultado: `GemelliPrintAgent.msi`

### 6. Instalar agente en cada PC

1. Copiar `GemelliPrintAgent.msi` al PC
2. Ejecutar como Administrador
3. El servicio arranca automáticamente
4. Verificar en Services: `GemelliPrintAgent` (Running)

### 7. Registrar PCs en el dashboard

1. Ir a `https://tu-app.vercel.app/dashboard/equipos`
2. Click "Registrar nuevo equipo"
3. Ingresar:
   - Nombre del PC
   - **IP fija** (ej: 192.168.1.10)
   - Área (Secretaría, Rectoría, etc.)
   - Responsable
   - Marcar "PC Principal" si corresponde
4. Copiar el token generado
5. Configurar en `C:\Program Files\GemelliPrintAgent\appsettings.json`

### 8. Probar impresión

1. Imprimir cualquier documento desde el PC
2. Verificar en Event Viewer: evento ID 307
3. Esperar 5 minutos (sincronización automática)
4. Ver en dashboard: `https://tu-app.vercel.app/dashboard/impresiones`

## Configuración de IPs fijas

Asignar IPs estáticas en Windows:
```
PC Principal (Secretaría): 192.168.1.10
PC Coordinación:          192.168.1.11
PC Contabilidad:          192.168.1.12
PC Rectoría:              192.168.1.13
PC Biblioteca:            192.168.1.14
```

## Estructura de directorios del agente
```
C:\Program Files\GemelliPrintAgent\
  ├── GemelliPrintAgent.exe
  └── appsettings.json

C:\ProgramData\GemelliPrintAgent\
  ├── queue.db           # Cola SQLite local
  └── logs\
      └── agent-*.log    # Logs diarios
```

## Comandos útiles

### Gestión del servicio
```powershell
# Ver estado
Get-Service GemelliPrintAgent

# Reiniciar
Restart-Service GemelliPrintAgent

# Ver logs
Get-Content "C:\ProgramData\GemelliPrintAgent\logs\agent-$(Get-Date -Format 'yyyyMMdd').log" -Tail 50
```

### Prisma
```bash
# Generar cliente
npx prisma generate

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones en producción
npx prisma migrate deploy

# Abrir Prisma Studio
npx prisma studio
```

### Desarrollo local
```bash
cd web
npm run dev  # http://localhost:3000
```

## Exportar datos

Desde el dashboard: `/api/export/csv?dateFrom=2024-01-01&dateTo=2024-12-31`

## Troubleshooting

### El agente no captura impresiones

1. Verificar que el log esté habilitado:
```powershell
   wevtutil get-log "Microsoft-Windows-PrintService/Operational"
```

2. Verificar servicio corriendo:
```powershell
   Get-Service GemelliPrintAgent
```

3. Revisar logs:
```powershell
   Get-Content "C:\ProgramData\GemelliPrintAgent\logs\agent-*.log" -Tail 100
```

### Jobs no llegan al servidor

1. Verificar conectividad:
```powershell
   Test-NetConnection tu-app.vercel.app -Port 443
```

2. Revisar token en `appsettings.json`

3. Verificar cola local:
```sql
   -- Abrir queue.db con SQLite Browser
   SELECT * FROM queue WHERE sent = 0;
```

### IP aparece como "no reconocida"

1. Verificar que la IP del PC coincida con la registrada
2. Ir a `/dashboard/equipos` y actualizar

## Seguridad

- Tokens de agente hasheados en DB
- HTTPS obligatorio (Vercel)
- Rate limiting por IP
- Contraseñas con bcrypt
- JWT con expiración de 7 días

## Limitaciones

- Neon Free: 0.5GB storage, 1 base de datos
- Vercel Free: 100GB bandwidth/mes
- Máximo 50 jobs por batch
- Retención logs SQLite: 30 días

## Soporte

Para problemas técnicos:
1. Revisar logs del agente
2. Verificar dashboard de Vercel
3. Consultar logs de Neon

## Licencia

Uso interno - Colegio Gemelli

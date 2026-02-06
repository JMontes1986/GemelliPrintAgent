-- Schema mínimo para Control Impresiones Gemelli

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla User
CREATE TABLE "User" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'auditor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Agent
CREATE TABLE "Agent" (
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

-- Tabla Printer
CREATE TABLE "Printer" (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    model TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla PrintJob
CREATE TABLE "PrintJob" (
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

-- Tabla UnknownDevice
CREATE TABLE "UnknownDevice" (
    id TEXT PRIMARY KEY,
    "pcIp" TEXT UNIQUE NOT NULL,
    "pcName" TEXT,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX "Agent_pcIp_idx" ON "Agent"("pcIp");
CREATE INDEX "Agent_enabled_idx" ON "Agent"(enabled);
CREATE INDEX "Printer_name_idx" ON "Printer"(name);
CREATE INDEX "PrintJob_timestamp_idx" ON "PrintJob"(timestamp DESC);
CREATE INDEX "PrintJob_pcIp_idx" ON "PrintJob"("pcIp");
CREATE INDEX "PrintJob_usernameWindows_idx" ON "PrintJob"("usernameWindows");
CREATE INDEX "PrintJob_printerName_idx" ON "PrintJob"("printerName");
CREATE INDEX "PrintJob_status_idx" ON "PrintJob"(status);
CREATE INDEX "PrintJob_timestamp_pcIp_idx" ON "PrintJob"(timestamp DESC, "pcIp");
CREATE INDEX "UnknownDevice_pcIp_idx" ON "UnknownDevice"("pcIp");

-- Foreign Keys
ALTER TABLE "PrintJob" 
ADD CONSTRAINT "PrintJob_pcIp_fkey" 
FOREIGN KEY ("pcIp") REFERENCES "Agent"("pcIp") 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PrintJob" 
ADD CONSTRAINT "PrintJob_printerName_fkey" 
FOREIGN KEY ("printerName") REFERENCES "Printer"(name) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Usuario admin inicial (password: admin123)
INSERT INTO "User" (id, email, password, name, role)
VALUES (
    'admin-001',
    'admin@gemelli.edu',
    '$2a$10$rOvwXqN6Y3N0Y5J6Y7K8ZeqV9xZ8Y7K6Y5N4Y3M2Y1K0J9I8H7G6F5',
    'Administrador Gemelli',
    'admin'
);

-- Impresoras iniciales
INSERT INTO "Printer" (id, name, model)
VALUES 
    ('printer-001', 'Kyocera M3550idn', 'Kyocera M3550idn'),
    ('printer-002', 'Epson L555', 'Epson L555');

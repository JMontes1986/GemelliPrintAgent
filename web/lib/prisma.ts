import { PrismaClient } from '@prisma/client'
import { buildSupabaseConnectionError, getSupabaseConnectionHints } from '@/lib/supabase-connection'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export { getSupabaseConnectionHints }

const configError = buildSupabaseConnectionError(process.env)

if (configError) {
  throw new Error(configError)
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

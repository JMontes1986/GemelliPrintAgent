import { PrismaClient } from '@prisma/client'
import { buildSupabaseConnectionError, getSupabaseConnectionHints } from '@/lib/supabase-connection'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export { getSupabaseConnectionHints }

const configError = buildSupabaseConnectionError(process.env)

if (configError) {
  console.warn(configError)
}

const prismaClient = globalForPrisma.prisma ?? new PrismaClient()

export const prisma = new Proxy(prismaClient, {
  get(target, property, receiver) {
    if (configError) {
      throw new Error(configError)
    }

    return Reflect.get(target, property, receiver)
  }
}) as PrismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClient

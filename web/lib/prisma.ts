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

const buildPrismaDataSourceUrl = (databaseUrl?: string) => {
  if (!databaseUrl || !databaseUrl.includes('pooler.supabase.com')) {
    return databaseUrl
  }

  try {
    const parsed = new URL(databaseUrl)

    if (!parsed.searchParams.has('pgbouncer')) {
      parsed.searchParams.set('pgbouncer', 'true')
    }

    if (!parsed.searchParams.has('connection_limit')) {
      parsed.searchParams.set('connection_limit', '1')
    }

    return parsed.toString()
  } catch {
    return databaseUrl
  }
}

const datasourceUrl = buildPrismaDataSourceUrl(process.env.DATABASE_URL)

const prismaClient =
  globalForPrisma.prisma ??
  new PrismaClient(
    datasourceUrl
      ? {
          datasources: {
            db: {
              url: datasourceUrl
            }
          }
        }
      : undefined
  )

export const prisma = new Proxy(prismaClient, {
  get(target, property, receiver) {
    if (configError) {
      throw new Error(configError)
    }

    return Reflect.get(target, property, receiver)
  }
}) as PrismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClient

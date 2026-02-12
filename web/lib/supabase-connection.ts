export type SupabaseConnectionHints = {
  errors: string[]
  hints: string[]
}

const isValidUrl = (value?: string) => {
  if (!value) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export const getSupabaseConnectionHints = (env: NodeJS.ProcessEnv): SupabaseConnectionHints => {
  const errors: string[] = []
  const hints: string[] = []

  const databaseUrl = env.DATABASE_URL
  const directUrl = env.DIRECT_URL
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL

  if (!databaseUrl) {
    errors.push('Falta DATABASE_URL.')
  } else if (!isValidUrl(databaseUrl)) {
    errors.push('DATABASE_URL no tiene un formato de URL válido.')
  }

  if (!directUrl) {
    hints.push('Configura DIRECT_URL para migraciones y operaciones administrativas de Prisma.')
  } else if (!isValidUrl(directUrl)) {
    errors.push('DIRECT_URL no tiene un formato de URL válido.')
  }

  if (!supabaseUrl) {
    hints.push('Define NEXT_PUBLIC_SUPABASE_URL para los clientes de Supabase en frontend/API.')
  } else if (!isValidUrl(supabaseUrl)) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL no tiene un formato de URL válido.')
  }

  if (databaseUrl && databaseUrl.includes('pooler.supabase.com') && !databaseUrl.includes('sslmode=require')) {
    hints.push('Considera agregar sslmode=require en DATABASE_URL para conexiones al pooler de Supabase.')
  }

  return { errors, hints }
}

export const buildSupabaseConnectionError = (env: NodeJS.ProcessEnv): string | null => {
  const { errors, hints } = getSupabaseConnectionHints(env)

  if (errors.length === 0) {
    return null
  }

  const details = [
    'Configuración de Supabase/Prisma inválida.',
    ...errors.map((error) => `- Error: ${error}`),
    ...hints.map((hint) => `- Sugerencia: ${hint}`),
  ]

  return details.join('\n')
}

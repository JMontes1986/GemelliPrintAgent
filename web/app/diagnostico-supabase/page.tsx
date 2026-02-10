import { prisma } from '@/lib/prisma'
import { getSupabaseConnectionHints } from '@/lib/supabase-connection'

const envStatus = (value?: string) => ({
  present: Boolean(value),
  length: value ? value.length : 0
})

const redactUrl = (value?: string) => {
  if (!value) return null
  try {
    const url = new URL(value)
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}${url.pathname}`
  } catch {
    return 'formato_invalido'
  }
}

const parseUrlInfo = (value?: string) => {
  if (!value) {
    return { host: null, port: null, database: null, username: null }
  }
  try {
    const url = new URL(value)
    return {
      host: url.hostname,
      port: url.port || null,
      database: url.pathname.replace('/', '') || null,
      username: url.username || null
    }
  } catch {
    return { host: 'formato_invalido', port: null, database: null, username: null }
  }
}

const getPoolerHint = (databaseUrl?: string) => {
  const info = parseUrlInfo(databaseUrl)
  if (!info.host || info.host === 'formato_invalido') return null
  if (!info.host.includes('pooler.supabase.com')) return null
  if (!info.username || !info.username.includes('.')) {
    return 'El pooler de Supabase requiere que el usuario incluya el project ref (por ejemplo: postgres.<project-ref>).'
  }
  return null
}

const getDiagnostics = async () => {
  const env = {
    databaseUrl: envStatus(process.env.DATABASE_URL),
    directUrl: envStatus(process.env.DIRECT_URL),
    supabaseUrl: envStatus(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: envStatus(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceKey: envStatus(process.env.SUPABASE_SERVICE_ROLE_KEY)
  }

  const redacted = {
    databaseUrl: redactUrl(process.env.DATABASE_URL),
    directUrl: redactUrl(process.env.DIRECT_URL),
    supabaseUrl: redactUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  }

  const parsed = {
    databaseUrl: parseUrlInfo(process.env.DATABASE_URL),
    directUrl: parseUrlInfo(process.env.DIRECT_URL)
  }
  
  const results: Array<{ label: string; ok: boolean; detail?: string }> = []

  try {
    await prisma.$queryRaw`SELECT 1`
    results.push({ label: 'Conexión a Postgres (SELECT 1)', ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    results.push({ label: 'Conexión a Postgres (SELECT 1)', ok: false, detail: message })
  }

  try {
    const userCount = await prisma.user.count()
    results.push({ label: 'Consulta tabla User', ok: true, detail: `Registros: ${userCount}` })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    results.push({ label: 'Consulta tabla User', ok: false, detail: message })
  }

  const connectionHints = getSupabaseConnectionHints(process.env)
  const hints = [getPoolerHint(process.env.DATABASE_URL), ...connectionHints.errors, ...connectionHints.hints].filter(Boolean) as string[]

  return { env, redacted, parsed, results, hints }
}

export default async function DiagnosticoSupabasePage() {
  const diagnostics = await getDiagnostics()

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Diagnóstico temporal Supabase</h1>
          <p className="text-sm text-slate-300">
            Esta vista es solo para depuración temporal. Elimina la ruta cuando ya no sea
            necesaria.
          </p>
        </header>

        <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="text-lg font-medium">Estado de variables de entorno</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>DATABASE_URL: {diagnostics.env.databaseUrl.present ? '✅' : '❌'} (len: {diagnostics.env.databaseUrl.length})</li>
            <li>DIRECT_URL: {diagnostics.env.directUrl.present ? '✅' : '❌'} (len: {diagnostics.env.directUrl.length})</li>
            <li>NEXT_PUBLIC_SUPABASE_URL: {diagnostics.env.supabaseUrl.present ? '✅' : '❌'} (len: {diagnostics.env.supabaseUrl.length})</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: {diagnostics.env.supabaseAnonKey.present ? '✅' : '❌'} (len: {diagnostics.env.supabaseAnonKey.length})</li>
            <li>SUPABASE_SERVICE_ROLE_KEY: {diagnostics.env.supabaseServiceKey.present ? '✅' : '❌'} (len: {diagnostics.env.supabaseServiceKey.length})</li>
          </ul>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="text-lg font-medium">Conectividad y consultas</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {diagnostics.results.map((item) => (
              <li key={item.label} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span>{item.ok ? '✅' : '❌'}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.detail ? <p className="text-slate-300">{item.detail}</p> : null}
              </li>
            ))}
          </ul>
          {diagnostics.hints.length ? (
            <div className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
              <p className="font-medium text-amber-100">Sugerencias</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {diagnostics.hints.map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300">
          <h2 className="text-lg font-medium text-slate-100">URLs (redactadas)</h2>
          <ul className="mt-3 space-y-2">
            <li>DATABASE_URL: {diagnostics.redacted.databaseUrl ?? 'N/D'}</li>
            <li>DIRECT_URL: {diagnostics.redacted.directUrl ?? 'N/D'}</li>
            <li>SUPABASE_URL: {diagnostics.redacted.supabaseUrl ?? 'N/D'}</li>
          </ul>
          <div className="mt-4 text-xs text-slate-400">
            <p className="font-medium text-slate-300">Componentes detectados</p>
            <ul className="mt-2 space-y-1">
              <li>
                DATABASE_URL → host: {diagnostics.parsed.databaseUrl.host ?? 'N/D'}, puerto:{' '}
                {diagnostics.parsed.databaseUrl.port ?? 'N/D'}, db:{' '}
                {diagnostics.parsed.databaseUrl.database ?? 'N/D'}, usuario:{' '}
                {diagnostics.parsed.databaseUrl.username ?? 'N/D'}
              </li>
              <li>
                DIRECT_URL → host: {diagnostics.parsed.directUrl.host ?? 'N/D'}, puerto:{' '}
                {diagnostics.parsed.directUrl.port ?? 'N/D'}, db:{' '}
                {diagnostics.parsed.directUrl.database ?? 'N/D'}, usuario:{' '}
                {diagnostics.parsed.directUrl.username ?? 'N/D'}
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  )
}

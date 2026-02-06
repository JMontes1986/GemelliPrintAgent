import { prisma } from '@/lib/prisma'
import { getApiUrl } from '@/lib/api'

export const dynamic = 'force-dynamic'

async function getKPIs() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const [totalJobs, totalPages, activeAgents] = await Promise.all([
    prisma.printJob.count({
      where: { timestamp: { gte: startOfMonth } }
    }),
    prisma.printJob.aggregate({
      where: { timestamp: { gte: startOfMonth } },
      _sum: { pagesPrinted: true }
    }),
    prisma.agent.count({
      where: { enabled: true }
    })
  ])

  return {
    totalJobs,
    totalPages: totalPages._sum.pagesPrinted || 0,
    activeAgents
  }
}

export default async function DashboardPage() {
  const kpis = await getKPIs()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Trabajos este mes</h3>
          <p className="text-3xl font-bold">{kpis.totalJobs}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Páginas impresas</h3>
          <p className="text-3xl font-bold">{kpis.totalPages}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Equipos activos</h3>
          <p className="text-3xl font-bold">{kpis.activeAgents}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Menú</h2>
        <ul className="space-y-2">
          <li>
            <a href="/dashboard/impresiones" className="text-blue-600 hover:underline">
              Ver impresiones
            </a>
          </li>
          <li>
            <a href="/dashboard/equipos" className="text-blue-600 hover:underline">
              Gestionar equipos
            </a>
          </li>
          <li>
            <a href={getApiUrl('/api/export/csv')} className="text-blue-600 hover:underline">
              Exportar CSV
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}

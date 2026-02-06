'use client'

import { useState, useEffect } from 'react'
import { getApiUrl } from '@/lib/api'

export default function ReportesPage() {
  const [report, setReport] = useState<any>(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    fetchReport()
  }, [year, month])

  const fetchReport = async () => {
    const response = await fetch(getApiUrl(`/api/reports/monthly?year=${year}&month=${month}`))
    const data = await response.json()
    setReport(data)
  }

  const handleExport = () => {
    window.open(
      getApiUrl(`/api/export/csv?dateFrom=${year}-${month}-01&dateTo=${year}-${month}-31`),
      '_blank'
    )
  }

  if (!report) return <div>Cargando...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reportes Mensuales</h1>
        <button
          onClick={handleExport}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Año</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-md"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mes</label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-md"
          >
            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>
                {new Date(2024, m - 1).toLocaleString('es', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-2">Total Trabajos</h3>
          <p className="text-4xl font-bold text-blue-600">{report.summary.totalJobs}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-2">Total Páginas</h3>
          <p className="text-4xl font-bold text-green-600">{report.summary.totalPages}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4">Por Equipo</h3>
          <div className="space-y-2">
            {report.byAgent.map((item: any) => (
              <div key={item.pcIp} className="flex justify-between border-b pb-2">
                <span className="font-medium">{item.pcIp}</span>
                <span className="text-gray-600">{item._sum.pagesPrinted} páginas</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4">Por Usuario</h3>
          <div className="space-y-2">
            {report.byUser.slice(0, 10).map((item: any) => (
              <div key={item.usernameWindows} className="flex justify-between border-b pb-2">
                <span className="font-medium">{item.usernameWindows}</span>
                <span className="text-gray-600">{item._sum.pagesPrinted} páginas</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

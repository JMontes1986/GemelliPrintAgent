'use client'

import { useState, useEffect } from 'react'

interface PrintJob {
  id: string
  timestamp: string
  pcName: string
  pcIp: string
  usernameWindows: string
  printerName: string
  documentName: string
  pagesPrinted: number
  copies: number
  status: string
  agent?: {
    area: string | null
    responsable: string | null
  }
}

export default function PrintJobsTable() {
  const [jobs, setJobs] = useState<PrintJob[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    pcIp: '',
    username: '',
    printer: '',
    dateFrom: '',
    dateTo: ''
  })

  useEffect(() => {
    fetchJobs()
  }, [page, filters])

  const fetchJobs = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '50',
      ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
    })

    try {
      const response = await fetch(`/api/print-jobs?${params}`)
      const data = await response.json()
      setJobs(data.jobs)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPage(1)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Impresiones Registradas</h2>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <input
          type="text"
          placeholder="IP del PC"
          value={filters.pcIp}
          onChange={(e) => handleFilterChange('pcIp', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Usuario"
          value={filters.username}
          onChange={(e) => handleFilterChange('username', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Impresora"
          value={filters.printer}
          onChange={(e) => handleFilterChange('printer', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PC</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Impresora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Páginas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(job.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {job.pcName}<br />
                      <span className="text-gray-500 text-xs">{job.pcIp}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{job.usernameWindows}</td>
                    <td className="px-4 py-3 text-sm">{job.printerName}</td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate" title={job.documentName}>
                      {job.documentName}
                    </td>
                    <td className="px-4 py-3 text-sm">{job.pagesPrinted} × {job.copies}</td>
                    <td className="px-4 py-3 text-sm">{job.agent?.area || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        job.status === 'completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { getApiUrl } from '@/lib/api'

interface Printer {
  id: string
  name: string
  model: string | null
  createdAt: string
  totalJobs: number
  lastUsage: {
    timestamp: string
    pcName: string
    pcIp: string
    area: string | null
  } | null
}

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

export default function PrintersManager() {
  const [printers, setPrinters] = useState<Printer[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [model, setModel] = useState('')

  const fetchPrinters = async () => {
    setLoading(true)
    const response = await fetch(getApiUrl('/api/printers'), { cache: 'no-store' })
    if (!response.ok) {
      alert('No se pudo cargar el registro de impresoras.')
      setLoading(false)
      return
    }

    const data = await response.json()
    setPrinters(data.printers || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchPrinters()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const response = await fetch(getApiUrl('/api/printers'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, model })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'No se pudo registrar la impresora.' }))
      alert(`Error: ${error.error}`)
      return
    }

    setName('')
    setModel('')
    await fetchPrinters()
    alert('Impresora registrada/actualizada correctamente.')
  }

  const handleUpdateModel = async (printer: Printer) => {
    const newModel = window.prompt(`Modelo para ${printer.name}:`, printer.model || '')
    if (newModel === null) return

    const response = await fetch(getApiUrl(`/api/printers/${printer.id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: newModel })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'No se pudo actualizar.' }))
      alert(`Error: ${error.error}`)
      return
    }

    await fetchPrinters()
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Registro de impresoras del colegio</h2>
        <p className="text-sm text-gray-500 mt-1">
          Las impresoras también se registran automáticamente cuando llega una impresión nueva.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre de impresora</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Ej: HP-Laser-Secretaría"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Modelo (opcional)</label>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Ej: HP LaserJet Pro M404"
          />
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 h-10">
          Guardar impresora
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Impresora</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modelo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trabajos</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último uso</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última PC origen</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-sm text-gray-500 text-center">Cargando...</td>
              </tr>
            ) : printers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-sm text-gray-500 text-center">Aún no hay impresoras registradas.</td>
              </tr>
            ) : (
              printers.map((printer) => (
                <tr key={printer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{printer.name}</td>
                  <td className="px-4 py-3 text-sm">{printer.model || '-'}</td>
                  <td className="px-4 py-3 text-sm">{printer.totalJobs}</td>
                  <td className="px-4 py-3 text-sm">
                    {printer.lastUsage ? formatDate(printer.lastUsage.timestamp) : 'Sin actividad'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {printer.lastUsage
                      ? `${printer.lastUsage.pcName} (${printer.lastUsage.pcIp})${printer.lastUsage.area ? ` - ${printer.lastUsage.area}` : ''}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleUpdateModel(printer)}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-xs"
                    >
                      Editar modelo
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

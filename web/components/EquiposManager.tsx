'use client'

import { useState, useEffect } from 'react'
import { getApiUrl } from '@/lib/api'

interface Agent {
  id: string
  pcName: string
  pcIp: string
  area: string | null
  responsable: string | null
  isPrimary: boolean
  enabled: boolean
  lastSeen: string | null
  _count: {
    printJobs: number
  }
}

interface Area {
  id: string
  name: string
}

export default function EquiposManager() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newAreaName, setNewAreaName] = useState('')
  const [formData, setFormData] = useState({
    pcName: '',
    pcIp: '',
    area: '',
    responsable: '',
    isPrimary: false
  })

  useEffect(() => {
    fetchAgents()
    fetchAreas()
  }, [])

  const fetchAgents = async () => {
    const response = await fetch(getApiUrl('/api/agents'), { cache: 'no-store' })
    if (!response.ok) {
      alert('No se pudieron cargar los equipos. Recarga la página e inténtalo de nuevo.')
      return
    }
    const data = await response.json()
    setAgents(data.agents || [])
  }

  const fetchAreas = async () => {
    const response = await fetch(getApiUrl('/api/areas'), { cache: 'no-store' })
    if (!response.ok) {
      return
    }
    const data = await response.json()
    setAreas(data.areas || [])
  }

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault()

    const response = await fetch(getApiUrl('/api/areas'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newAreaName })
    })

    if (response.ok) {
      setNewAreaName('')
      fetchAreas()
      alert('Área creada correctamente')
      return
    }

    const error = await response.json()
    alert(`Error: ${error.error}`)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const response = await fetch(getApiUrl('/api/agents/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (response.ok) {
      const data = await response.json()
      alert(`Equipo registrado. Token: ${data.agent.token}`)
      setShowForm(false)
      setFormData({ pcName: '', pcIp: '', area: '', responsable: '', isPrimary: false })
      await fetchAgents()
    } else {
      const error = await response.json()
      alert(`Error: ${error.error}`)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Equipos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : '+ Nuevo Equipo'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-4 rounded-md mb-6 space-y-4">
          <form onSubmit={handleCreateArea} className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Crear área</h3>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Ej: Laboratorio de Cómputo"
                required
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Guardar área
              </button>
            </div>
          </form>

          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold">Registrar equipo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre del PC</label>
              <input
                type="text"
                value={formData.pcName}
                onChange={(e) => setFormData({...formData, pcName: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">IP Fija</label>
              <input
                type="text"
                value={formData.pcIp}
                onChange={(e) => setFormData({...formData, pcIp: e.target.value})}
                placeholder="192.168.1.10"
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Área</label>
              <select
                value={formData.area}
                onChange={(e) => setFormData({...formData, area: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Seleccionar...</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.name}>{area.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Responsable</label>
              <input
                type="text"
                value={formData.responsable}
                onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isPrimary}
                onChange={(e) => setFormData({...formData, isPrimary: e.target.checked})}
                className="mr-2"
              />
              <label className="text-sm">Marcar como PC Principal</label>
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
            >
              Registrar Equipo
            </button>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PC</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsable</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trabajos</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última actividad</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {agents.map((agent) => (
              <tr key={agent.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium">
                  {agent.pcName}
                  {agent.isPrimary && (
                    <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      Principal
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">{agent.pcIp}</td>
                <td className="px-4 py-3 text-sm">{agent.area || '-'}</td>
                <td className="px-4 py-3 text-sm">{agent.responsable || '-'}</td>
                <td className="px-4 py-3 text-sm">{agent._count.printJobs}</td>
                <td className="px-4 py-3 text-sm">
                  {agent.lastSeen ? new Date(agent.lastSeen).toLocaleString() : 'Nunca'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    agent.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {agent.enabled ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

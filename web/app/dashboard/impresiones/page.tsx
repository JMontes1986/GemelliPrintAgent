import PrintJobsTable from '@/components/PrintJobsTable'

export default function ImpresionesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Registro de Impresiones</h1>
      <PrintJobsTable />
    </div>
  )
}

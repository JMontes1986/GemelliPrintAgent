import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center bg-white p-12 rounded-2xl shadow-xl max-w-2xl">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Control Impresiones Gemelli
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Sistema de auditoría de impresión para Windows 11
        </p>
        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="block w-full bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 text-lg font-semibold transition"
          >
            Ir al Dashboard
          </Link>
          <Link
            href="/login"
            className="block w-full bg-gray-100 text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-200 text-lg font-semibold transition"
          >
            Iniciar Sesión
          </Link>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Sistema desplegado correctamente en Vercel ✓
          </p>
        </div>
      </div>
    </main>
  )
}

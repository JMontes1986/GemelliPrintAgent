'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/impresiones', label: 'Impresiones' },
    { href: '/dashboard/equipos', label: 'Equipos' },
    { href: '/dashboard/impresoras', label: 'Impresoras' },
    { href: '/dashboard/usuarios', label: 'Usuarios' },
    { href: '/dashboard/reportes', label: 'Reportes' }
  ]

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold">
              Control Impresiones Gemelli
            </Link>
            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md ${
                    pathname === item.href
                      ? 'bg-blue-700'
                      : 'hover:bg-blue-500'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-blue-700 rounded-md hover:bg-blue-800"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  )
}

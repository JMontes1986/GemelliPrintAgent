export default function UsuariosPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Usuarios y permisos</h1>
        <p className="text-gray-600">
          Crea perfiles para administración general y para el usuario que controla las
          impresiones.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white p-6 rounded-lg shadow space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Crear administrador</h2>
            <p className="text-sm text-gray-500">
              Acceso completo a reportes, configuración y equipos.
            </p>
          </div>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
              <input
                type="text"
                placeholder="Ej: Carla Méndez"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Correo corporativo</label>
              <input
                type="email"
                placeholder="carla@empresa.com"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nivel de acceso</label>
              <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none">
                <option>Administrador principal</option>
                <option>Administrador de operaciones</option>
                <option>Administrador de reportes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mensaje de bienvenida</label>
              <textarea
                rows={3}
                placeholder="Incluye credenciales y políticas de seguridad."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
            >
              Guardar administrador
            </button>
          </form>
        </section>

        <section className="bg-white p-6 rounded-lg shadow space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Crear usuario de impresiones</h2>
            <p className="text-sm text-gray-500">
              Controla trabajos de impresión, colas y autorización de documentos.
            </p>
          </div>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
              <input
                type="text"
                placeholder="Ej: Luis Herrera"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Correo / Usuario</label>
              <input
                type="email"
                placeholder="luis@empresa.com"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Equipo asignado</label>
              <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none">
                <option>Seleccionar equipo</option>
                <option>Impresora HP 01</option>
                <option>Impresora Canon 02</option>
                <option>Impresora Zebra 03</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Permisos</label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" className="rounded border-gray-300" />
                  Aprobar trabajos de impresión
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" className="rounded border-gray-300" />
                  Cancelar trabajos en cola
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" className="rounded border-gray-300" />
                  Ver historial de impresiones
                </label>
              </div>
            </div>
            <button
              type="button"
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
            >
              Guardar usuario
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

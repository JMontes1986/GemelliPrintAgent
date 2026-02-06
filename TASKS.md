# Tareas pendientes

## 404 en despliegue de Vercel

**Problema**: La URL `https://gemelli-print-agent.vercel.app/` responde `404 (Not Found)` en producción.

**Objetivo**: Restaurar el acceso a la raíz (`/`) y validar que el App Router de Next.js publique la página de inicio esperada.

**Checklist**
- [ ] Verificar que el proyecto en Vercel apunte al root correcto y que el build use `web/` como app Next.js.
- [ ] Revisar `vercel.json` y la configuración del proyecto para confirmar el `Root Directory` y `Build Command`.
- [ ] Confirmar que `web/app/page.tsx` se incluya en el build (App Router habilitado).
- [ ] Revisar logs de despliegue en Vercel para identificar errores de build o rutas.
- [ ] Validar variables de entorno requeridas en Vercel.
- [ ] Ejecutar un redeploy y probar `GET /` en producción.

**Criterio de éxito**: La ruta `https://gemelli-print-agent.vercel.app/` responde `200` y muestra la página de inicio de Gemelli.

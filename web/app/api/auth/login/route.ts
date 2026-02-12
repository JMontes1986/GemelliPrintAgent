import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          error:
            'La variable DATABASE_URL no está configurada. Verifica las variables de entorno.'
        },
        { status: 500 }
      )
    }
    
    const { email, password } = await request.json()

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const isValid = await comparePassword(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })

  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      if (error.message.includes('Tenant or user not found')) {
        return NextResponse.json(
          {
            error:
              'Supabase rechazó las credenciales de conexión (Tenant o usuario no encontrado). Verifica que el usuario en DATABASE_URL sea postgres.<project-ref> y agrega sslmode=require.'
          },
          { status: 500 }
        )
      }
      
      const errorCode = error.errorCode
      const errorMessage =
        errorCode === 'P1000'
          ? 'Credenciales inválidas para la base de datos. Verifica usuario y contraseña.'
          : errorCode === 'P1001'
            ? 'No se pudo alcanzar la base de datos. Revisa la conectividad y las reglas de red.'
            : errorCode === 'P1002'
              ? 'Tiempo de espera al conectar a la base de datos. Verifica el pool y la latencia.'
              : errorCode === 'P1003'
                ? 'La base de datos indicada no existe. Revisa el nombre en la URL de conexión.'
                : errorCode === 'P1010'
                  ? 'El usuario no tiene permisos para la base de datos. Revisa los roles.'
                  : errorCode === 'P1011'
                    ? 'No fue posible abrir la conexión con la base de datos. Verifica el host y el puerto.'
                    : 'No fue posible conectar con la base de datos. Verifica la configuración.'

      console.error('Database initialization error:', {
        code: errorCode,
        message: error.message
      })

      return NextResponse.json(
        { error: errorMessage, code: errorCode ?? 'UNKNOWN' },
        { status: 500 }
      )
    }
    
    if (error instanceof Error && error.message.includes('Tenant or user not found')) {
      return NextResponse.json(
        {
          error:
            'Supabase rechazó las credenciales de conexión (Tenant o usuario no encontrado). Verifica que el usuario en DATABASE_URL sea postgres.<project-ref> y agrega sslmode=require.'
        },
        { status: 500 }
      )
    }
    
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

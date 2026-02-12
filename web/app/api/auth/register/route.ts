import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'
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
    
    let payload: { name?: string; email?: string; password?: string }

    try {
      payload = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'El cuerpo de la solicitud no es válido' },
        { status: 400 }
      )
    }

    const name = payload.name?.trim()
    const email = payload.email?.trim().toLowerCase()
    const password = payload.password

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    })

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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este email' },
          { status: 409 }
        )
      }

      if (error.code === 'P2021' || error.code === 'P2022') {
        return NextResponse.json(
          {
            error:
              'La base de datos no está sincronizada con el esquema. Ejecuta las migraciones.'
          },
          { status: 500 }
        )
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        { error: 'Los datos enviados no son válidos' },
        { status: 400 }
      )
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
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
    
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
      const errorCode = error.errorCode
      const errorMessage =
        errorCode === 'P1001'
          ? 'No se pudo alcanzar la base de datos. Revisa la conectividad y las reglas de red.'
          : errorCode === 'P1002'
            ? 'Tiempo de espera al conectar a la base de datos. Verifica el pool y la latencia.'
            : 'No fue posible conectar con la base de datos. Verifica la configuración.'

      console.error('Database initialization error:', {
        code: errorCode,
        message: error.message
      })

      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
    
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

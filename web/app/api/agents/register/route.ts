import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pcName, pcIp, area, responsable, isPrimary } = body

    if (!pcName || !pcIp) {
      return NextResponse.json(
        { error: 'pcName y pcIp son requeridos' },
        { status: 400 }
      )
    }

    // Si isPrimary, desmarcar otros
    if (isPrimary) {
      await prisma.agent.updateMany({
        where: { isPrimary: true },
        data: { isPrimary: false }
      })
    }

    const token = crypto.randomBytes(32).toString('hex')

    const agent = await prisma.agent.create({
      data: {
        pcName,
        pcIp,
        area,
        responsable,
        isPrimary: isPrimary || false,
        token
      }
    })

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        pcName: agent.pcName,
        pcIp: agent.pcIp,
        token: agent.token
      }
    })

  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'IP ya registrada' },
        { status: 409 }
      )
    }
    console.error('Error registering agent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

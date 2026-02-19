import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const agent = await prisma.agent.findUnique({
      where: { token }
    })

    if (!agent) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    await prisma.agent.update({
      where: { token },
      data: { lastSeen: new Date() }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Heartbeat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

function sanitizeFileSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        pcName: true,
        token: true
      }
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const msiUrl = process.env.AGENT_MSI_URL || `${appUrl}/downloads/GemelliPrintAgent.msi`

    const msiResponse = await fetch(msiUrl, { cache: 'no-store' })

    if (!msiResponse.ok) {
      console.error('No se pudo obtener el MSI:', msiResponse.status, msiUrl)
      return NextResponse.json(
        { error: 'No se pudo descargar el instalador MSI. Verifica AGENT_MSI_URL.' },
        { status: 500 }
      )
    }

    const msiBuffer = await msiResponse.arrayBuffer()
    const filename = `GemelliPrintAgent-${sanitizeFileSegment(agent.pcName) || agent.id}.msi`

    return new NextResponse(msiBuffer, {
      headers: {
        'Content-Type': 'application/x-msdownload',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Agent-Token': agent.token,
        'X-Agent-Name': agent.pcName
      }
    })
  } catch (error) {
    console.error('Error generating MSI installer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const printers = await prisma.printer.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { printJobs: true } },
        printJobs: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: {
            timestamp: true,
            pcName: true,
            pcIp: true,
            agent: { select: { area: true } }
          }
        }
      }
    })

    const mappedPrinters = printers.map((printer) => {
      const lastJob = printer.printJobs[0]
      const connection = (printer as { connection?: string | null }).connection ?? null
      
      return {
        id: printer.id,
        name: printer.name,
        model: printer.model,
        connection,
        createdAt: printer.createdAt,
        totalJobs: printer._count.printJobs,
        lastUsage: lastJob
          ? {
              timestamp: lastJob.timestamp,
              pcName: lastJob.pcName,
              pcIp: lastJob.pcIp,
              area: lastJob.agent?.area ?? null
            }
          : null
      }
    })

    return NextResponse.json({ printers: mappedPrinters })
  } catch (error) {
    console.error('Error fetching printers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = body.name?.trim()
    const model = body.model?.trim() || null
    const connection = body.connection?.trim() || null
    
    if (!name) {
      return NextResponse.json({ error: 'El nombre de la impresora es obligatorio.' }, { status: 400 })
    }

    const createData: Record<string, string | null> = { name, model }
    const updateData: Record<string, string | null> = { model }

    if (typeof body.connection === 'string') {
      createData.connection = connection
      updateData.connection = connection
    }
    
    const printer = await prisma.printer.upsert({
      where: { name },
      create: createData as never,
      update: updateData as never
    })

    return NextResponse.json({ printer })
  } catch (error) {
    console.error('Error creating/updating printer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

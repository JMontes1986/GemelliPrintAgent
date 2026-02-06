import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateAgentToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token || !validateAgentToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jobs } = body

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const results = []

    for (const job of jobs) {
      // Verificar si el agente existe
      let agent = await prisma.agent.findUnique({
        where: { pcIp: job.pcIp }
      })

      if (!agent) {
        // Registrar dispositivo desconocido
        await prisma.unknownDevice.upsert({
          where: { pcIp: job.pcIp },
          create: {
            pcIp: job.pcIp,
            pcName: job.pcName,
            jobCount: 1
          },
          update: {
            pcName: job.pcName,
            lastSeen: new Date(),
            jobCount: { increment: 1 }
          }
        })
      } else {
        // Actualizar last_seen
        await prisma.agent.update({
          where: { id: agent.id },
          data: { lastSeen: new Date() }
        })
      }

      // Crear o actualizar impresora
      await prisma.printer.upsert({
        where: { name: job.printerName },
        create: { name: job.printerName },
        update: {}
      })

      // Crear print job
      const printJob = await prisma.printJob.create({
        data: {
          timestamp: new Date(job.timestamp),
          pcName: job.pcName,
          pcIp: job.pcIp,
          usernameWindows: job.usernameWindows,
          printerName: job.printerName,
          jobId: job.jobId,
          documentName: job.documentName || 'N/D',
          pagesPrinted: job.pagesPrinted || 0,
          copies: job.copies || 1,
          duplex: job.duplex,
          color: job.color,
          status: job.status || 'submitted'
        }
      })

      results.push(printJob.id)
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      ids: results
    })

  } catch (error) {
    console.error('Error processing print jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const pcIp = searchParams.get('pcIp')
    const username = searchParams.get('username')
    const printer = searchParams.get('printer')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const skip = (page - 1) * limit

    const where: any = {}
    if (pcIp) where.pcIp = pcIp
    if (username) where.usernameWindows = { contains: username }
    if (printer) where.printerName = { contains: printer }
    if (dateFrom || dateTo) {
      where.timestamp = {}
      if (dateFrom) where.timestamp.gte = new Date(dateFrom)
      if (dateTo) where.timestamp.lte = new Date(dateTo)
    }

    const [jobs, total] = await Promise.all([
      prisma.printJob.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          agent: { select: { area: true, responsable: true } }
        }
      }),
      prisma.printJob.count({ where })
    ])

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching print jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

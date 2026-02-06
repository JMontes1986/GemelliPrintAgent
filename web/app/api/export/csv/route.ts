import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: any = {}
    if (dateFrom || dateTo) {
      where.timestamp = {}
      if (dateFrom) where.timestamp.gte = new Date(dateFrom)
      if (dateTo) where.timestamp.lte = new Date(dateTo)
    }

    const jobs = await prisma.printJob.findMany({
      where,
      orderBy: { timestamp: 'desc' }
    })

    const csv = [
      'Fecha,Hora,PC,IP,Usuario,Impresora,Documento,Páginas,Copias,Estado',
      ...jobs.map(j => [
        new Date(j.timestamp).toLocaleDateString(),
        new Date(j.timestamp).toLocaleTimeString(),
        j.pcName,
        j.pcIp,
        j.usernameWindows,
        j.printerName,
        `"${j.documentName}"`,
        j.pagesPrinted,
        j.copies,
        j.status
      ].join(','))
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="impresiones_${Date.now()}.csv"`
      }
    })

  } catch (error) {
    console.error('Error exporting CSV:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

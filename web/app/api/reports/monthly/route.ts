import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const [totalJobs, totalPages, byAgent, byPrinter, byUser] = await Promise.all([
      prisma.printJob.count({
        where: {
          timestamp: { gte: startDate, lte: endDate }
        }
      }),
      prisma.printJob.aggregate({
        where: {
          timestamp: { gte: startDate, lte: endDate }
        },
        _sum: { pagesPrinted: true }
      }),
      prisma.printJob.groupBy({
        by: ['pcIp'],
        where: {
          timestamp: { gte: startDate, lte: endDate }
        },
        _count: { id: true },
        _sum: { pagesPrinted: true }
      }),
      prisma.printJob.groupBy({
        by: ['printerName'],
        where: {
          timestamp: { gte: startDate, lte: endDate }
        },
        _count: { id: true },
        _sum: { pagesPrinted: true }
      }),
      prisma.printJob.groupBy({
        by: ['usernameWindows'],
        where: {
          timestamp: { gte: startDate, lte: endDate }
        },
        _count: { id: true },
        _sum: { pagesPrinted: true }
      })
    ])

    return NextResponse.json({
      period: { year, month },
      summary: {
        totalJobs,
        totalPages: totalPages._sum.pagesPrinted || 0
      },
      byAgent,
      byPrinter,
      byUser
    })

  } catch (error) {
    console.error('Error generating monthly report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

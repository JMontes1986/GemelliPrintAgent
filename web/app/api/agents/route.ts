import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { isPrimary: 'desc' },
      include: {
        _count: {
          select: { printJobs: true }
        }
      }
    })

    return NextResponse.json({ agents })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

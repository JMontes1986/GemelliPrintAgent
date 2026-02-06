import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const unknownDevices = await prisma.unknownDevice.findMany({
      orderBy: { lastSeen: 'desc' }
    })

    return NextResponse.json({ devices: unknownDevices })
  } catch (error) {
    console.error('Error fetching unknown devices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

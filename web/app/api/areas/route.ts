import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [areas, usedAreas] = await Promise.all([
      prisma.area.findMany({
        orderBy: { name: 'asc' }
      }),
      prisma.agent.findMany({
        where: {
          area: {
            not: null
          }
        },
        distinct: ['area'],
        select: { area: true }
      })
    ])

    const normalizedUsedAreas = usedAreas
      .map((agent) => agent.area?.trim())
      .filter((area): area is string => Boolean(area))

    const areaNames = new Set(areas.map((area) => area.name))

    const missingAreas = normalizedUsedAreas
      .filter((name) => !areaNames.has(name))
      .map((name) => ({ id: `legacy-${name}`, name }))

    return NextResponse.json({
      areas: [...areas, ...missingAreas].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    })
  } catch (error) {
    console.error('Error fetching areas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = body?.name?.trim()

    if (!name) {
      return NextResponse.json({ error: 'El nombre del área es requerido' }, { status: 400 })
    }

    const area = await prisma.area.create({
      data: { name }
    })

    return NextResponse.json({ success: true, area }, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El área ya existe' }, { status: 409 })
    }

    console.error('Error creating area:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const AREA_TABLE_MISSING_ERROR_CODE = 'P2021'

const ensureAreaTableExists = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Area" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL UNIQUE,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "Area_name_idx" ON "Area"("name");'
  )
}

export async function GET() {
  try {
    const usedAreas = await prisma.agent.findMany({
      where: {
        area: {
          not: null
        }
      },
      distinct: ['area'],
      select: { area: true }
    })

    let areas: { id: string; name: string }[] = []

    try {
      areas = await prisma.area.findMany({
        orderBy: { name: 'asc' }
      })
    } catch (error: any) {
      if (error?.code !== AREA_TABLE_MISSING_ERROR_CODE) {
        throw error
      }
    }
    
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

    let area

    try {
      area = await prisma.area.create({
        data: { name }
      })
    } catch (error: any) {
      if (error?.code !== AREA_TABLE_MISSING_ERROR_CODE) {
        throw error
      }

      await ensureAreaTableExists()

      area = await prisma.area.create({
        data: { name }
      })
    }

    return NextResponse.json({ success: true, area }, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El área ya existe' }, { status: 409 })
    }

    console.error('Error creating area:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

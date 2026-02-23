import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Params {
  params: {
    id: string
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json()
    const model = body.model?.trim() || null
    const connection = body.connection?.trim() || null

    const data: Record<string, string | null> = { model }
    if (typeof body.connection === 'string') {
      data.connection = connection
    }
        
    const printer = await prisma.printer.update({
      where: { id: params.id },
      data: data as never
    })

    return NextResponse.json({ printer })
  } catch (error) {
    console.error('Error updating printer:', error)
    return NextResponse.json(
      { error: 'No se pudo actualizar la impresora.' },
      { status: 400 }
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const printer = await prisma.printer.findUnique({
      where: { id: params.id },
      select: { name: true }
    })

    if (!printer) {
      return NextResponse.json({ error: 'Impresora no encontrada.' }, { status: 404 })
    }

    const jobsUsingPrinter = await prisma.printJob.count({
      where: { printerName: printer.name }
    })

    if (jobsUsingPrinter > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una impresora con trabajos registrados.' },
        { status: 400 }
      )
    }

    await prisma.printer.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting printer:', error)
    return NextResponse.json(
      { error: 'No se pudo eliminar la impresora.' },
      { status: 400 }
    )
  }
}

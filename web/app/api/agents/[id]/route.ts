import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const agent = await prisma.agent.findUnique({
      where: { id },
      select: { id: true, pcIp: true, _count: { select: { printJobs: true } } }
    })

    if (!agent) {
      return NextResponse.json({ error: 'Equipo no encontrado.' }, { status: 404 })
    }

    if (agent._count.printJobs > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar porque tiene trabajos de impresión asociados.' },
        { status: 409 }
      )
    }

    await prisma.agent.delete({ where: { id: agent.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting agent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

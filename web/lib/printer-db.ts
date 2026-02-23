import { Prisma } from '@prisma/client'

export function isMissingPrinterConnectionColumn(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code !== 'P2022') {
      return false
    }

    const column = (error.meta as { column?: unknown } | undefined)?.column
    if (typeof column === 'string') {
      return column.toLowerCase().includes('connection')
    }

    return error.message.toLowerCase().includes('connection')
  }

  if (error instanceof Error) {
    return error.message.toLowerCase().includes('connection')
  }

  return false
}

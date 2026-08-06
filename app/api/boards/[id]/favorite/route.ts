import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { orgId } = body

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 })
    }

    const board = await prisma.board.findUnique({
      where: { id },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    const existingFavorite = await prisma.userFavorite.findUnique({
      where: {
        userId_boardId_orgId: {
          userId,
          boardId: id,
          orgId,
        },
      },
    })

    if (existingFavorite) {
      return NextResponse.json({ error: 'Already favorited' }, { status: 400 })
    }

    await prisma.userFavorite.create({
      data: {
        userId,
        boardId: id,
        orgId,
      },
    })

    return NextResponse.json(board)
  } catch (error) {
    logger.error('boards', 'favorite_failed', { error: logger.errorKind(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const board = await prisma.board.findUnique({
      where: { id },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    const favorite = await prisma.userFavorite.findFirst({
      where: {
        userId,
        boardId: id,
      },
    })

    if (!favorite) {
      return NextResponse.json({ error: 'Not favorited' }, { status: 400 })
    }

    await prisma.userFavorite.delete({
      where: { id: favorite.id },
    })

    return NextResponse.json(board)
  } catch (error) {
    logger.error('boards', 'unfavorite_failed', { error: logger.errorKind(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

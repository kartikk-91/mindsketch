import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const board = await prisma.board.findUnique({
      where: { id },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    if (!orgId || board.orgId !== orgId) {
      return NextResponse.json(
        { error: 'You are not a member of this board\'s organization.' },
        { status: 403 }
      )
    }

    return NextResponse.json(board)
  } catch (error) {
    logger.error('boards', 'get_failed', { error: logger.errorKind(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingBoard = await prisma.board.findUnique({ where: { id } })
    if (!existingBoard) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    if (!orgId || existingBoard.orgId !== orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { title, touch } = body

    if (touch === true) {
      const board = await prisma.board.update({ where: { id }, data: { updatedAt: new Date() } })
      return NextResponse.json(board)
    }

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      return NextResponse.json(
        { error: 'Title cannot be empty' },
        { status: 400 }
      )
    }

    if (trimmedTitle.length > 60) {
      return NextResponse.json(
        { error: 'Title is too long' },
        { status: 400 }
      )
    }

    const board = await prisma.board.update({
      where: { id },
      data: { title: trimmedTitle },
    })

    return NextResponse.json(board)
  } catch (error) {
    logger.error('boards', 'update_failed', { error: logger.errorKind(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const board = await prisma.board.findUnique({ where: { id } })
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    if (!orgId || board.orgId !== orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.userFavorite.deleteMany({
      where: { boardId: id },
    })

    await prisma.board.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('boards', 'delete_failed', { error: logger.errorKind(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

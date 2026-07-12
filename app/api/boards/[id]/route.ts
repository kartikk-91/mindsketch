import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(
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

    return NextResponse.json(board)
  } catch (error) {
    console.error('Error fetching board:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
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
    const { title } = body

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
    console.error('Error updating board:', error)
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

    await prisma.userFavorite.deleteMany({
      where: { boardId: id },
    })

    await prisma.board.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting board:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
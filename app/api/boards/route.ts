import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

const PLACEHOLDER_IMAGES = [
  '/placeholder/1.svg',
  '/placeholder/2.svg',
  '/placeholder/3.svg',
  '/placeholder/4.svg',
  '/placeholder/5.svg',
  '/placeholder/6.svg',
  '/placeholder/7.svg',
  '/placeholder/8.svg',
  '/placeholder/9.svg',
  '/placeholder/10.svg',
  '/placeholder/11.svg',
  '/placeholder/12.svg',
  '/placeholder/13.svg',
  '/placeholder/14.svg',
  '/placeholder/15.svg',
  '/placeholder/16.svg',
  '/placeholder/17.svg',
]

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const orgId = searchParams.get('orgId')
    const search = searchParams.get('search')
    const favorites = searchParams.get('favorites') === 'true'

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 })
    }

    if (favorites) {
      const favoritedBoards = await prisma.userFavorite.findMany({
        where: {
          userId,
          orgId,
        },
        include: {
          board: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json(
        favoritedBoards.map((fb) => ({ ...fb.board, isFavorite: true }))
      )
    }

    let boards

    if (search) {
      boards = await prisma.board.findMany({
        where: {
          orgId,
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    } else {
      boards = await prisma.board.findMany({
        where: {
          orgId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    }

    const boardsWithFavorites = await Promise.all(
      boards.map(async (board) => {
        const favorite = await prisma.userFavorite.findUnique({
          where: {
            userId_boardId_orgId: {
              userId,
              boardId: board.id,
              orgId,
            },
          },
        })
        return { ...board, isFavorite: !!favorite }
      })
    )

    return NextResponse.json(boardsWithFavorites)
  } catch (error) {
    console.error('Error fetching boards:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { orgId, title, templateId } = body

    if (!orgId || !title) {
      return NextResponse.json(
        { error: 'orgId and title are required' },
        { status: 400 }
      )
    }

    const user = await currentUser()
    const imageUrl =
      PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)]

    const authorName =
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.firstName || user?.username || 'Unknown'

    const board = await prisma.board.create({
      data: {
        title,
        orgId,
        authorId: userId,
        authorName,
        imageUrl,
        templateId,
      },
    })

    return NextResponse.json(board, { status: 201 })
  } catch (error) {
    console.error('Error creating board:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
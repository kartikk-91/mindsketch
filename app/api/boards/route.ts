import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { resolveBoardAppearance } from '@/lib/board-appearance'
import { logger } from '@/lib/logger'
import fs from 'fs'
import path from 'path'

const placeholderDir = path.join(process.cwd(), 'public', 'placeholder')

function getRandomPlaceholderImage() {
  const images = fs
    .readdirSync(placeholderDir)
    .filter((file) => /\.(png|jpg|jpeg|webp|svg)$/i.test(file))

  if (images.length === 0) {
    throw new Error('No placeholder images found.')
  }

  return `/placeholder/${images[Math.floor(Math.random() * images.length)]}`
}

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
          board: { updatedAt: 'desc' },
        },
      })

      return NextResponse.json(
        favoritedBoards.map((fb) => ({ ...fb.board, isFavorite: true }))
      )
    }

    const boards = await prisma.board.findMany({
      where: {
        orgId,
        ...(search
          ? {
              title: {
                contains: search,
                mode: 'insensitive',
              },
            }
          : {}),
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

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

        return {
          ...board,
          isFavorite: !!favorite,
        }
      })
    )

    return NextResponse.json(boardsWithFavorites)
  } catch (error) {
    logger.error('boards', 'list_failed', { error: logger.errorKind(error) })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { orgId, title, templateId, backgroundPattern, colorTheme } = body

    if (!orgId || !title) {
      return NextResponse.json(
        { error: 'orgId and title are required' },
        { status: 400 }
      )
    }

    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    const imageUrl = getRandomPlaceholderImage()

    const authorName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.username || 'Unknown'

    const appearance = resolveBoardAppearance(
      backgroundPattern,
      colorTheme
    )

    const board = await prisma.board.create({
      data: {
        title,
        orgId,
        authorId: userId,
        authorName,
        imageUrl,
        templateId,
        backgroundPattern: appearance.backgroundPattern,
        colorTheme: appearance.colorTheme,
      },
    })

    return NextResponse.json(board, { status: 201 })
  } catch (error) {
    logger.error('boards', 'create_failed', { error: logger.errorKind(error) })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

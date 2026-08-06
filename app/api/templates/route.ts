import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(templates)
  } catch (error) {
    logger.error('templates', 'list_failed', { error: logger.errorKind(error) })
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
    const { name, thumbnail, snapshot } = body

    if (!name || !thumbnail || !snapshot) {
      return NextResponse.json(
        { error: 'name, thumbnail, and snapshot are required' },
        { status: 400 }
      )
    }

    const template = await prisma.template.create({
      data: {
        name,
        thumbnail,
        snapshot,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    logger.error('templates', 'create_failed', { error: logger.errorKind(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

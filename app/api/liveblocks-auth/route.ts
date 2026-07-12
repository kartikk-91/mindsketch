import { Liveblocks } from "@liveblocks/node";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET!,
});

export async function POST(request: Request) {
    const authorization = await auth();
    const user = await currentUser();

    if (!authorization || !user) {
        return new Response("Unauthorized", {
            status: 403,
        });
    }

    const { room } = await request.json();
    const board = await prisma.board.findUnique({
        where: { id: room },
    });

    if (board?.orgId !== authorization.orgId) {
        return new Response("Unauthorized", {
            status: 403,
        });
    }

    const userInfo = {
        name: user.firstName || "Anonymous",
        picture: user.imageUrl
    };

    const session = liveblocks.prepareSession(
        user.id,
        { userInfo }
    );

    if (room) {
        session.allow(room, session.FULL_ACCESS);
    }

    const { status, body } = await session.authorize();
    return new Response(body, { status });
}


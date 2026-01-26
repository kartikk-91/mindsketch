"use client";

import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "convex/react";
import Image from "next/image";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Hint } from "@/components/hint";
import { useRenameModal } from "@/store/use-rename-modal";
import { Actions } from "@/components/actions";
import {  Menu } from "lucide-react";




const TabSeparator = () => {
    return (
        <div className="text-neutral-300 px-1.5" >
            |
        </div>
    )
}

interface InfoProps {
    boardId: string;

}

export const Info = (
    { boardId }: InfoProps
) => {
    const { onOpen } = useRenameModal()
    const data = useQuery(api.board.get, {
        id: boardId as Id<"boards">,
    })

    if (!data) {
        return <Info.Skeleton />
    }

    return (
        <div className="absolute top-2 left-2 bg-white rounded-md px-1.5 h-12 flex items-center shadow-md ">
            <Hint label="Go to boards"
                side="bottom"
                sideOffset={10}
            >
                <Button asChild className="px-2" variant={"board"}
                >
                    <Link href={"/"}>
                        <Image
                            src={"/logo.png"}
                            alt="Logo"
                            width={150}
                            height={40}
                        />
                    </Link>
                </Button>
            </Hint>
            <TabSeparator />
            <Hint label="Edit title " side="bottom" sideOffset={10}>
                <Button onClick={() => { onOpen(data._id, data.title) }} variant={"board"} className="text-base font-normal px-2">
                    {data.title}
                </Button>
            </Hint>
            <TabSeparator />

            <Actions id={data._id} title={data.title} side="bottom" sideOffset={10}>
                <div>
                    <Hint label="Main menu" side="bottom" sideOffset={10}>
                        <Button size={"icon"} variant={"board"}>
                            <Menu/>
                        </Button>
                    </Hint>
                </div>
            </Actions>
        </div>
    )
}

Info.Skeleton = function InfoSkeleton() {
    return (
        <div className="absolute w-[300px] top-2 left-2 bg-white rounded-md px-1.5 h-12 flex items-center shadow-md ">
            <Skeleton className="h-full w-full bg-muted-400" />
        </div>
    )
}

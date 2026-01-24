"use client";
import { Skeleton } from "@/components/ui/skeleton"
import { useOthers, useSelf } from "@liveblocks/react";
import { UserAvatar } from "./user-avatar";
import { connectionIdToColor } from "@/lib/utils";

const MAX_SHOWN_USERS = 2;

export const Participants = () => {
    const users = useOthers();
    const currentUser = useSelf();
    const hasMoreUsers = users.length > MAX_SHOWN_USERS;
    return (
        <div className="absolute top-2 right-2 bg-white rounded-md p-3 h-12 flex items-center shadow-md ">
            <div
                className="flex gap-x-2"
            >
                {users.slice(0, MAX_SHOWN_USERS).map(({ connectionId, info }) => {
                    return (
                        <UserAvatar
                            key={connectionId}
                            src={info?.picture}
                            name={info?.name}
                            fallback={info?.name?.[0] || 'T'}
                            borderColor={connectionIdToColor(connectionId)}
                        />
                    )
                })}
                {
                    currentUser && (
                        <UserAvatar
                            src={currentUser.info?.picture}
                            name={currentUser.info?.name}
                            fallback={currentUser.info?.name?.[0] || 'T'}
                            borderColor={connectionIdToColor(currentUser.connectionId)}
                        />
                    )
                }
                {
                    hasMoreUsers && (
                        <UserAvatar
                            name={`${users.length - MAX_SHOWN_USERS} more`}
                            fallback={`+${users.length - MAX_SHOWN_USERS}`}
                        />
                    )

                }

            </div>
        </div>
    )
}

Participants.Skeleton = function ParticipantsSkeleton() {
    return (
        <div className="absolute w-[300px] top-2 right-2 bg-white rounded-md p-3 h-12 flex items-center shadow-md ">
            <Skeleton className="h-full w-full bg-muted-400" />
        </div>
    )
}
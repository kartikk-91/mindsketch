"use client";

import { useState } from "react";
import { useOthers, useSelf } from "@liveblocks/react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "./user-avatar";
import { connectionIdToColor, cn } from "@/lib/utils";
import { ChevronUp } from "lucide-react";

export const Participants = () => {
  const users = useOthers();
  const currentUser = useSelf();
  const [open, setOpen] = useState(false);

  const totalUsers = users.length + (currentUser ? 1 : 0);

  if (totalUsers === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-12 right-0 w-[260px] rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="px-4 py-2 text-sm font-medium text-slate-700 border-b">
            Participants ({totalUsers})
          </div>

          <div className="max-h-[240px] overflow-y-auto px-2 py-2 space-y-1">
            {users.map(({ connectionId, info }) => (
              <ParticipantRow
                key={connectionId}
                name={info?.name}
                src={info?.picture}
                color={connectionIdToColor(connectionId)}
              />
            ))}

            {currentUser && (
              <ParticipantRow
                name={`${currentUser.info?.name ?? "You"} (You)`}
                src={currentUser.info?.picture}
                color={connectionIdToColor(currentUser.connectionId)}
              />
            )}
          </div>
        </div>
      )}

      {/* Trigger pill */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-md transition hover:bg-slate-50",
          open && "shadow-lg"
        )}
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500" />

        <span className="text-sm font-medium text-slate-700">
          {totalUsers} online
        </span>

        <ChevronUp
          className={cn(
            "h-4 w-4 text-slate-500 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
    </div>
  );
};

/* ---------------- Participant Row ---------------- */

type ParticipantRowProps = {
  name?: string;
  src?: string;
  color?: string;
};

const ParticipantRow = ({ name, src, color }: ParticipantRowProps) => {
  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50">
      <UserAvatar
        src={src}
        name={name}
        fallback={name?.[0] ?? "?"}
        borderColor={color}
      />
      <span className="text-sm text-slate-700 truncate">
        {name ?? "Anonymous"}
      </span>
    </div>
  );
};

Participants.Skeleton = function ParticipantsSkeleton() {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <Skeleton className="h-10 w-[120px] rounded-full" />
      </div>
    );
  };
  
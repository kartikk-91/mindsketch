"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Star, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { useState } from "react";

import { Actions } from "@/components/actions";
import { useFavoriteBoard } from "@/hooks/use-favorite-board";
import { cn } from "@/lib/utils";

interface Board {
  id: string;
  title: string;
  imageUrl: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  orgId: string;
  isFavorite: boolean;
}

interface RecentSectionProps {
  boards: Board[];
}

export const RecentSection = ({ boards }: RecentSectionProps) => {
  if (boards.length === 0) return null;

  const recent = boards.slice(0, 4);

  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[22px] font-bold text-[#181C31] tracking-tight">
            Continue where you left off
          </h2>
          <p className="text-sm text-[#696969] mt-1">
            Jump back into your most recent boards
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <RecentCard
          board={recent[0]}
          variant="lead"
        />

        
        <div className="grid grid-rows-2 gap-4">
          {recent.slice(1, 3).map((board) => (
            <RecentCard
              key={board.id}
              board={board}
              variant="secondary"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

type RecentCardVariant = "lead" | "secondary";

const RecentCard = ({
  board,
  variant,
}: {
  board: Board;
  variant: RecentCardVariant;
}) => {
  const { userId } = useAuth();
  const { favorite, unfavorite } = useFavoriteBoard();
  const [pendingFav, setPendingFav] = useState(false);

  const authorLabel = userId === board.authorId ? "You" : board.authorName;
  const timeLabel = formatDistanceToNow(new Date(board.createdAt), {
    addSuffix: true,
  });

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingFav(true);
    try {
      if (board.isFavorite) {
        await unfavorite(board.id);
      } else {
        await favorite(board.id, board.orgId);
      }
    } catch {
      toast.error(
        board.isFavorite ? "Failed to unfavorite" : "Failed to favorite"
      );
    } finally {
      setPendingFav(false);
    }
  };

  const isLead = variant === "lead";

  return (
    <Link
      href={`/board/${board.id}`}
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden border border-[#EEEEEE] bg-white transition-all duration-200 hover:border-[#20C5A8]/30 hover:shadow-[0_4px_24px_rgba(32,197,168,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20C5A8] focus-visible:ring-offset-2",
        isLead ? "md:col-span-2" : ""
      )}
    >
      
      <div
        className={cn(
          "relative w-full overflow-hidden bg-[#F1FEE1]",
          isLead ? "aspect-[21/9]" : "aspect-[3/1]"
        )}
      >
        <Image
          src={board.imageUrl}
          alt={board.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />

        
        <Actions id={board.id} title={board.title} side="right">
          <button
            className={cn(
              "absolute top-2.5 right-2.5 p-2 rounded-lg bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white",
              "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20C5A8]"
            )}
          >
            <MoreHorizontal className="h-4 w-4 text-[#696969]" />
          </button>
        </Actions>
      </div>

      
      <div className="flex items-center justify-between px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-[#181C31] truncate">
            {board.title}
          </p>
          <p className="text-xs text-[#696969] mt-0.5">
            {authorLabel} &middot; {timeLabel}
          </p>
        </div>

        <button
          onClick={toggleFav}
          disabled={pendingFav}
          className={cn(
            "ml-3 p-1.5 rounded-lg transition-colors",
            "hover:bg-[#F1FEE1]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20C5A8]",
            pendingFav && "opacity-50 cursor-not-allowed"
          )}
          aria-label={board.isFavorite ? "Unfavorite" : "Favorite"}
        >
          <Star
            className={cn(
              "h-4 w-4 transition-colors",
              board.isFavorite
                ? "fill-[#FFB800] text-[#FFB800]"
                : "text-[#DDDDDD] group-hover:text-[#999AA1]"
            )}
          />
        </button>
      </div>
    </Link>
  );
};
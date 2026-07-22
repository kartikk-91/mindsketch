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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Board {
  id: string;
  title: string;
  imageUrl: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  isFavorite: boolean;
}

interface BoardGridProps {
  title: string;
  subtitle?: string;
  boards: Board[];
  showCreateSlot?: boolean;
  createSlot?: React.ReactNode;
}

export const BoardGrid = ({
  title,
  subtitle,
  boards,
  showCreateSlot,
  createSlot,
}: BoardGridProps) => {
  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[22px] font-bold text-[#181C31] tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-[#696969] mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
        {showCreateSlot && createSlot && (
          <div className="col-span-1">{createSlot}</div>
        )}

        {boards.map((board) => (
          <GridCard key={board.id} board={board} />
        ))}
      </div>
    </section>
  );
};

const GridCard = ({ board }: { board: Board }) => {
  const { userId } = useAuth();
  const { favorite, unfavorite } = useFavoriteBoard();
  const [pendingFav, setPendingFav] = useState(false);

  const authorLabel = userId === board.authorId ? "You" : board.authorName;
  const timeLabel = formatDistanceToNow(new Date(board.updatedAt), {
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

  return (
    <Link
      href={`/board/${board.id}`}
      className={cn(
        "group flex flex-col rounded-xl overflow-hidden border border-[#EEEEEE] bg-white",
        "transition-all duration-200 hover:border-[#20C5A8]/30 hover:shadow-[0_4px_16px_rgba(32,197,168,0.06)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20C5A8] focus-visible:ring-offset-2"
      )}
    >
      
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F1FEE1]">
        <Image
          src={"/placeholder/1.png"}
          alt={board.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />

       
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />

        <Actions id={board.id} title={board.title} side="right">
          <button
            className={cn(
              "absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-white/85 backdrop-blur-sm",
              "opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white",
              "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20C5A8]"
            )}
          >
            <MoreHorizontal className="h-3.5 w-3.5 text-[#696969]" />
          </button>
        </Actions>
      </div>

     
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[#181C31] truncate leading-tight">
            {board.title}
          </p>
          <p className="text-[11px] text-[#696969] mt-0.5 truncate">
            {authorLabel} &middot; Last edited {timeLabel}
          </p>
        </div>

        <button
          onClick={toggleFav}
          disabled={pendingFav}
          className={cn(
            "ml-2 p-1 rounded-md transition-colors shrink-0",
            "hover:bg-[#F1FEE1]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20C5A8]",
            pendingFav && "opacity-50 cursor-not-allowed"
          )}
          aria-label={board.isFavorite ? "Unfavorite" : "Favorite"}
        >
          <Star
            className={cn(
              "h-3.5 w-3.5 transition-colors",
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

GridCard.Skeleton = function GridCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#EEEEEE]">
      <Skeleton className="aspect-[16/10] w-full rounded-none bg-[#F1FEE1]" />
      <div className="px-3 py-2.5 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
    </div>
  );
};

BoardGrid.Skeleton = GridCard.Skeleton;

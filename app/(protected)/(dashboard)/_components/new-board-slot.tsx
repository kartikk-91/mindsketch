"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useCreateBoard } from "@/hooks/use-create-board";
import { cn } from "@/lib/utils";

interface NewBoardSlotProps {
  orgId: string;
}

export const NewBoardSlot = ({ orgId }: NewBoardSlotProps) => {
  const router = useRouter();
  const { createBoard } = useCreateBoard();
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    setPending(true);
    try {
      const board = await createBoard({ orgId, title: "Untitled" });
      toast.success("Board created");
      router.push(`/board/${board.id}`);
    } catch {
      toast.error("Failed to create board");
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      disabled={pending}
      onClick={onClick}
      className={cn(
        "group w-full aspect-[7/6] rounded-xl border-2 border-dashed border-[#DDDDDD] bg-white",
        "flex flex-col items-center justify-center gap-2",
        "transition-all duration-200",
        "hover:border-[#20C5A8] hover:bg-[#F1FEE1]/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20C5A8] focus-visible:ring-offset-2",
        pending && "opacity-50 cursor-not-allowed"
      )}
    >
      <div
        className={cn(
          "p-2 rounded-full transition-colors",
          "bg-[#FBFBFB] group-hover:bg-[#20C5A8]/10"
        )}
      >
        <Plus
          className={cn(
            "h-5 w-5 transition-colors",
            "text-[#999AA1] group-hover:text-[#20C5A8]"
          )}
        />
      </div>
      <span
        className={cn(
          "text-sm font-medium transition-colors",
          "text-[#999AA1] group-hover:text-[#20C5A8]"
        )}
      >
        New board
      </span>
    </button>
  );
};
"use client";

import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NewBoardDialog } from "./new-board-dialog";

interface NewBoardButtonProps { orgId: string; disabled?: boolean; }

export const NewBoardButton = ({ orgId, disabled }: NewBoardButtonProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return <>
    <button disabled={disabled} onClick={() => setOpen(true)} className={cn("col-span-1 aspect-[100/127] bg-blue-600 w-full transition-colors rounded-lg hover:bg-blue-800 flex flex-col items-center justify-center py-6", disabled && "opacity-75 cursor-not-allowed hover:bg-blue-600")}>
      <div /><Plus className="h-12 w-12 text-white stroke-1" /><p className="text-xs text-white font-light">New board</p>
    </button>
    <NewBoardDialog orgId={orgId} open={open} onOpenChange={setOpen} onCreated={(id) => router.push(`/board/${id}`)} />
  </>;
};

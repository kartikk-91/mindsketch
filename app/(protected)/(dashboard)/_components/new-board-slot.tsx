"use client";

import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NewBoardDialog } from "./new-board-dialog";

interface NewBoardSlotProps { orgId: string; }

export const NewBoardSlot = ({ orgId }: NewBoardSlotProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return <>
    <button onClick={() => setOpen(true)} className={cn("group w-full aspect-[7/6] rounded-xl border-2 border-dashed border-[#DDDDDD] bg-white", "flex flex-col items-center justify-center gap-2 transition-all duration-200", "hover:border-[#20C5A8] hover:bg-[#F1FEE1]/50", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20C5A8] focus-visible:ring-offset-2")}>
      <div className="p-2 rounded-full transition-colors bg-[#FBFBFB] group-hover:bg-[#20C5A8]/10"><Plus className="h-5 w-5 transition-colors text-[#999AA1] group-hover:text-[#20C5A8]" /></div>
      <span className="text-sm font-medium transition-colors text-[#999AA1] group-hover:text-[#20C5A8]">New board</span>
    </button>
    <NewBoardDialog orgId={orgId} open={open} onOpenChange={setOpen} onCreated={(id) => router.push(`/board/${id}`)} />
  </>;
};

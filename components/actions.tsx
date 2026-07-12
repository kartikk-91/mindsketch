"use client";

import { DropdownMenuContentProps } from "@radix-ui/react-dropdown-menu";
import {
  Link2,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { ConfirmModal } from "./confirm-modal";

import { useDeleteBoard } from "@/hooks/use-delete-board";
import { useRenameModal } from "@/store/use-rename-modal";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ActionProps {
  children: React.ReactNode;
  side?: DropdownMenuContentProps["side"];
  sideOffset?: DropdownMenuContentProps["sideOffset"];
  id: string;
  title: string;
}

export const Actions = ({
  children,
  side,
  sideOffset,
  id,
  title,
}: ActionProps) => {
  const router = useRouter();
  const { onOpen } = useRenameModal();
  const { deleteBoard } = useDeleteBoard();
  const [pending, setPending] = useState(false);

  const onDelete = async () => {
    setPending(true);
    try {
      await deleteBoard(id);
      toast.success("Board deleted");
      router.push("/");
    } catch {
      toast.error("Couldn't delete board");
    } finally {
      setPending(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}/board/${id}`)
      .then(() => toast.success("Link copied!"))
      .catch(() => toast.error("Failed to copy link"));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={side}
        sideOffset={sideOffset}
        onClick={(e) => e.stopPropagation()}
        className="w-56 bg-white border border-[#EEEEEE] rounded-xl p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
      >
        <DropdownMenuItem
          onClick={handleCopyLink}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#181C31] cursor-pointer hover:bg-[#FBFBFB] transition-colors focus-visible:outline-none focus-visible:bg-[#FBFBFB]"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-[#FBFBFB]">
            <Link2 className="h-3.5 w-3.5 text-[#696969]" />
          </span>
          Copy board link
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onOpen(id, title)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#181C31] cursor-pointer hover:bg-[#FBFBFB] transition-colors focus-visible:outline-none focus-visible:bg-[#FBFBFB]"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-[#FBFBFB]">
            <Pencil className="h-3.5 w-3.5 text-[#696969]" />
          </span>
          Rename
        </DropdownMenuItem>

        <div className="h-px bg-[#EEEEEE] my-1 mx-2" />

        <ConfirmModal
          onConfirm={onDelete}
          disabled={pending}
          header="Delete board?"
          description={`Are you sure you want to delete "${title}"? This can't be undone.`}
        >
          <button
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 cursor-pointer hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:bg-red-50"
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-red-50">
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </span>
            Delete board
          </button>
        </ConfirmModal>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

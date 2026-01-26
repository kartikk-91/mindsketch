"use client";

import { DropdownMenuContentProps } from "@radix-ui/react-dropdown-menu";
import { Link2, Pencil, Trash2 } from "lucide-react";
import { useApiMutation } from "@/hooks/use-api-mutation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { ConfirmModal } from "./confirm-modal";
import { Button } from "./ui/button";
import { useRenameModal } from "@/store/use-rename-modal";

interface ActionProps {
    children: React.ReactNode;
    side?: DropdownMenuContentProps["side"];
    sideOffset?: DropdownMenuContentProps["sideOffset"];
    id: string;
    title: string;
}


export const Actions = ({ children, side, sideOffset, id, title }: ActionProps) => {

    const {onOpen}=useRenameModal();
    const { mutate, pending } = useApiMutation(api.board.remove);

    const onDelete = () => {
        mutate({ id })
            .then(() => {
                toast.success("Board deleted successfully");
            })
            .catch(() => {
                toast.error("Failed to delete board");
            });
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/board/${id}`)
            .then(() => {
                toast.success("Link copied to clipboard");
            })
            .catch(() => {
                toast.error("Failed to copy link to clipboard");
            });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {children}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                side={side}
                sideOffset={sideOffset}
                onClick={(e) => e.stopPropagation()}
                className="w-60 bg-white"
            >
                <DropdownMenuItem onClick={handleCopyLink} className="p-3 cursor-pointer">
                    <Link2 className="h-4 w-4 mr-2" />
                    Copy board link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={()=>onOpen(id,title)} className="p-3 cursor-pointer">
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                </DropdownMenuItem>
                <ConfirmModal
                    onConfirm={onDelete}
                    disabled={pending}
                    header="Delete board?"
                    description={`Are you sure you want to delete "${title}" board?`}
                >
                    <Button variant={"ghost"} className="p-3 cursor-pointer text-sm w-full justify-start font-normal">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete board
                    </Button>
                </ConfirmModal>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
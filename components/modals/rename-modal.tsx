"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle, DialogFooter,
    DialogClose,
    DialogHeader
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import { useRenameModal } from "@/store/use-rename-modal";
import { FormEventHandler, useEffect,useState } from "react";
import { Button } from "../ui/button";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export const RenameModal = () => {
        const {mutate,pending}=useApiMutation(api.board.update);
        const { isOpen, onClose, intialValues } = useRenameModal();
        const [title, setTitle] = useState(intialValues.title);
        useEffect(() => {
            setTitle(intialValues.title);
        }, [intialValues.title]);
        const onSubmit:FormEventHandler<HTMLFormElement> = (e) => {
            e.preventDefault();
            mutate({ id: intialValues.id, title })
                .then(() => {
                    toast.success("Board renamed successfully");
                    onClose();
                })
                .catch(() => {
                    toast.error("Failed to rename board");
                });
        };
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Enter board title</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    Enter a new title for the board
                </DialogDescription>
                <form onSubmit={onSubmit} className="space-y-4">
                    <Input
                    disabled={pending}
                    required
                    maxLength={60}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Board title"
                    />
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant={"outline"}>Cancel</Button>
                        </DialogClose>
                        <Button disabled={pending} type="submit">Rename</Button>
                    </DialogFooter>
                </form>
            </DialogContent>   
        </Dialog>
    );
}
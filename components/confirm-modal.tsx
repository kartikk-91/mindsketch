"use client";

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogTrigger,
    AlertDialogDescription,
    AlertDialogTitle,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogFooter,
    AlertDialogHeader
} from "@/components/ui/alert-dialog"

interface ConfirmModalProps {
    children: React.ReactNode;
    onConfirm: () => void;
    disabled?: boolean;
    header: string;
    description?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    actionLabel?: string;
}

export const ConfirmModal = ({ children, onConfirm, disabled, header, description, open, onOpenChange, actionLabel = "Delete" }: ConfirmModalProps) => {
        
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white border border-[#EEEEEE] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-[#181C31] text-lg font-bold">
                        {header}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[#696969] text-sm leading-relaxed">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl border-[#EEEEEE] text-[#696969] hover:bg-[#FBFBFB] hover:text-[#181C31]">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} disabled={disabled} className="rounded-xl bg-red-500 hover:bg-red-600 text-white">
                        {actionLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

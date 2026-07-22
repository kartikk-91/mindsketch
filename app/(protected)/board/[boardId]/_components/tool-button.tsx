"use client";
import { LucideIcon } from "lucide-react";
import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";


interface ToolButtonProps {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    isActive?: boolean;
    isDisabled?: boolean;
    showHint?: boolean;
}

export const ToolButton = ({
    label,
    icon:Icon,
    onClick,
    isActive,
    isDisabled,
    showHint = true,
}: ToolButtonProps) => {
    const button = (
        <Button
            disabled={isDisabled}
            onClick={onClick}
            size="icon"
            variant={isActive ? "boardActive" : "board"}
        >
            <Icon/>
        </Button>
    );

    if (!showHint) return button;

    return (
        <Hint label={label} side="right" sideOffset={14}>
            {button}
        </Hint>
    );
}

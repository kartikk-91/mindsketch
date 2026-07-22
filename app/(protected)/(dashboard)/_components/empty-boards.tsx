"use client";

import { Plus, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useCreateBoard } from "@/hooks/use-create-board";
import { useTemplates } from "@/hooks/use-templates";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface EmptyBoardsProps {
  orgId: string;
}

export const EmptyBoards = ({ orgId }: EmptyBoardsProps) => {
  const router = useRouter();
  const { createBoard } = useCreateBoard();
  const { data: templates = [] } = useTemplates();
  const [pending, setPending] = useState(false);
  const [creatingId, setCreatingId] = useState<string | null>(null);

  const handleBlank = async () => {
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

  const handleTemplate = async (templateId: string, name: string) => {
    setCreatingId(templateId);
    try {
      const board = await createBoard({ orgId, title: name, templateId });
      toast.success(`"${name}" board created`);
      router.push(`/board/${board.id}`);
    } catch {
      toast.error("Failed to create from template");
      setCreatingId(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="max-w-lg w-full text-center">

        <h2 className="text-2xl font-bold text-[#181C31] tracking-tight">
          Your canvas is empty
        </h2>

        
        <button
          disabled={pending}
          onClick={handleBlank}
          className={cn(
            "mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full",
            "bg-[#181C31] text-white text-sm font-semibold",
            "hover:bg-[#2C3149] transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20C5A8] focus-visible:ring-offset-2",
            pending && "opacity-60 cursor-not-allowed"
          )}
        >
          <Plus className="h-4 w-4" />
          Create blank board
          <ArrowRight className="h-4 w-4" />
        </button>

        
        {templates.length > 0 && (
          <div className="mt-12">
            <p className="text-xs font-semibold text-[#999AA1] uppercase tracking-wider mb-4">
              Or start with a template
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              {templates.slice(0, 3).map((template) => (
                <button
                  key={template.id}
                  disabled={creatingId === template.id}
                  onClick={() => handleTemplate(template.id, template.name)}
                  className={cn(
                    "group w-[180px] flex flex-col rounded-xl overflow-hidden border border-[#EEEEEE] bg-white text-left",
                    "transition-all duration-200 hover:border-[#FFB800]/40 hover:shadow-[0_4px_16px_rgba(255,184,0,0.08)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20C5A8] focus-visible:ring-offset-2",
                    creatingId === template.id && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#FFF8E7]">
                    <Image
                      src={`/images/templates/${template.thumbnail}`}
                      alt={template.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-[13px] font-semibold text-[#181C31] truncate">
                      {template.name}
                    </p>
                    <p className="text-[11px] text-[#999AA1] mt-0.5">
                      Template
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
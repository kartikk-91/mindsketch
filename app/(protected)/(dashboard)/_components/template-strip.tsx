"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useCreateBoard } from "@/hooks/use-create-board";
import { useTemplates } from "@/hooks/use-templates";
import { cn } from "@/lib/utils";

interface TemplateStripProps {
  orgId: string;
}

export const TemplateStrip = ({ orgId }: TemplateStripProps) => {
  const { data: templates = [] } = useTemplates();
  const { createBoard } = useCreateBoard();
  const router = useRouter();
  const [creatingId, setCreatingId] = useState<string | null>(null);

  if (templates.length === 0) return null;

  const handleCreate = async (templateId: string, name: string) => {
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
    <section className="mb-14">
      <h2 className="text-[22px] font-bold text-[#181C31] tracking-tight mb-5">
        Start from a template
      </h2>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {templates.map((template) => (
          <button
            key={template.id}
            disabled={creatingId === template.id}
            onClick={() => handleCreate(template.id, template.name)}
            className={cn(
              "group shrink-0 w-[220px] sm:w-[260px] flex flex-col rounded-xl overflow-hidden border border-[#EEEEEE] bg-white text-left",
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
              <p className="text-[11px] text-[#696969] mt-0.5">Template</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CreateOrganizationModal } from "@/components/create-organization-modal";
import { Hint } from "@/components/hint";

export const NewButton = () => {
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  return (
    <>
      <div className="aspect-square">
        <Hint label="Create workspace" side="right" align="start" sideOffset={18}>
          <button onClick={() => setCreateOrgOpen(true)} className="bg-white/25 h-full w-full rounded-md flex items-center justify-center opacity-60 hover:opacity-100 transition">
            <Plus className="text-white" />
          </button>
        </Hint>
      </div>
      <CreateOrganizationModal open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
    </>
  );
};

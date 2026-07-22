"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganizationList } from "@clerk/nextjs";
import { Building2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateOrganizationModal = ({ open, onOpenChange }: CreateOrganizationModalProps) => {
  const router = useRouter();
  const { createOrganization, isLoaded, setActive } = useOrganizationList();
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const workspaceName = name.trim();
    if (!workspaceName) return toast.error("Give your workspace a name to continue.");
    if (!createOrganization || !setActive) return toast.error("Workspace creation is not ready yet. Please try again.");

    setIsCreating(true);
    try {
      const organization = await createOrganization({ name: workspaceName });
      await setActive({ organization: organization.id });
      window.dispatchEvent(new CustomEvent("mindsketch:organization-created", { detail: organization }));
      toast.success(`${organization.name} is ready to use.`);
      setName("");
      onOpenChange(false);
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("We couldn't create that workspace. Try another name.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-[28px] border-[#E9EAE7] bg-white p-0 shadow-2xl shadow-[#181C31]/10">
        <DialogHeader className="border-b border-[#EEF0EC] bg-[#F7FAF2] px-7 pb-6 pt-7 text-left">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E4F7F0] text-[#159A83]"><Building2 className="h-5 w-5" /></div>
          <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-[#181C31]">Create a workspace</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-[#73757E]">A workspace keeps your boards and collaborators together.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-6 px-7 py-7">
          <div className="space-y-2">
            <Label htmlFor="workspace-name" className="text-sm font-semibold text-[#303449]">Workspace name</Label>
            <Input id="workspace-name" autoFocus maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Acme design team" disabled={!isLoaded || isCreating} className="h-11 rounded-xl border-[#DDE1DA] px-3.5 text-[#181C31] shadow-none placeholder:text-[#A2A5AC] focus-visible:border-[#20C5A8] focus-visible:ring-[#20C5A8]/20" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isCreating} className="rounded-full px-4 text-[#696D78] hover:bg-[#F3F5F1] hover:text-[#181C31]">Cancel</Button>
            <Button type="submit" disabled={!isLoaded || isCreating} className="h-11 rounded-full bg-[#181C31] px-5 font-semibold text-white shadow-md shadow-[#181C31]/15 hover:bg-[#30364F]">
              {isCreating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : <><Sparkles className="h-4 w-4" /> Create workspace</>}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

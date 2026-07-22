"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OrganizationSettingsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { organization, membership } = useOrganization();
  const [name, setName] = useState(organization?.name ?? "");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isAdmin = membership?.role === "org:admin";

  useEffect(() => {
    if (!open) return;
    setName(organization?.name ?? "");
    setLogo(null);
    setLogoPreview(null);
  }, [open, organization?.id, organization?.name]);

  const chooseLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file."); return; }
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!organization || !isAdmin) return;
    if (!trimmedName) { toast.error("Workspace name cannot be empty."); return; }
    setSaving(true);
    try {
      if (trimmedName !== organization.name) await organization.update({ name: trimmedName });
      if (logo) await organization.setLogo({ file: logo });
      toast.success("Workspace details updated.");
      onOpenChange(false);
    } catch {
      toast.error("Couldn't update workspace details.");
    } finally { setSaving(false); }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-2xl border-[#E9EAE7] bg-white p-0">
      <DialogHeader className="border-b border-[#EEF0EC] bg-[#F7FAF2] px-6 py-5 text-left"><DialogTitle className="text-base font-semibold text-[#181C31]">Workspace details</DialogTitle><p className="mt-1 text-xs text-[#73757E]">Update the name and logo your team sees.</p></DialogHeader>
      <form onSubmit={save} className="space-y-5 px-6 py-6">
        <div className="flex items-center gap-4"><Avatar className="h-14 w-14 rounded-xl border border-[#E4E7E1]"><AvatarImage src={logoPreview ?? organization?.imageUrl} alt="Workspace logo" /><AvatarFallback className="rounded-xl bg-[#F3F6D5] text-lg font-bold text-[#7F8B32]">{name.slice(0, 1).toUpperCase() || "W"}</AvatarFallback></Avatar><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#DDE1DA] px-3 py-2 text-xs font-medium text-[#303449] hover:bg-[#F7FAF2]"><ImagePlus className="h-4 w-4 text-[#159A83]" />Choose logo<input type="file" accept="image/*" className="sr-only" onChange={chooseLogo} /></label></div>
        <div className="space-y-2"><Label htmlFor="workspace-name" className="text-sm font-medium text-[#181C31]">Workspace name</Label><Input id="workspace-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} className="border-[#DDE1DA] focus-visible:ring-[#20C5A8]" /></div>
        <div className="flex gap-3"><Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button><Button type="submit" className="flex-1 bg-[#181C31] hover:bg-[#30364F]" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? "Saving" : "Save details"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}

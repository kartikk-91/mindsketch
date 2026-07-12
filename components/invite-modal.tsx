"use client";

import { useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId?: string;
}

export const InviteModal = ({ open, onOpenChange, orgId }: InviteModalProps) => {
  const { organization, isLoaded } = useOrganization();
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    const emailAddress = email.trim().toLowerCase();
    if (!emailAddress) return toast.error("Please enter an email address.");

    setIsInviting(true);
    try {
      if (!organization || organization.id !== orgId) throw new Error("No active workspace");
      await organization.inviteMember({ emailAddress, role: "org:member" });
      toast.success(`Invitation sent to ${emailAddress}`);
      setEmail("");
      onOpenChange(false);
    } catch {
      toast.error("We couldn't send that invitation. Check your access and try again.");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-[28px] border-[#E9EAE7] bg-white p-0 shadow-2xl shadow-[#181C31]/10">
        <DialogHeader className="border-b border-[#EEF0EC] bg-[#F7FAF2] px-7 pb-6 pt-7 text-left">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E4F7F0] text-[#159A83]"><Mail className="h-5 w-5" /></div>
          <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-[#181C31]">Invite a collaborator</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-[#73757E]">They’ll receive an email invitation to join this workspace.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleInvite} className="space-y-6 px-7 py-7">
          <div className="space-y-2">
            <Label htmlFor="invite-email" className="text-sm font-semibold text-[#303449]">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999AA1]" />
              <Input id="invite-email" type="email" placeholder="colleague@example.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={!isLoaded || isInviting} className="h-11 rounded-xl border-[#DDE1DA] pl-10 text-[#181C31] shadow-none placeholder:text-[#A2A5AC] focus-visible:border-[#20C5A8] focus-visible:ring-[#20C5A8]/20" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isInviting} className="flex-1 rounded-full border-[#DDE1DA] text-[#696D78] hover:bg-[#F3F5F1] hover:text-[#181C31]">Cancel</Button>
            <Button type="submit" disabled={!isLoaded || isInviting} className="flex-1 rounded-full bg-[#181C31] font-semibold text-white shadow-md shadow-[#181C31]/15 hover:bg-[#30364F]">
              {isInviting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-4 w-4" /> Send invite</>}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

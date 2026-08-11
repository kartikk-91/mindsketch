"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrganization, useOrganizationList, useUser } from "@clerk/nextjs";
import { Crown, Loader2, MoreHorizontal, Shield, Trash2, UserCog, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmModal } from "@/components/confirm-modal";

type PendingAction = { type: "promote" | "remove"; userId: string; name: string } | null;

export function OrganizationMembersModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { organization, membership, isLoaded } = useOrganization();
  const { user } = useUser();
  const { setActive } = useOrganizationList();
  const [members, setMembers] = useState<Awaited<ReturnType<NonNullable<typeof organization>["getMemberships"]>>["data"]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const isAdmin = membership?.role === "org:admin";

  const loadMembers = async () => {
    if (!organization) return;
    setLoading(true);
    try { setMembers((await organization.getMemberships()).data); }
    catch { toast.error("Couldn't load workspace members."); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open && isLoaded && organization) void loadMembers(); }, [open, isLoaded, organization?.id]);
  const otherAdmins = useMemo(() => members.filter((item) => item.role === "org:admin" && item.publicUserData.userId !== user?.id), [members, user?.id]);

  const confirmMemberAction = async () => {
    if (!organization || !pendingAction || !isAdmin) return;
    const action = pendingAction;
    setPendingId(action.userId);
    try {
      if (action.type === "promote") {
        await organization.updateMember({ userId: action.userId, role: "org:admin" });
        toast.success(`${action.name} is now an admin.`);
      } else {
        await organization.removeMember(action.userId);
        toast.success("Member removed from the workspace.");
      }
      setPendingAction(null);
      await loadMembers();
    } catch {
      toast.error(action.type === "promote" ? "Couldn't update this member's role." : "Couldn't remove this member.");
    } finally { setPendingId(null); }
  };

  const leave = async () => {
    if (!organization || !user) return;
    if (isAdmin && otherAdmins.length === 0) { toast.error("Make another member an admin before leaving this workspace."); return; }
    setPendingId(user.id);
    try {
      await user.leaveOrganization(organization.id);
      await setActive?.({ organization: null });
      onOpenChange(false);
      toast.success("You left the workspace.");
    } catch { toast.error("Couldn't leave this workspace."); }
    finally { setPendingId(null); }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[520px] gap-0 overflow-hidden rounded-2xl border-[#E9EAE7] bg-white p-0">
      <DialogHeader className="border-b border-[#EEF0EC] bg-[#F7FAF2] px-5 py-4 text-left sm:px-6">
        <DialogTitle className="flex items-center gap-2 text-base font-semibold text-[#181C31]"><Users className="h-4 w-4 text-[#159A83]" /> Workspace members</DialogTitle>
        <p className="mt-1 text-xs text-[#73757E]">{organization?.name ?? "Workspace"} · {organization?.membersCount ?? 0} members</p>
      </DialogHeader>
      <div className="max-h-[min(55dvh,440px)] space-y-2 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
        {loading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[#159A83]" /></div> : members.map((item) => {
          const memberUser = item.publicUserData;
          const name = memberUser.identifier || "Workspace member";
          const mine = memberUser.userId === user?.id;
          const userId = memberUser.userId;
          return <div key={item.id} className="flex min-w-0 items-center gap-2.5 rounded-xl border border-[#EEF0EC] px-3 py-2.5">
            <Avatar className="h-8 w-8 shrink-0"><AvatarImage src={memberUser.imageUrl} alt={name} /><AvatarFallback className="text-xs">{name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium text-[#181C31]">{name}{mine ? " (You)" : ""}</p><p className="flex items-center gap-1 text-[11px] text-[#73757E]">{item.role === "org:admin" ? <Crown className="h-3 w-3 text-[#B57B24]" /> : <Shield className="h-3 w-3" />}{item.role === "org:admin" ? "Admin" : "Member"}</p></div>
            {isAdmin && !mine && userId && <DropdownMenu><DropdownMenuTrigger asChild><Button size="icon" variant="ghost" disabled={pendingId === userId} className="h-8 w-8 shrink-0 text-[#73757E]" aria-label={`Manage ${name}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="min-w-[145px] rounded-xl border-[#E4E7E1] p-1"><DropdownMenuItem disabled={item.role === "org:admin"} onSelect={() => setPendingAction({ type: "promote", userId, name })} className="rounded-lg text-xs"><UserCog className="h-3.5 w-3.5 text-[#159A83]" />Make admin</DropdownMenuItem><DropdownMenuItem onSelect={() => setPendingAction({ type: "remove", userId, name })} className="rounded-lg text-xs text-red-600 focus:bg-red-50 focus:text-red-600"><Trash2 className="h-3.5 w-3.5" />Delete member</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}
          </div>;
        })}
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-[#EEF0EC] px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="text-[11px] text-[#73757E]">{isAdmin ? "Admins can manage members." : "You can leave this workspace at any time."}</p><Button size="sm" variant="outline" disabled={pendingId === user?.id} onClick={() => void leave()} className="border-red-200 text-xs text-red-600 hover:bg-red-50">Leave workspace</Button></div>
      <ConfirmModal open={Boolean(pendingAction)} onOpenChange={(isOpen) => !isOpen && setPendingAction(null)} onConfirm={() => void confirmMemberAction()} disabled={Boolean(pendingId)} header={pendingAction?.type === "promote" ? "Make this member an admin?" : "Delete this member?"} description={pendingAction?.type === "promote" ? `${pendingAction?.name} will be able to manage members and invitations.` : `${pendingAction?.name} will lose access to this workspace and its boards.`} actionLabel={pendingAction?.type === "promote" ? "Make admin" : "Delete member"}><span /></ConfirmModal>
    </DialogContent>
  </Dialog>;
}

"use client";

import { useState } from "react";
import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import { Check, ChevronDown, Loader2, MailCheck, Plus, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CreateOrganizationModal } from "@/components/create-organization-modal";
import { InviteModal } from "@/components/invite-modal";

interface OrganizationSwitcherProps {
  variant?: "desktop" | "mobile";
}

export const OrganizationSwitcher = ({ variant = "desktop" }: OrganizationSwitcherProps) => {
  const { isLoaded, setActive, userInvitations, userMemberships } = useOrganizationList({ userMemberships: true, userInvitations: true });
  const { organization } = useOrganization();
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const currentOrg = userMemberships?.data?.find((membership) => membership.organization.id === organization?.id);
  const invitations = userInvitations?.data ?? [];
  const hasInvitations = invitations.length > 0;

  const selectOrganization = async (organizationId: string) => {
    if (!setActive || organizationId === organization?.id) return;
    try {
      await setActive({ organization: organizationId });
    } catch {
      toast.error("We couldn't switch workspaces. Please try again.");
    }
  };

  const acceptInvitation = async (invitation: (typeof invitations)[number]) => {
    setAcceptingId(invitation.id);
    try {
      await invitation.accept();
      await setActive?.({ organization: invitation.publicOrganizationData.id });
      toast.success(`Welcome to ${invitation.publicOrganizationData.name}.`);
    } catch {
      toast.error("We couldn't accept that invitation. Please try again.");
    } finally {
      setAcceptingId(null);
    }
  };

  if (!isLoaded) {
    return <div className={cn("flex items-center gap-2 rounded-xl border border-[#EEF0EC] bg-white px-3 py-2.5", variant === "mobile" && "max-w-[280px]")}><div className="h-7 w-7 animate-pulse rounded-lg bg-[#EEF0EC]" /><div className="h-3 w-24 animate-pulse rounded bg-[#EEF0EC]" /></div>;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={cn("group flex w-full items-center gap-2.5 rounded-xl border border-[#E4E7E1] bg-white px-2.5 py-2 text-left shadow-sm shadow-[#181C31]/[0.02] transition hover:border-[#A7DCD0] hover:bg-[#FAFCF9] focus:outline-none focus:ring-2 focus:ring-[#20C5A8]/30", variant === "mobile" && "max-w-[280px]")}>
            <Avatar className="h-7 w-7 rounded-lg border border-[#E4E7E1]"><AvatarImage src={currentOrg?.organization.imageUrl} alt="" /><AvatarFallback className="rounded-lg bg-[#E4F7F0] text-[11px] font-bold text-[#159A83]">{currentOrg?.organization.name?.slice(0, 1).toUpperCase() || <Users className="h-3.5 w-3.5" />}</AvatarFallback></Avatar>
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#303449]">{currentOrg?.organization.name || "Select workspace"}</span>
            {hasInvitations && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#20C5A8] px-1 text-[10px] font-bold text-white">{invitations.length}</span>}
            <ChevronDown className="h-4 w-4 shrink-0 text-[#8B9098] transition group-data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={variant === "desktop" ? "start" : "end"} sideOffset={8} className={cn("w-[288px] rounded-2xl border-[#E4E7E1] bg-white p-1.5 shadow-xl shadow-[#181C31]/10", variant === "mobile" && "w-[280px]")}>
          <DropdownMenuLabel className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#969AA2]">Your workspaces</DropdownMenuLabel>
          {userMemberships?.data?.map((membership) => {
            const isActive = organization?.id === membership.organization.id;
            return <DropdownMenuItem key={membership.organization.id} onSelect={() => selectOrganization(membership.organization.id)} className={cn("group rounded-xl px-3 py-2.5 text-[#555B68] focus:bg-[#F3F8F4] focus:text-[#181C31]", isActive && "bg-[#F1F8F3] text-[#181C31]")}>
              <Avatar className="h-8 w-8 rounded-lg border border-[#E4E7E1]"><AvatarImage src={membership.organization.imageUrl} alt="" /><AvatarFallback className="rounded-lg bg-[#FFF5DF] text-xs font-bold text-[#B57B24]">{membership.organization.name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{membership.organization.name}</span>
              {isActive && <Check className="h-4 w-4 text-[#159A83]" />}
            </DropdownMenuItem>;
          })}
          {hasInvitations && <>
            <DropdownMenuSeparator className="my-1.5 bg-[#EEF0EC]" />
            <DropdownMenuLabel className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#159A83]"><MailCheck className="h-3.5 w-3.5" /> Invitations ({invitations.length})</DropdownMenuLabel>
            {invitations.map((invitation) => <DropdownMenuItem key={invitation.id} disabled={acceptingId === invitation.id} onSelect={(event) => { event.preventDefault(); void acceptInvitation(invitation); }} className="rounded-xl px-3 py-2.5 text-[#555B68] focus:bg-[#F3F8F4] focus:text-[#181C31]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E4F7F0] text-[#159A83]"><MailCheck className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{invitation.publicOrganizationData.name}</span><span className="block text-xs text-[#9499A2]">Accept invitation</span></span>
              {acceptingId === invitation.id ? <Loader2 className="h-4 w-4 animate-spin text-[#159A83]" /> : <span className="rounded-full bg-[#181C31] px-2.5 py-1 text-[11px] font-semibold text-white">Join</span>}
            </DropdownMenuItem>)}
          </>}
          <DropdownMenuSeparator className="my-1.5 bg-[#EEF0EC]" />
          <DropdownMenuItem disabled={!organization} onSelect={() => setInviteOpen(true)} className="rounded-xl px-3 py-2.5 text-[#555B68] focus:bg-[#F3F8F4] focus:text-[#181C31]"><UserPlus className="h-4 w-4 text-[#159A83]" /><span className="text-sm font-medium">Invite collaborators</span></DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setCreateOrgOpen(true)} className="rounded-xl px-3 py-2.5 text-[#555B68] focus:bg-[#F3F8F4] focus:text-[#181C31]"><Plus className="h-4 w-4 text-[#159A83]" /><span className="text-sm font-medium">Create workspace</span></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateOrganizationModal open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
      <InviteModal open={inviteOpen} onOpenChange={setInviteOpen} orgId={organization?.id} />
    </>
  );
};

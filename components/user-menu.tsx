"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { useState } from "react";
import { SettingsModal } from "@/components/settings-modal";

export const UserMenu = () => {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="h-8 w-8 rounded-full bg-[#EEEEEE] animate-pulse" />
    );
  }

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "U";

  return (
    <>
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-[#20C5A8]/60 focus:ring-offset-2"
        >
          <Avatar className="h-9 w-9 ring-1 ring-[#E4E7E1]">
            <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
            <AvatarFallback className="bg-[#20C5A8] text-white text-xs font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-64 rounded-2xl border-[#E4E7E1] bg-white p-2 shadow-xl shadow-[#181C31]/10"
      >
        <div className="mb-2 rounded-xl bg-[#F7FAF2] px-3 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F7F0] text-sm font-bold text-[#159A83]">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#181C31] truncate">
                {user?.fullName || "User"}
              </p>
              <p className="text-xs text-[#999AA1] truncate">
                {user?.emailAddresses?.[0]?.emailAddress}
              </p>
            </div>
          </div>
        </div>
        <DropdownMenuItem
          onSelect={() => setSettingsOpen(true)}
          className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-[#5C6170] transition-colors focus:bg-[#F1F8F3] focus:text-[#181C31]"
        >
          <User className="h-4 w-4 mr-3 text-[#20C5A8]" />
          <span className="font-medium">Manage account</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => clerk.signOut({ redirectUrl: "/sign-in" })}
          className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-[#5C6170] transition-colors focus:bg-red-50 focus:text-red-600"
        >
          <LogOut className="h-4 w-4 mr-3 text-[#999AA1] group-hover:text-red-600" />
          <span className="font-medium">Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
};

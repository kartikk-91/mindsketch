/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { cn } from "@/lib/utils";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Star} from "lucide-react";
import Image from "next/image";
import { useDashboard } from "../dashboard-context"; 

export const OrgSidebar = () => {
  const { view, setView } = useDashboard(); 

  return (
    <aside className="hidden lg:flex h-full w-[240px] flex-col border-r border-[#EEEEEE] bg-white">
      
      <div className="px-5 pt-5 pb-4 border-b border-[#EEEEEE]">
        <div className="flex items-center gap-2 px-2">
          <Image
            src="/logo.png"
            alt="Mindsketch"
            height={22}
            width={140}
            priority
            className="object-contain"
          />
        </div>
      </div>

      
      <div className="px-4 pt-4 pb-3">
        <p className="text-[11px] font-semibold text-[#999AA1] uppercase tracking-wider mb-2 px-2">
          Workspace
        </p>
        <OrganizationSwitcher
          hidePersonal
          appearance={{
            elements: {
              rootBox: "w-full",
              organizationSwitcherTrigger:
                "flex w-full items-center justify-between rounded-xl border border-[#EEEEEE] bg-white px-3 py-2.5 text-[14px] text-[#181C31] font-medium hover:border-[#20C5A8]/30 hover:bg-[#F1FEE1]/30 transition-all",
              organizationSwitcherTriggerIcon:
                "text-[#999AA1]",
            },
          }}
        />
      </div>

      
      <div className="px-4 pb-2">
        <p className="text-[11px] font-semibold text-[#999AA1] uppercase tracking-wider mb-2 px-2">
          Boards
        </p>
        <nav className="flex flex-col gap-1">
          <SidebarItem
            onClick={() => setView("all")}
            active={view === "all"}
            icon={LayoutDashboard}
            label="All boards"
          />

          <SidebarItem
            onClick={() => setView("favorites")}
            active={view === "favorites"}
            icon={Star}
            label="Favorites"
          />
        </nav>
      </div>

      <div className="flex-1" />

      
      <div className="px-4 py-4 border-t border-[#EEEEEE]">
        <div className="flex items-center gap-3">
          <UserButton
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                userButtonTrigger:
                  "rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#20C5A8] focus:ring-offset-2",
                avatarBox:
                  "h-8 w-8 rounded-full ring-1 ring-[#EEEEEE]",
              },
            }}
          />
          <div className="flex flex-col min-w-0">
            <p className="text-[13px] font-medium text-[#181C31] truncate">
              Mindsketch
            </p>
            <p className="text-[11px] text-[#999AA1] truncate">
              Your workspace
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

type SidebarItemProps = {
  onClick: () => void;
  active: boolean;
  icon: any;
  label: string;
};

const SidebarItem = ({
  onClick,
  active,
  icon: Icon,
  label,
}: SidebarItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] transition-all",
        active
          ? "bg-[#F1FEE1] text-[#181C31] font-semibold"
          : "text-[#696969] hover:bg-[#FBFBFB] hover:text-[#181C31]"
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors",
          active ? "text-[#20C5A8]" : "text-[#999AA1] group-hover:text-[#20C5A8]"
        )}
      />

      <span className="truncate">{label}</span>

      {active && (
        <span className="ml-auto h-2 w-2 rounded-full bg-[#20C5A8]" />
      )}
    </button>
  );
};

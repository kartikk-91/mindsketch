/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { cn } from "@/lib/utils";
import { OrganizationSwitcher } from "@clerk/nextjs";
import { LayoutDashboard, Star } from "lucide-react";
import Image from "next/image";

type DashboardView = "all" | "favorites";

type OrgSidebarProps = {
  view: DashboardView;
  setView: (view: DashboardView) => void;
};

export const OrgSidebar = ({ view, setView }: OrgSidebarProps) => {
  return (
    <aside className="hidden lg:flex h-full w-[240px] flex-col border-r border-slate-200 bg-white px-5 pt-5">
      
      <div className="mb-7">
        <div className="flex items-center px-2">
          <Image
            src="/logo.png"
            alt="Mindsketch"
            height={26}
            width={170}
            priority
          />
        </div>
      </div>

      
      <div className="mb-7">
        <OrganizationSwitcher
          hidePersonal
          appearance={{
            elements: {
              rootBox: "w-full",
              organizationSwitcherTrigger:
                "flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-[15px] shadow-sm hover:bg-slate-50 transition",
            },
          }}
        />
      </div>

      
      <nav className="flex flex-col gap-1.5">
        <SidebarItem
          onClick={() => setView("all")}
          active={view === "all"}
          icon={LayoutDashboard}
          label="Team boards"
        />

        <SidebarItem
          onClick={() => setView("favorites")}
          active={view === "favorites"}
          icon={Star}
          label="Favorite boards"
        />
      </nav>

      <div className="flex-1" />

      <p className="mb-5 px-2 text-xs text-slate-400">
        Mindsketch workspace
      </p>
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
        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] transition",
        active
          ? "bg-slate-100 text-slate-900"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <span
        className={cn(
          "h-5 w-[3px] rounded-full",
          active ? "bg-slate-900" : "bg-transparent"
        )}
      />

      <Icon className="h-[18px] w-[18px] shrink-0" />

      <span className="truncate font-medium">{label}</span>
    </button>
  );
};

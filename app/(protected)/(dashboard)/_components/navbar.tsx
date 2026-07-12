"use client";

import {
  OrganizationSwitcher,
} from "@clerk/nextjs";
import { SearchInput } from "./search-input";
import { Sparkles } from "lucide-react";

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-sm border-b border-[#EEEEEE]">
      <div className="flex h-[64px] items-center gap-x-4 px-4 lg:px-6">
        
        <div className="flex lg:hidden items-center gap-2 mr-2">
          <div className="h-7 w-7 rounded-lg bg-[#20C5A8] flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>

        
        <div className="flex-1">
          <div className="w-full max-w-lg">
            <SearchInput />
          </div>
        </div>

        
        <div className="flex lg:hidden">
          <OrganizationSwitcher
            hidePersonal
            appearance={{
              elements: {
                rootBox: "w-full max-w-[280px]",
                organizationSwitcherTrigger:
                  "flex items-center gap-2 rounded-xl border border-[#EEEEEE] bg-white px-3 py-2 text-sm text-[#181C31] font-medium hover:border-[#20C5A8]/30 transition",
                organizationSwitcherTriggerIcon:
                  "text-[#999AA1]",
                organizationSwitcherPopoverCard:
                  "mt-2 w-[320px] rounded-2xl border border-[#EEEEEE] bg-white shadow-lg overflow-hidden",
                organizationSwitcherPopoverMain:
                  "p-2 space-y-1",
                organizationSwitcherPopoverActionButton:
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#696969] hover:bg-[#FBFBFB] transition",
                organizationSwitcherPopoverActionButtonIcon:
                  "text-[#999AA1]",
                organizationSwitcherPopoverActionButtonText:
                  "font-medium",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
};

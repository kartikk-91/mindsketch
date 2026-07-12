"use client";

import { OrganizationSwitcher } from "@/components/organization-switcher";
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
          <OrganizationSwitcher variant="mobile" />
        </div>
      </div>
    </header>
  );
};

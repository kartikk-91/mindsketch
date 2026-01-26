"use client";

import {
  OrganizationSwitcher,
  UserButton,
} from "@clerk/nextjs";
import { SearchInput } from "./search-input";

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200">
      <div className="flex h-[64px] items-center gap-x-6 px-6">
        <div className="hidden lg:flex flex-1">
          <div className="w-full max-w-xl">
            <SearchInput />
          </div>
        </div>

        <div className="flex flex-1 lg:hidden">
          <OrganizationSwitcher
            hidePersonal
            appearance={{
              elements: {
                rootBox: "w-full max-w-[360px]",
                organizationSwitcherTrigger:
                  "flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-[15px] shadow-sm hover:bg-slate-50 transition",
              },
            }}
          />
        </div>

        <div className="flex items-center justify-end">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-9 w-9",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
};

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
                rootBox:
                  "w-full max-w-[360px]",

                organizationSwitcherTrigger:
                  "group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 transition",

                organizationSwitcherTriggerIcon:
                  "text-slate-400 group-hover:text-slate-600 transition",

                organizationSwitcherTriggerText:
                  "font-medium truncate",

                organizationSwitcherPopoverCard:
                  "mt-2 w-[360px] rounded-2xl border border-slate-200 bg-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] overflow-hidden",

                organizationSwitcherPopoverMain:
                  "p-2 space-y-1",

                organizationSwitcherPopoverActionButton:
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition",

                organizationSwitcherPopoverActionButtonIcon:
                  "text-slate-400 group-hover:text-slate-600 transition",

                organizationSwitcherPopoverActionButtonText:
                  "font-medium",

                organizationSwitcherPopoverFooter:
                  "border-t border-slate-100 p-2",

                organizationSwitcherPopoverFooterAction:
                  "flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition",
              },
            }}
          />

        </div>

        <div className="flex items-center justify-end">
          <UserButton
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                userButtonTrigger:
                  "rounded-full transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",

                avatarBox:
                  "h-10 w-10 rounded-full ring-1 ring-slate-300 hover:ring-slate-400 transition",

                userButtonPopoverCard:
                  "w-[300px] rounded-2xl bg-white border border-slate-200 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] overflow-hidden",

                userButtonPopoverHeader:
                  "px-5 pt-5 pb-4",

                userButtonPopoverUserPreview:
                  "flex items-center gap-4",

                userButtonPopoverUserPreviewAvatarBox:
                  "h-12 w-12 rounded-full ring-1 ring-slate-300",

                userButtonPopoverUserPreviewTextContainer:
                  "flex flex-col min-w-0",

                userButtonPopoverUserPreviewMainIdentifier:
                  "text-sm font-semibold text-slate-900 truncate",

                userButtonPopoverUserPreviewSecondaryIdentifier:
                  "text-xs text-slate-500 truncate",

                userButtonPopoverDivider:
                  "mx-5 my-2 h-px bg-slate-100",

                userButtonPopoverMain:
                  "px-3 pb-3 space-y-1",

                userButtonPopoverActionButton:
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition",

                userButtonPopoverActionButtonIcon:
                  "text-slate-400 group-hover:text-slate-600 transition",

                userButtonPopoverActionButtonText:
                  "font-medium",

                userButtonPopoverFooter:
                  "px-3 pb-3 pt-1",

                userButtonPopoverFooterAction:
                  "flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
};

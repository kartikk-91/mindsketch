"use client";

import { SearchX } from "lucide-react";

export const EmptySearch = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="max-w-sm w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="p-5 rounded-2xl bg-[#F1FEE1]">
            <SearchX className="h-10 w-10 text-[#20C5A8]" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-[#181C31] tracking-tight">
          No boards match your search
        </h2>
        <p className="mt-2 text-sm text-[#696969] leading-relaxed">
          Try a different search term or clear the search to see all your boards.
        </p>
      </div>
    </div>
  );
};

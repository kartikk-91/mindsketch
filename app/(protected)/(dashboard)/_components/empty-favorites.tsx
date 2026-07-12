"use client";

import { Star } from "lucide-react";

export const EmptyFavorites = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="max-w-sm w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="p-5 rounded-2xl bg-[#FFF8E7]">
            <Star className="h-10 w-10 text-[#FFB800]" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-[#181C31] tracking-tight">
          No favorites yet
        </h2>
        <p className="mt-2 text-sm text-[#696969] leading-relaxed">
          Star the boards you use most — they&apos;ll appear here for quick access.
        </p>
        <p className="mt-4 text-xs text-[#999AA1]">
          Hover over any board and click the star icon to add it.
        </p>
      </div>
    </div>
  );
};

'use client';

import Image from "next/image";

export const Loading = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FCFCFA]" role="status" aria-live="polite">
      <div className="w-full max-w-sm px-6">
        <div className="flex justify-center mb-10">
          <Image
            src="/logo.png"
            width={190}
            height={76}
            alt="logo"
            priority
          />
        </div>

        <div className="flex items-center justify-center gap-3 text-sm font-medium text-slate-600">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" aria-hidden="true" />
          <span>Loading board…</span>
        </div>
      </div>
    </div>
  );
};

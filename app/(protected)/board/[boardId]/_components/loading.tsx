'use client';

import Image from "next/image";
import { useEffect, useState } from "react";

const steps = [
  "Starting things up",
  "Loading your workspace",
  "Preparing your dashboard",
];

export const Loading = () => {
  const [step, setStep] = useState(0);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (step < steps.length - 1) {
      const t = setTimeout(() => {
        setStep((s) => s + 1);
      }, 1100);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setWaiting(true);
      }, 1100);
      return () => clearTimeout(t);
    }
  }, [step]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white">
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

       
        <div className="relative h-[4px] w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 transition-all duration-700 shadow-[0_0_12px_rgba(0,0,0,0.25)]"
            style={{
              width: `${((step + 1) / steps.length) * 100}%`,
            }}
          />
        </div>

     
        <div className="mt-4 h-[28px] flex items-center justify-center">
          {!waiting ? (
            <p className="text-[13px] font-medium text-slate-600 tracking-[0.02em] transition-opacity duration-300">
              {steps[step]}
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-slate-500 tracking-[0.02em]">
                Finalizing
              </span>
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

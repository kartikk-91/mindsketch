"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { CreateOrganization } from "@clerk/nextjs";
import { Building2, ArrowRight } from "lucide-react";

export const EmptyOrg = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="max-w-sm w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-[#F1FEE1] rotate-6" />
            <div className="absolute inset-0 rounded-3xl bg-[#FFF8E7] -rotate-3" />
            <div className="relative p-6 rounded-3xl bg-white border-2 border-dashed border-[#DDDDDD]">
              <Building2 className="h-12 w-12 text-[#20C5A8]" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-[#181C31] tracking-tight">
          Set up your workspace
        </h2>
        <p className="mt-3 text-[#696969] leading-relaxed">
          Create an organization to start collaborating with your team on shared whiteboards.
        </p>

        <div className="mt-8">
          <Dialog>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#181C31] text-white text-sm font-semibold hover:bg-[#2C3149] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20C5A8] focus-visible:ring-offset-2">
                <Building2 className="h-4 w-4" />
                Create organization
                <ArrowRight className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="p-0 bg-transparent border-none max-w-[480px]">
              <CreateOrganization />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useOrganization } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const EmptyBoards = () => {
  const router = useRouter();
  const { mutate, pending } = useApiMutation(api.board.create);
  const { organization } = useOrganization();

  const onClick = () => {
    if (!organization) return;

    mutate({
      title: "Untitled",
      orgId: organization.id,
    })
      .then((id) => {
        toast.success("Board created");
        router.push(`/board/${id}`);
      })
      .catch(() => toast.error("Failed to create board"));
  };

  return (
    <div className="h-full w-full flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg rounded-2xl bg-white/70 backdrop-blur-md shadow-sm p-6 sm:p-8 lg:p-10 text-center">
        <div className="flex justify-center">
          <Image
            src="/emptyBoard.svg"
            height={200}
            width={200}
            alt="No boards"
            priority
            className="h-32 w-32 sm:h-40 sm:w-40 lg:h-48 lg:w-48"
          />
        </div>

        <h2 className="mt-6 sm:mt-8 text-lg sm:text-xl font-semibold tracking-tight text-slate-900">
          Create your first board
        </h2>

        <p className="mt-2 sm:mt-3 text-sm sm:text-[15px] leading-relaxed text-slate-500">
          Boards are shared spaces where your team can brainstorm, plan, and
          collaborate in real time.
        </p>

        <div className="mt-6 sm:mt-8 flex justify-center">
          <Button
            size="lg"
            disabled={pending}
            onClick={onClick}
            className="min-w-[150px] sm:min-w-[160px] disabled:cursor-not-allowed"
          >
            Create board
          </Button>
        </div>

        <p className="mt-3 sm:mt-4 text-xs text-slate-400">
          You can rename and customize your board later.
        </p>
      </div>
    </div>
  );
};

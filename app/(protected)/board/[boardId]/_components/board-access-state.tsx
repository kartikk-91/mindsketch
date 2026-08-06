"use client";

import Link from "next/link";
import { ArrowLeft, Building2, ShieldAlert } from "lucide-react";

type BoardAccessStateProps = {
  status: number;
};

export const BoardAccessState = ({ status }: BoardAccessStateProps) => {
  const isMissing = status === 404;
  const isUnauthorized = status === 403;

  const content = isMissing
    ? {
        icon: <ShieldAlert className="h-8 w-8 text-[#D65A43]" />,
        title: "This board is unavailable",
        description:
          "It may have been deleted, or the link is no longer valid.",
      }
    : isUnauthorized
      ? {
          icon: <Building2 className="h-8 w-8 text-[#20C5A8]" />,
          title: "You don’t have access to this board",
          description:
            "This board belongs to another organization. Ask an organization administrator to invite you, then open this link again.",
        }
      : {
          icon: <ShieldAlert className="h-8 w-8 text-[#D65A43]" />,
          title: "We couldn’t open this board",
          description:
            "Please try again in a moment. If this continues, contact your organization administrator.",
        };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FCFCFA] px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-[#E8E8E3] bg-white p-8 text-center shadow-[0_18px_50px_rgba(24,28,49,0.08)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F1FEE1]">
          {content.icon}
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-[#181C31]">
          {content.title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#696969]">
          {content.description}
        </p>
        <Link
          href="/dashboard"
          className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#181C31] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#30364F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20C5A8] focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to dashboard
        </Link>
      </section>
    </main>
  );
};

"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-[#181C31] group-[.toaster]:border-[#EEEEEE] group-[.toaster]:shadow-[0_8px_30px_rgba(0,0,0,0.08)] group-[.toaster]:rounded-xl group-[.toaster]:px-4 group-[.toaster]:py-3",
          description: "group-[.toast]:text-[#696969]",
          actionButton:
            "group-[.toast]:bg-[#20C5A8] group-[.toast]:text-white group-[.toast]:rounded-lg",
          cancelButton:
            "group-[.toast]:bg-[#FBFBFB] group-[.toast]:text-[#696969] group-[.toast]:rounded-lg",
          success:
            "group-[.toast]:border-l-[3px] group-[.toast]:border-l-[#20C5A8]",
          error:
            "group-[.toast]:border-l-[3px] group-[.toast]:border-l-red-400",
          icon: "group-[.toast]:text-[#20C5A8]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

import Image from "next/image";
import { Sparkles } from "lucide-react";
import { MarkdownContent } from "./markdown-content";

export type ChatImagePreview = { previewUrl: string; name?: string };
export type DisplayMessage = { id: string; role: "user" | "assistant"; content: string; image?: ChatImagePreview };

export function MessageBubble({ message }: { message: DisplayMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#20C5A8] via-[#A9DF52] to-[#FFB800] text-white shadow-solid-2">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      )}
      <article
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-solid-2 ${
          isUser
            ? "rounded-br-md bg-black text-white"
            : "rounded-bl-md border border-stroke bg-white text-black"
        }`}
      >
        {message.image && (
          <div className="relative mb-2 h-32 overflow-hidden rounded-xl border border-stroke bg-alabaster">
            <Image src={message.image.previewUrl} alt={message.image.name ?? "Attached image"} fill className="object-contain" unoptimized />
          </div>
        )}
        {isUser ? <p className="whitespace-pre-wrap">{message.content}</p> : message.content ? <MarkdownContent content={message.content} /> : null}
      </article>
    </div>
  );
}

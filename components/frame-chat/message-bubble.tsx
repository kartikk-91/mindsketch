import Image from "next/image";
import { Sparkles, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MarkdownContent } from "./markdown-content";

export type ChatImagePreview = { previewUrl: string; name?: string };
export type DisplayMessage = { id: string; role: "user" | "assistant"; content: string; image?: ChatImagePreview };

function spokenText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[#>*-]+\s*/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function ReadAloudButton({ content }: { content: string }) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => () => {
    if (utteranceRef.current) window.speechSynthesis?.cancel();
  }, []);

  const toggleSpeech = () => {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(spokenText(content));
    utterance.rate = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <button
      type="button"
      onClick={toggleSpeech}
      className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-stroke bg-white text-waterloo shadow-solid-2 transition hover:border-[#20C5A8] hover:bg-[#F2FBE3] hover:text-[#149C86]"
      aria-label={speaking ? "Stop reading response" : "Read response aloud"}
      title={speaking ? "Stop reading" : "Read aloud"}
    >
      {speaking ? <Square className="h-3 w-3 fill-current" /> : <Volume2 className="h-3.5 w-3.5" />}
    </button>
  );
}

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
      {!isUser && message.content && <ReadAloudButton content={message.content} />}
    </div>
  );
}

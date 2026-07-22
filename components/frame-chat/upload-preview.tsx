import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import type { ChatImagePreview } from "./message-bubble";

export function UploadPreview({ image, onRemove }: { image: ChatImagePreview; onRemove: () => void }) {
  return (
    <div className="relative mb-2 h-20 w-28 overflow-hidden rounded-xl border border-stroke bg-alabaster shadow-solid-2">
      <Image src={image.previewUrl} alt={image.name ?? "Upload preview"} fill className="object-cover" unoptimized />
      <button onClick={onRemove} className="absolute right-1 top-1 rounded-full bg-white p-1 text-black shadow-solid-2 transition hover:bg-alabaster" aria-label="Remove image">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function UploadButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stroke bg-white text-waterloo transition hover:border-meta hover:text-meta"
      aria-label="Attach image"
    >
      <ImagePlus className="h-4 w-4" />
    </button>
  );
}
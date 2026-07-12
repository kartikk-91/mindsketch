"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";
import { nanoid } from "nanoid";
import { CanvasMode, LayerType, Layer } from "@/types/canvas";
import { uploadImage, CloudinaryUploadResult } from "@/lib/cloudinary";

const MAX_LAYERS = 100;

/**
 * Custom hook that handles the full image-upload flow:
 *   1. Opens the OS file picker (via a hidden <input>)
 *   2. Uploads the selected file to Cloudinary
 *   3. Switches the canvas into Inserting mode so the user can place the image
 */
export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const result = await uploadImage(file);
        window.dispatchEvent(
          new CustomEvent<CloudinaryUploadResult>("mindsketch:image-uploaded", {
            detail: result,
          })
        );
      } catch (err: any) {
        console.error("Image upload failed:", err);
        alert(err.message || "Failed to upload image. Check your Cloudinary configuration.");
      } finally {
        setIsUploading(false);
      }
    };

    input.click();
  }, []);

  return { pickImage, isUploading };
}

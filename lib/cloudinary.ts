/**
 * Client-side Cloudinary upload utility.
 *
 * Uses Cloudinary's unsigned upload endpoint — images go directly from the
 * browser to Cloudinary, so your server doesn't handle large file uploads.
 *
 * Prerequisites:
 *   Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 *   in your .env.local file (and your deployment dashboard).
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
}

export async function uploadImage(file: File): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Cloudinary credentials not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("resource_type", "image");
  formData.append("folder", "mindsketch");

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Image upload failed");
  }

  return response.json();
}

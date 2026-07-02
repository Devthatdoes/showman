import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const MAX_ARTIST_IMAGE_BYTES = 7 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const ARTIST_MEDIA_STORAGE = process.env.ARTIST_MEDIA_STORAGE;

function getArtistImageFile(formData: FormData): File | null {
  const value = formData.get("image");
  if (!(value instanceof File) || value.size === 0) return null;
  return value;
}

export async function saveArtistImageUpload(
  formData: FormData,
  options: { required: boolean },
): Promise<string | null> {
  const file = getArtistImageFile(formData);

  if (!file) {
    if (options.required) throw new Error("Artist image is required");
    return null;
  }

  const extension = IMAGE_EXTENSIONS[file.type];
  if (!extension) {
    throw new Error("Artist image must be a JPG, PNG, WebP, or GIF");
  }

  if (file.size > MAX_ARTIST_IMAGE_BYTES) {
    throw new Error("Artist image must be 7MB or smaller");
  }

  const storage = ARTIST_MEDIA_STORAGE ?? (process.env.NODE_ENV === "production" ? "" : "local");
  if (process.env.NODE_ENV === "production" && storage === "local") {
    throw new Error("Artist media storage must use durable object storage in production");
  }

  if (storage !== "local") {
    throw new Error("Configured artist media storage is not available in this build");
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "artists");
  await mkdir(uploadDir, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), bytes);

  return `/uploads/artists/${filename}`;
}

export async function deleteArtistImageUpload(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl?.startsWith("/uploads/artists/")) return;

  const storage = ARTIST_MEDIA_STORAGE ?? (process.env.NODE_ENV === "production" ? "" : "local");
  if (storage !== "local") return;

  const uploadDir = path.join(process.cwd(), "public", "uploads", "artists");
  const filename = path.basename(imageUrl);
  await unlink(path.join(uploadDir, filename)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}

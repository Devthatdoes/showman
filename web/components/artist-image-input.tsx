"use client";

import { useState } from "react";
import { fieldClassName, helpTextClassName, labelClassName } from "@/components/ui/form";

type ArtistImageInputProps = {
  existingImageUrl?: string | null;
  required?: boolean;
};

export default function ArtistImageInput({ existingImageUrl, required = false }: ArtistImageInputProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl ?? null);

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="image" className={labelClassName}>
        Artist image <span className="text-[var(--showman-danger)]">*</span>
      </label>
      {previewUrl && (
        <div className="overflow-hidden rounded-2xl border border-[var(--showman-line)] bg-black/20">
          <img src={previewUrl} alt="" className="aspect-[16/10] w-full object-cover" />
        </div>
      )}
      <input
        id="image"
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        required={required}
        className={fieldClassName}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (!file) return;
          // Blob URLs live until the document unloads, so re-picking an image
          // without revoking the previous preview leaks it. Only blob: URLs
          // are ours to revoke; the initial preview may be a server image URL.
          if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
          setPreviewUrl(URL.createObjectURL(file));
        }}
      />
      <p className={helpTextClassName}>
        This hero image drives the homepage, directory card, and public profile.
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";

const MAX_FILES = 5;
const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 50;

/** Customers attach logos, photos or short videos; files go straight to Cloudinary via an unsigned preset. */
export function RefUploader({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_REFS_PRESET;

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    if (!cloud || !preset) return setError("Uploads aren't set up yet. Send your files on WhatsApp instead.");
    const list = Array.from(files).slice(0, MAX_FILES - value.length);
    const tooBig = list.find((f) => {
      const limit = f.type.startsWith("video/") ? MAX_VIDEO_MB : MAX_IMAGE_MB;
      return f.size > limit * 1024 * 1024;
    });
    if (tooBig) {
      return setError(`"${tooBig.name}" is too large. Images/PDFs up to ${MAX_IMAGE_MB}MB, videos up to ${MAX_VIDEO_MB}MB.`);
    }
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const file of list) {
        const body = new FormData();
        body.append("file", file);
        body.append("upload_preset", preset);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, { method: "POST", body });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message ?? "Upload failed");
        urls.push(json.secure_url);
      }
      onChange([...value, ...urls]);
    } catch {
      setError("Couldn't upload that file. Try again or send it on WhatsApp.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-bold text-body">Your logo, references or a short video (optional)</span>
      <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#c9bef0] bg-[#faf7ff] px-4 text-sm font-bold text-brand-dark">
        {busy ? "Uploading…" : value.length ? `${value.length} file${value.length > 1 ? "s" : ""} attached · add more` : "Tap to attach files"}
        <input
          type="file"
          multiple
          accept="image/*,video/*,application/pdf"
          className="sr-only"
          disabled={busy || value.length >= MAX_FILES}
          onChange={(e) => {
            upload(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      <span className="text-xs text-muted">Images/PDFs up to {MAX_IMAGE_MB}MB · videos up to {MAX_VIDEO_MB}MB · max {MAX_FILES} files</span>
      {error && <span className="text-[13px] font-semibold text-accent">{error}</span>}
    </div>
  );
}

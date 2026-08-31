"use client";

import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, ImagePlus, X } from "lucide-react";
import { useState } from "react";

interface Props {
  table: "material_types" | "material_colors" | "stitching_types" | "stitching_colors";
  recordId: string;
  currentImageUrl: string | null;
  onUploaded: () => void;
}

export function MaterialImageUploader({ table, recordId, currentImageUrl, onUploaded }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("La foto debe pesar menos de 5MB.");
      return;
    }

    setError(null);
    setIsUploading(true);

    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const filePath = `${table}/${recordId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setError("No se pudo subir la foto.");
      setIsUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("gallery").getPublicUrl(filePath);

    await supabase.from(table).update({ image_url: publicUrl }).eq("id", recordId);

    setIsUploading(false);
    onUploaded();
  }

  async function handleRemove() {
    const supabase = createClient();
    await supabase.from(table).update({ image_url: null }).eq("id", recordId);
    onUploaded();
  }

  return (
    <div className="flex items-center gap-2">
      {currentImageUrl ? (
        <div className="relative h-12 w-12 overflow-hidden rounded-md border border-black/10 dark:border-white/10">
          <img src={currentImageUrl} alt="" className="h-full w-full object-cover" />
          <button
            onClick={handleRemove}
            className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl bg-black/70 text-white"
          >
            <X size={10} />
          </button>
        </div>
      ) : (
        <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-md border border-dashed border-black/20 text-muted transition hover:border-black/40 dark:border-white/20">
          <ImagePlus size={16} />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isUploading}
            onChange={handleUpload}
          />
        </label>
      )}
      {isUploading ? <span className="text-xs text-muted">Subiendo...</span> : null}
      {error ? (
        <span className="flex items-center gap-1 text-xs text-brand-red">
          <AlertTriangle size={11} /> {error}
        </span>
      ) : null}
    </div>
  );
}
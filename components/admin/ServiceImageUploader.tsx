"use client";

import { createClient } from "@/lib/supabase/client";
import { ImagePlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ServiceImageUploader({
  serviceId,
  currentImageUrl,
}: {
  serviceId: string;
  currentImageUrl: string | null;
}) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const filePath = `services/${serviceId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(filePath, file, { upsert: true });

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("gallery").getPublicUrl(filePath);

      await supabase.from("services").update({ image_url: publicUrl }).eq("id", serviceId);
      router.refresh();
    }

    setIsUploading(false);
  }

  async function handleRemove() {
    const supabase = createClient();
    await supabase.from("services").update({ image_url: null }).eq("id", serviceId);
    router.refresh();
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        Foto representativa
      </label>
      <div className="flex items-center gap-3">
        {currentImageUrl ? (
          <div className="relative h-20 w-20 overflow-hidden rounded-md border border-black/10 dark:border-white/10">
            <img src={currentImageUrl} alt="" className="h-full w-full object-cover" />
            <button
              onClick={handleRemove}
              className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
            >
              <X size={12} />
            </button>
          </div>
        ) : null}

        <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-black/20 text-muted transition hover:border-black/40 dark:border-white/20">
          <ImagePlus size={20} />
          <span className="text-[10px]">{isUploading ? "Subiendo..." : "Subir"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isUploading}
            onChange={handleUpload}
          />
        </label>
      </div>
    </div>
  );
}
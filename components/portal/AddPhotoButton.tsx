"use client";

import { createClient } from "@/lib/supabase/client";
import { ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddPhotoButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setError(null);
    setIsUploading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu sesión expiró.");
      setIsUploading(false);
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Cada foto debe pesar menos de 5MB.");
        continue;
      }
      if (!file.type.startsWith("image/")) {
        setError("Solo se permiten imágenes.");
        continue;
      }

      const fileExt = file.name.split(".").pop();
      const filePath = `${orderId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("order-photos")
        .upload(filePath, file);

      if (uploadError) continue;

      const {
        data: { publicUrl },
      } = supabase.storage.from("order-photos").getPublicUrl(filePath);

      await supabase.from("order_photos").insert({
        order_id: orderId,
        url: publicUrl,
        uploaded_by: user.id,
      });
    }

    event.target.value = "";
    router.refresh();
    setIsUploading(false);
  }

  return (
    <div>
      <label className="flex w-fit cursor-pointer items-center gap-1.5 rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5">
        <ImagePlus size={14} />
        {isUploading ? "Subiendo..." : "Agregar foto"}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={isUploading}
          onChange={handleUpload}
        />
      </label>
      {error ? <p className="mt-1 text-xs text-brand-red">{error}</p> : null}
    </div>
  );
}
"use client";

import { createClient } from "@/lib/supabase/client";
import { Camera, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function StaffAvatarUploader({
  currentAvatarUrl,
  fullName,
  role,
}: {
  currentAvatarUrl: string | null;
  fullName: string;
  role: string;
}) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setError("La foto debe pesar menos de 3MB.");
      return;
    }

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

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setError("No se pudo subir la foto. Intenta de nuevo.");
      setIsUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    await supabase
      .from("profiles")
      .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
      .eq("id", user.id);

    router.refresh();
    setIsUploading(false);
  }

  const initial = fullName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
      <div className="relative">
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt=""
            className="h-24 w-24 rounded-full border border-black/10 object-cover dark:border-white/10"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-black/10 bg-brand-yellow/20 text-2xl font-semibold text-brand-yellow-dark dark:border-white/10 dark:text-brand-yellow">
            {initial !== "?" ? initial : <User size={32} />}
          </div>
        )}
        <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-brand-black text-white shadow dark:bg-white dark:text-brand-black">
          <Camera size={15} />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isUploading}
            onChange={handleUpload}
          />
        </label>
      </div>
      <div className="text-center sm:text-left">
        <p className="text-lg font-semibold text-foreground">{fullName || "Sin nombre"}</p>
        <p className="text-xs capitalize text-muted">{role}</p>
        <p className="mt-1 text-xs text-muted">
          {isUploading ? "Subiendo..." : "Click en la cámara para cambiar tu foto"}
        </p>
        {error ? <p className="text-xs text-brand-red">{error}</p> : null}
      </div>
    </div>
  );
}
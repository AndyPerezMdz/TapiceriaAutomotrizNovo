"use client";

import { createClient } from "@/lib/supabase/client";
import { Camera, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AvatarUploader({
  currentAvatarUrl,
  fullName,
}: {
  currentAvatarUrl: string | null;
  fullName: string;
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
    <div className="flex items-center gap-4">
      <div className="relative">
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt=""
            className="h-16 w-16 rounded-full border border-black/10 object-cover dark:border-white/10"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-black/10 bg-brand-yellow/20 text-lg font-semibold text-brand-yellow-dark dark:border-white/10 dark:text-brand-yellow">
            {initial !== "?" ? initial : <User size={22} />}
          </div>
        )}
        <label className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-brand-black text-white shadow dark:bg-white dark:text-brand-black">
          <Camera size={12} />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isUploading}
            onChange={handleUpload}
          />
        </label>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Foto de perfil</p>
        <p className="text-xs text-muted">
          {isUploading ? "Subiendo..." : "Click en el ícono para cambiarla"}
        </p>
        {error ? <p className="text-xs text-brand-red">{error}</p> : null}
      </div>
    </div>
  );
}
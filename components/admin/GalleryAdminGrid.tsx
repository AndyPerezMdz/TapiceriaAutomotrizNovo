"use client";

import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface GalleryItem {
  id: string;
  image_before_url: string | null;
  image_after_url: string | null;
  caption: string | null;
}

export function GalleryAdminGrid({
  items,
  isAdmin,
}: {
  items: GalleryItem[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const confirmed = window.confirm("¿Eliminar esta foto de la galería?");
    if (!confirmed) return;

    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("gallery_items").delete().eq("id", id);

    if (error) {
      alert("No se pudo eliminar. Intenta de nuevo.");
      setDeletingId(null);
      return;
    }

    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-black/15 bg-surface p-16 text-center dark:border-white/15">
        <p className="text-muted">Aún no hay fotos en la galería.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="overflow-hidden rounded-lg border border-black/10 bg-surface dark:border-white/10"
        >
          <div className="grid grid-cols-2 gap-0.5 bg-black/10 dark:bg-white/10">
            {item.image_before_url ? (
              <img
                src={item.image_before_url}
                alt="Antes"
                className="aspect-square object-cover"
              />
            ) : null}
            {item.image_after_url ? (
              <img
                src={item.image_after_url}
                alt="Después"
                className="aspect-square object-cover"
              />
            ) : null}
          </div>
          <div className="flex items-center justify-between p-3">
            <p className="truncate text-sm text-muted">
              {item.caption ?? "Sin descripción"}
            </p>
            {isAdmin ? (
              <button
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                className="shrink-0 text-muted transition hover:text-brand-red disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
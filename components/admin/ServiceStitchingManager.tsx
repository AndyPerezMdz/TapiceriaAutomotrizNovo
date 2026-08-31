"use client";

import { MaterialImageUploader } from "@/components/admin/MaterialImageUploader";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface StitchingColor {
  id: string;
  name: string;
  hex_color: string | null;
  image_url: string | null;
}

interface StitchingType {
  id: string;
  name: string;
  price_hint: string | null;
  image_url: string | null;
  colors: StitchingColor[];
}

const inputClassName =
  "rounded-md border border-black/15 bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15";

export function ServiceStitchingManager({ serviceId }: { serviceId: string }) {
  const [items, setItems] = useState<StitchingType[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newHint, setNewHint] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editHint, setEditHint] = useState("");
  const [colorForms, setColorForms] = useState<Record<string, { name: string; hex: string }>>({});

  async function load() {
    const supabase = createClient();
    const { data: types } = await supabase
      .from("stitching_types")
      .select("id, name, price_hint, image_url")
      .eq("service_id", serviceId)
      .order("order", { ascending: true });

    if (!types) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data: colors } = await supabase
      .from("stitching_colors")
      .select("id, name, hex_color, image_url, stitching_type_id")
      .in("stitching_type_id", types.map((t) => t.id));

    setItems(
      types.map((t) => ({
        ...t,
        colors: colors?.filter((c) => c.stitching_type_id === t.id) ?? [],
      })),
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  async function addType() {
    if (!newName.trim()) return;
    const supabase = createClient();
    await supabase.from("stitching_types").insert({
      service_id: serviceId,
      name: newName.trim(),
      price_hint: newHint.trim() || null,
      order: items.length,
    });
    setNewName("");
    setNewHint("");
    load();
  }

  async function saveEdit(id: string) {
    const supabase = createClient();
    await supabase
      .from("stitching_types")
      .update({ name: editName.trim(), price_hint: editHint.trim() || null })
      .eq("id", id);
    setEditingId(null);
    load();
  }

  async function deleteType(id: string) {
    if (!confirm("¿Eliminar este tipo de costura y sus colores?")) return;
    const supabase = createClient();
    await supabase.from("stitching_types").delete().eq("id", id);
    load();
  }

  async function addColor(typeId: string) {
    const form = colorForms[typeId];
    if (!form?.name.trim()) return;
    const supabase = createClient();
    await supabase.from("stitching_colors").insert({
      stitching_type_id: typeId,
      name: form.name.trim(),
      hex_color: form.hex || null,
    });
    setColorForms((prev) => ({ ...prev, [typeId]: { name: "", hex: "" } }));
    load();
  }

  async function deleteColor(id: string) {
    const supabase = createClient();
    await supabase.from("stitching_colors").delete().eq("id", id);
    load();
  }

  if (loading) return <p className="text-sm text-muted">Cargando costuras...</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-brand-yellow/30 bg-brand-yellow/10 p-3 text-xs text-brand-yellow-dark dark:text-brand-yellow">
        <strong>Regla para las fotos:</strong> la imagen debe mostrar únicamente el tipo de
        costura, de cerca y de punta a punta, sin ningún otro objeto en la foto.
      </div>

      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10">
          {editingId === item.id ? (
            <div className="flex flex-wrap items-center gap-2">
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClassName} placeholder="Nombre" />
              <input value={editHint} onChange={(e) => setEditHint(e.target.value)} className={inputClassName} placeholder="Precio de referencia" />
              <button onClick={() => saveEdit(item.id)} className="rounded-md bg-brand-black px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-brand-black">
                Guardar
              </button>
              <button onClick={() => setEditingId(null)} className="text-muted hover:text-foreground">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <MaterialImageUploader
                  table="stitching_types"
                  recordId={item.id}
                  currentImageUrl={item.image_url}
                  onUploaded={load}
                />
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  {item.price_hint ? <p className="text-xs text-muted">{item.price_hint}</p> : null}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditingId(item.id);
                    setEditName(item.name);
                    setEditHint(item.price_hint ?? "");
                  }}
                  className="rounded-md p-1.5 text-muted transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
                >
                  <Pencil size={14} />
                </button>
                <button onClick={() => deleteType(item.id)} className="rounded-md p-1.5 text-muted transition hover:bg-brand-red/10 hover:text-brand-red">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="mt-3 space-y-2 border-t border-black/10 pt-3 dark:border-white/10">
            {item.colors.map((color) => (
              <div key={color.id} className="flex items-center justify-between gap-2 rounded-md border border-black/10 px-2.5 py-1.5 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <MaterialImageUploader
                    table="stitching_colors"
                    recordId={color.id}
                    currentImageUrl={color.image_url}
                    onUploaded={load}
                  />
                  {!color.image_url && color.hex_color ? (
                    <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: color.hex_color }} />
                  ) : null}
                  <span className="text-sm text-foreground">{color.name}</span>
                </div>
                <button onClick={() => deleteColor(color.id)} className="text-muted hover:text-brand-red">
                  <X size={13} />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-1.5 pt-1">
              <input
                value={colorForms[item.id]?.name ?? ""}
                onChange={(e) =>
                  setColorForms((prev) => ({
                    ...prev,
                    [item.id]: { ...prev[item.id], name: e.target.value, hex: prev[item.id]?.hex ?? "" },
                  }))
                }
                placeholder="Nombre del color"
                className={`${inputClassName} w-32`}
              />
              <input
                type="color"
                value={colorForms[item.id]?.hex || "#000000"}
                onChange={(e) =>
                  setColorForms((prev) => ({
                    ...prev,
                    [item.id]: { name: prev[item.id]?.name ?? "", hex: e.target.value },
                  }))
                }
                className="h-8 w-8 rounded border border-black/15 dark:border-white/15"
              />
              <button onClick={() => addColor(item.id)} className="rounded-md border border-black/15 p-1.5 text-foreground transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="rounded-lg border border-dashed border-black/20 p-4 dark:border-white/20">
        <p className="mb-2 text-sm font-medium text-foreground">Agregar tipo de costura</p>
        <div className="flex flex-wrap gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre (ej. Costura doble)" className={inputClassName} />
          <input value={newHint} onChange={(e) => setNewHint(e.target.value)} placeholder="Precio de referencia (opcional)" className={inputClassName} />
          <button onClick={addType} className="flex items-center gap-1 rounded-md bg-brand-black px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-brand-black">
            <Plus size={14} /> Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
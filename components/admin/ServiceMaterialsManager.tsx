"use client";

import { MaterialImageUploader } from "@/components/admin/MaterialImageUploader";
import { useConfirm } from "@/lib/hooks/useConfirm";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface MaterialColor {
  id: string;
  name: string;
  hex_color: string | null;
  image_url: string | null;
}

interface MaterialType {
  id: string;
  name: string;
  price_hint: string | null;
  image_url: string | null;
  colors: MaterialColor[];
}

const inputClassName =
  "rounded-md border border-black/15 bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15";

export function ServiceMaterialsManager({ serviceId }: { serviceId: string }) {
  const { confirm, dialog } = useConfirm();
  const [materials, setMaterials] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);

  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialHint, setNewMaterialHint] = useState("");
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editHint, setEditHint] = useState("");

  const [colorForms, setColorForms] = useState<Record<string, { name: string; hex: string }>>(
    {},
  );

  async function loadMaterials() {
    const supabase = createClient();
    const { data: types } = await supabase
      .from("material_types")
      .select("id, name, price_hint, image_url")
      .eq("service_id", serviceId)
      .order("order", { ascending: true });

    if (!types) {
      setMaterials([]);
      setLoading(false);
      return;
    }

    const { data: colors } = await supabase
      .from("material_colors")
      .select("id, name, hex_color, image_url, material_type_id")
      .in("material_type_id", types.map((t) => t.id));

    setMaterials(
      types.map((t) => ({
        ...t,
        colors: colors?.filter((c) => c.material_type_id === t.id) ?? [],
      })),
    );
    setLoading(false);
  }

  useEffect(() => {
    loadMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  async function addMaterial() {
    if (!newMaterialName.trim()) return;
    const supabase = createClient();
    await supabase.from("material_types").insert({
      service_id: serviceId,
      name: newMaterialName.trim(),
      price_hint: newMaterialHint.trim() || null,
      order: materials.length,
    });
    setNewMaterialName("");
    setNewMaterialHint("");
    loadMaterials();
  }

  async function saveEditMaterial(id: string) {
    const supabase = createClient();
    await supabase
      .from("material_types")
      .update({ name: editName.trim(), price_hint: editHint.trim() || null })
      .eq("id", id);
    setEditingMaterialId(null);
    loadMaterials();
  }

  async function deleteMaterial(id: string) {
    const ok = await confirm({
      title: "Eliminar material",
      description: "Se eliminará este material y todos sus colores asociados.",
      confirmLabel: "Sí, eliminar",
    });
    if (!ok) return;
    const supabase = createClient();
    await supabase.from("material_types").delete().eq("id", id);
    loadMaterials();
  }

  async function addColor(materialId: string) {
    const form = colorForms[materialId];
    if (!form?.name.trim()) return;
    const supabase = createClient();
    await supabase.from("material_colors").insert({
      material_type_id: materialId,
      name: form.name.trim(),
      hex_color: form.hex || null,
    });
    setColorForms((prev) => ({ ...prev, [materialId]: { name: "", hex: "" } }));
    loadMaterials();
  }

  async function deleteColor(id: string) {
    const supabase = createClient();
    await supabase.from("material_colors").delete().eq("id", id);
    loadMaterials();
  }

  if (loading) {
    return <p className="text-sm text-muted">Cargando materiales...</p>;
  }

  return (
    <div className="space-y-4">
      {dialog}
      <div className="rounded-md border border-brand-yellow/30 bg-brand-yellow/10 p-3 text-xs text-brand-yellow-dark dark:text-brand-yellow">
        <strong>Regla para las fotos:</strong> la imagen debe mostrar únicamente el material, de
        punta a punta, sin fondo, personas, ni ningún otro objeto en la foto.
      </div>

      {materials.map((material) => (
        <div
          key={material.id}
          className="rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10"
        >
          {editingMaterialId === material.id ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={inputClassName}
                placeholder="Nombre"
              />
              <input
                value={editHint}
                onChange={(e) => setEditHint(e.target.value)}
                className={inputClassName}
                placeholder="Precio de referencia (ej. Desde $2,000)"
              />
              <button
                onClick={() => saveEditMaterial(material.id)}
                className="rounded-md bg-brand-black px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-brand-black"
              >
                Guardar
              </button>
              <button
                onClick={() => setEditingMaterialId(null)}
                className="text-muted hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <MaterialImageUploader
                  table="material_types"
                  recordId={material.id}
                  currentImageUrl={material.image_url}
                  onUploaded={loadMaterials}
                />
                <div>
                  <p className="font-medium text-foreground">{material.name}</p>
                  {material.price_hint ? (
                    <p className="text-xs text-muted">{material.price_hint}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditingMaterialId(material.id);
                    setEditName(material.name);
                    setEditHint(material.price_hint ?? "");
                  }}
                  className="rounded-md p-1.5 text-muted transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteMaterial(material.id)}
                  className="rounded-md p-1.5 text-muted transition hover:bg-brand-red/10 hover:text-brand-red"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Colores de este material */}
          <div className="mt-3 space-y-2 border-t border-black/10 pt-3 dark:border-white/10">
            {material.colors.map((color) => (
              <div
                key={color.id}
                className="flex items-center justify-between gap-2 rounded-md border border-black/10 px-2.5 py-1.5 dark:border-white/10"
              >
                <div className="flex items-center gap-2">
                  <MaterialImageUploader
                    table="material_colors"
                    recordId={color.id}
                    currentImageUrl={color.image_url}
                    onUploaded={loadMaterials}
                  />
                  {!color.image_url && color.hex_color ? (
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: color.hex_color }}
                    />
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
                value={colorForms[material.id]?.name ?? ""}
                onChange={(e) =>
                  setColorForms((prev) => ({
                    ...prev,
                    [material.id]: { ...prev[material.id], name: e.target.value, hex: prev[material.id]?.hex ?? "" },
                  }))
                }
                placeholder="Nombre del color"
                className={`${inputClassName} w-32`}
              />
              <input
                type="color"
                value={colorForms[material.id]?.hex || "#000000"}
                onChange={(e) =>
                  setColorForms((prev) => ({
                    ...prev,
                    [material.id]: { name: prev[material.id]?.name ?? "", hex: e.target.value },
                  }))
                }
                title="Solo para colores lisos; si el color tiene textura, súbele una foto después de crearlo"
                className="h-8 w-8 rounded border border-black/15 dark:border-white/15"
              />
              <button
                onClick={() => addColor(material.id)}
                className="rounded-md border border-black/15 p-1.5 text-foreground transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Agregar nuevo material */}
      <div className="rounded-lg border border-dashed border-black/20 p-4 dark:border-white/20">
        <p className="mb-2 text-sm font-medium text-foreground">Agregar material</p>
        <div className="flex flex-wrap gap-2">
          <input
            value={newMaterialName}
            onChange={(e) => setNewMaterialName(e.target.value)}
            placeholder="Nombre (ej. Piel)"
            className={inputClassName}
          />
          <input
            value={newMaterialHint}
            onChange={(e) => setNewMaterialHint(e.target.value)}
            placeholder="Precio de referencia (opcional)"
            className={inputClassName}
          />
          <button
            onClick={addMaterial}
            className="flex items-center gap-1 rounded-md bg-brand-black px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-brand-black"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
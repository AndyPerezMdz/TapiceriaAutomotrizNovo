"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface Service {
  id: string;
  slug: string;
  title: string;
}

interface MaterialType {
  id: string;
  name: string;
  price_hint: string | null;
}

interface MaterialColor {
  id: string;
  name: string;
  hex_color: string | null;
  requires_visit: boolean;
}

interface Props {
  services: Service[];
  onSelectionChange: (selection: {
    serviceId: string | null;
    materialTypeId: string | null;
    materialColorId: string | null;
    requiresVisit: boolean;
  }) => void;
}

export function ServiceMaterialSelector({ services, onSelectionChange }: Props) {
  const [serviceId, setServiceId] = useState<string>("");
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [materialTypeId, setMaterialTypeId] = useState<string>("");
  const [colors, setColors] = useState<MaterialColor[]>([]);
  const [materialColorId, setMaterialColorId] = useState<string>("");
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  useEffect(() => {
    setMaterialTypeId("");
    setColors([]);
    setMaterialColorId("");

    if (!serviceId) {
      setMaterialTypes([]);
      return;
    }

    setLoadingMaterials(true);
    const supabase = createClient();
    supabase
      .from("material_types")
      .select("id, name, price_hint")
      .eq("service_id", serviceId)
      .eq("is_active", true)
      .order("order", { ascending: true })
      .then(({ data }) => {
        setMaterialTypes(data ?? []);
        setLoadingMaterials(false);
      });
  }, [serviceId]);

  useEffect(() => {
    setColors([]);
    setMaterialColorId("");

    if (!materialTypeId) return;

    const supabase = createClient();
    supabase
      .from("material_colors")
      .select("id, name, hex_color, requires_visit")
      .eq("material_type_id", materialTypeId)
      .eq("is_active", true)
      .order("order", { ascending: true })
      .then(({ data }) => setColors(data ?? []));
  }, [materialTypeId]);

  useEffect(() => {
    const selectedColor = colors.find((c) => c.id === materialColorId);
    onSelectionChange({
      serviceId: serviceId || null,
      materialTypeId: materialTypeId || null,
      materialColorId: materialColorId || null,
      requiresVisit: selectedColor?.requires_visit ?? false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, materialTypeId, materialColorId, colors]);

  const selectedMaterial = materialTypes.find((m) => m.id === materialTypeId);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Servicio
        </label>
        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15"
        >
          <option value="">Selecciona un servicio</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      {serviceId && !loadingMaterials && materialTypes.length > 0 ? (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Material
          </label>
          <select
            value={materialTypeId}
            onChange={(e) => setMaterialTypeId(e.target.value)}
            className="w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15"
          >
            <option value="">Selecciona un material</option>
            {materialTypes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} {m.price_hint ? `· ${m.price_hint}` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {materialTypeId && colors.length > 0 ? (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setMaterialColorId(c.id)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                  materialColorId === c.id
                    ? "border-brand-black bg-black/5 dark:border-white dark:bg-white/10"
                    : "border-black/15 text-muted hover:border-black/30 dark:border-white/15"
                }`}
              >
                {c.hex_color ? (
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-black/10"
                    style={{ backgroundColor: c.hex_color }}
                  />
                ) : null}
                {c.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {selectedMaterial?.price_hint ? (
        <p className="text-xs text-muted">
          Precio de referencia: {selectedMaterial.price_hint}. El precio final se
          confirma al revisar tu solicitud.
        </p>
      ) : null}
    </div>
  );
}
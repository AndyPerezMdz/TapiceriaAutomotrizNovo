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

export interface MaterialSelection {
  serviceId: string | null;
  serviceName: string | null;
  materialTypeId: string | null;
  materialName: string | null;
  materialColorId: string | null;
  colorName: string | null;
  priceHint: string | null;
  requiresVisit: boolean;
}

interface Props {
  services: Service[];
  onSelectionChange: (selection: MaterialSelection) => void;
  initialServiceId?: string;
  initialMaterialTypeId?: string;
  initialMaterialColorId?: string;
}

export function ServiceMaterialSelector({
  services,
  onSelectionChange,
  initialServiceId,
  initialMaterialTypeId,
  initialMaterialColorId,
}: Props) {
  const [serviceId, setServiceId] = useState<string>(initialServiceId ?? "");
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [materialTypeId, setMaterialTypeId] = useState<string>("");
  const [colors, setColors] = useState<MaterialColor[]>([]);
  const [materialColorId, setMaterialColorId] = useState<string>("");
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  useEffect(() => {
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
        if (!initialMaterialTypeId || materialTypeId) {
          setMaterialTypeId("");
          setColors([]);
          setMaterialColorId("");
        } else {
          setMaterialTypeId(initialMaterialTypeId);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  useEffect(() => {
    if (!materialTypeId) {
      setColors([]);
      return;
    }

    const supabase = createClient();
    supabase
      .from("material_colors")
      .select("id, name, hex_color, requires_visit")
      .eq("material_type_id", materialTypeId)
      .eq("is_active", true)
      .order("order", { ascending: true })
      .then(({ data }) => {
        setColors(data ?? []);
        if (initialMaterialColorId && !materialColorId) {
          setMaterialColorId(initialMaterialColorId);
        } else if (!initialMaterialColorId) {
          setMaterialColorId("");
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialTypeId]);

  useEffect(() => {
    const selectedService = services.find((s) => s.id === serviceId);
    const selectedMaterial = materialTypes.find((m) => m.id === materialTypeId);
    const selectedColor = colors.find((c) => c.id === materialColorId);

    onSelectionChange({
      serviceId: serviceId || null,
      serviceName: selectedService?.title ?? null,
      materialTypeId: materialTypeId || null,
      materialName: selectedMaterial?.name ?? null,
      materialColorId: materialColorId || null,
      colorName: selectedColor?.name ?? null,
      priceHint: selectedMaterial?.price_hint ?? null,
      requiresVisit: selectedColor?.requires_visit ?? false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, materialTypeId, materialColorId, colors, materialTypes]);

  const selectedColor = colors.find((c) => c.id === materialColorId);

  return (
    <div className="space-y-6">
      <div role="radiogroup" aria-label="Servicio">
        <p className="mb-2.5 text-[15px] font-semibold text-foreground">Servicio</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {services.map((s) => {
            const active = serviceId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setServiceId(s.id)}
                className={`min-h-[72px] rounded-xl px-3.5 py-3 text-left text-base font-semibold leading-snug transition ${
                  active
                    ? "border-2 border-foreground bg-highlight text-foreground"
                    : "border-[1.5px] border-field-border bg-surface text-foreground hover:border-foreground"
                }`}
              >
                {s.title}
              </button>
            );
          })}
        </div>
      </div>

      {serviceId && loadingMaterials ? (
        <p className="text-[15px] text-muted">Cargando materiales…</p>
      ) : null}

      {serviceId && !loadingMaterials && materialTypes.length > 0 ? (
        <div role="radiogroup" aria-label="Material">
          <p className="mb-2.5 text-[15px] font-semibold text-foreground">Material</p>
          <div className="flex flex-wrap gap-2">
            {materialTypes.map((m) => {
              const active = materialTypeId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMaterialTypeId(m.id)}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[15px] transition ${
                    active
                      ? "bg-ink font-semibold text-brand-yellow dark:ring-1 dark:ring-white/10"
                      : "border-[1.5px] border-field-border bg-surface text-foreground hover:border-foreground"
                  }`}
                >
                  {m.name}
                  {m.price_hint ? (
                    <span className={active ? "text-on-ink-muted" : "text-muted"}>· {m.price_hint}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {materialTypeId && colors.length > 0 ? (
        <div role="radiogroup" aria-label="Color">
          <p className="mb-2.5 text-[15px] font-semibold text-foreground">
            Color
            {selectedColor ? (
              <span className="font-medium text-muted"> · {selectedColor.name}</span>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-3">
            {colors.map((c) => {
              const active = materialColorId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={c.requires_visit ? `${c.name} (requiere visita)` : c.name}
                  title={c.name}
                  onClick={() => setMaterialColorId(c.id)}
                  className={`relative h-12 w-12 rounded-full transition ${
                    active
                      ? "ring-2 ring-foreground ring-offset-[3px] ring-offset-surface"
                      : "ring-1 ring-black/10 hover:scale-105 dark:ring-white/15"
                  }`}
                  style={{ backgroundColor: c.hex_color ?? "#cfcac0" }}
                >
                  {!c.hex_color ? (
                    <span className="text-[11px] font-semibold text-ink">{c.name.slice(0, 3)}</span>
                  ) : null}
                  {c.requires_visit ? (
                    <span
                      aria-hidden="true"
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-yellow text-[11px] font-bold text-ink ring-2 ring-surface"
                    >
                      !
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {colors.some((c) => c.requires_visit) ? (
            <p className="mt-2.5 text-[15px] text-muted">
              Los colores con <span className="font-semibold text-foreground">!</span> necesitan
              una visita para igualar el tono.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

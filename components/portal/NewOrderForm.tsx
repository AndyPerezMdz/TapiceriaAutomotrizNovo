"use client";

import { StorageImage } from "@/components/shared/StorageImage";

import {
  ServiceMaterialSelector,
  type MaterialSelection,
} from "@/components/portal/ServiceMaterialSelector";
import { CouponSelector } from "@/components/portal/CouponSelector";
import { buildWhatsAppLink } from "@/lib/constants/business";
import { createClient } from "@/lib/supabase/client";
import { newOrderSchema, type NewOrderFormData } from "@/lib/validations/order";
import { Check, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { WhatsAppLink } from "../shared/WhatsAppLink";
import {
  buttonClass,
  fieldClass,
  fieldErrorClass,
  labelClass,
  textareaClass,
} from "@/components/taller";

function NumberedSection({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="min-w-0 rounded-[18px] bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5">
      <legend className="float-left mb-5 flex w-full items-center gap-3 p-0">
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-ink font-display text-lg font-extrabold text-brand-yellow dark:ring-1 dark:ring-white/10">
          {n}
        </span>
        <span className="font-display text-[26px] font-bold uppercase leading-none text-foreground">
          {title}
        </span>
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE_MB = 5;

interface Service {
  id: string;
  slug: string;
  title: string;
}

interface StackLine {
  key: string;
  selection: MaterialSelection;
}

const emptySelection: MaterialSelection = {
  serviceId: null,
  serviceName: null,
  materialTypeId: null,
  materialName: null,
  materialColorId: null,
  colorName: null,
  priceHint: null,
  requiresVisit: false,
};

export function NewOrderForm({ services }: { services: Service[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repeatOrderId = searchParams.get("repeat");
  const preselectedService = searchParams.get("service");

  const [stack, setStack] = useState<StackLine[]>([
    { key: crypto.randomUUID(), selection: emptySelection },
  ]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);

  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [description, setDescription] = useState("");

  const [initialLoaded, setInitialLoaded] = useState(false);

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState
    <Partial<Record<keyof NewOrderFormData, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("business_settings")
      .select("whatsapp")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data) setWhatsappNumber(data.whatsapp);
      });
  }, []);

  // Precarga: repetir pedido (trae todas las líneas del stack original) o preseleccionar servicio
  useEffect(() => {
    if (initialLoaded) return;

    if (repeatOrderId) {
      const supabase = createClient();
      Promise.all([
        supabase
          .from("orders")
          .select("vehicle_make, vehicle_model, vehicle_year")
          .eq("id", repeatOrderId)
          .single(),
        supabase
          .from("order_items")
          .select("service_id, material_type_id, material_color_id, services(title), material_types(name), material_colors(name)")
          .eq("order_id", repeatOrderId)
          .order("order", { ascending: true }),
      ]).then(([orderRes, itemsRes]) => {
        if (orderRes.data) {
          setVehicleMake(orderRes.data.vehicle_make ?? "");
          setVehicleModel(orderRes.data.vehicle_model ?? "");
          setVehicleYear(orderRes.data.vehicle_year ? String(orderRes.data.vehicle_year) : "");
        }
        if (itemsRes.data && itemsRes.data.length > 0) {
          setStack(
            itemsRes.data.map((item) => ({
              key: crypto.randomUUID(),
              selection: {
                serviceId: item.service_id,
                serviceName: (item.services as unknown as { title: string } | null)?.title ?? null,
                materialTypeId: item.material_type_id,
                materialName: (item.material_types as unknown as { name: string } | null)?.name ?? null,
                materialColorId: item.material_color_id,
                colorName: (item.material_colors as unknown as { name: string } | null)?.name ?? null,
                priceHint: null,
                requiresVisit: false,
              },
            })),
          );
        }
        setInitialLoaded(true);
      });
    } else if (preselectedService) {
      setStack([
        {
          key: crypto.randomUUID(),
          selection: { ...emptySelection, serviceId: preselectedService },
        },
      ]);
      setInitialLoaded(true);
    } else {
      setInitialLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeatOrderId, preselectedService]);

  function updateLine(key: string, selection: MaterialSelection) {
    setStack((prev) => prev.map((line) => (line.key === key ? { ...line, selection } : line)));
  }

  function addLine() {
    setStack((prev) => [...prev, { key: crypto.randomUUID(), selection: emptySelection }]);
  }

  function removeLine(key: string) {
    setStack((prev) => (prev.length > 1 ? prev.filter((line) => line.key !== key) : prev));
    if (selectedCouponId) setSelectedCouponId(null);
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setPhotoError(null);

    if (photos.length + files.length > MAX_PHOTOS) {
      setPhotoError(`Puedes subir un máximo de ${MAX_PHOTOS} fotos.`);
      return;
    }

    const tooLarge = files.find((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (tooLarge) {
      setPhotoError(`Cada foto debe pesar menos de ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const notImage = files.find((f) => !f.type.startsWith("image/"));
    if (notImage) {
      setPhotoError("Solo se permiten archivos de imagen.");
      return;
    }

    setPhotos((prev) => [...prev, ...files]);
    event.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  const anyRequiresVisit = stack.some((line) => line.selection.requiresVisit);
  const serviceIds = stack.map((line) => line.selection.serviceId).filter(Boolean) as string[];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setIsLoading(true);

    const firstServiceId = stack[0]?.selection.serviceId ?? "";
    const values = {
      serviceId: firstServiceId,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      serviceDescription: description,
    };

    const parsed = newOrderSchema.safeParse(values);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        serviceId: errors.serviceId?.[0],
        vehicleMake: errors.vehicleMake?.[0],
        vehicleModel: errors.vehicleModel?.[0],
        vehicleYear: errors.vehicleYear?.[0],
        serviceDescription: errors.serviceDescription?.[0],
      });
      setIsLoading(false);
      return;
    }

    const incompleteLine = stack.find((line) => !line.selection.serviceId);
    if (incompleteLine) {
      setFormError("Elige un servicio en cada línea, o quita las líneas vacías.");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setFormError("Tu sesión expiró. Inicia sesión de nuevo.");
      setIsLoading(false);
      return;
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        client_id: user.id,
        vehicle_make: parsed.data.vehicleMake,
        vehicle_model: parsed.data.vehicleModel,
        vehicle_year: Number(parsed.data.vehicleYear),
        service_description: parsed.data.serviceDescription,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      setFormError("No se pudo crear el pedido. Intenta de nuevo.");
      setIsLoading(false);
      return;
    }

    const itemsToInsert = stack.map((line, index) => ({
      order_id: order.id,
      service_id: line.selection.serviceId,
      material_type_id: line.selection.materialTypeId,
      material_color_id: line.selection.materialColorId,
      order: index,
    }));

    await supabase.from("order_items").insert(itemsToInsert);

    if (selectedCouponId) {
      await supabase.rpc("apply_coupon_to_order", {
        p_coupon_id: selectedCouponId,
        p_order_id: order.id,
      });
    }

    for (const photo of photos) {
      const fileExt = photo.name.split(".").pop();
      const filePath = `${order.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("order-photos")
        .upload(filePath, photo);

      if (uploadError) continue;

      const {
        data: { publicUrl },
      } = supabase.storage.from("order-photos").getPublicUrl(filePath);

      await supabase.from("order_photos").insert({
        order_id: order.id,
        url: publicUrl,
        uploaded_by: user.id,
      });
    }

    fetch("/api/notify/new-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id }),
    }).catch(() => {});

    router.push(`/portal/pedidos/${order.id}`);
    router.refresh();
  }

  const vehicleSummary = [vehicleMake, vehicleModel, vehicleYear].filter(Boolean).join(" ");

  if (!initialLoaded) {
    return <p className="text-[15px] text-muted">Cargando...</p>;
  }

  const missing = [
    stack.some((l) => !l.selection.serviceId) ? "el servicio" : null,
    !vehicleMake || !vehicleModel ? "tu vehículo" : null,
    !vehicleYear ? "el año" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-wrap items-start gap-7">
      <form
        id="new-order-form"
        onSubmit={handleSubmit}
        className="min-w-0 flex-[999_1_480px] space-y-5"
        noValidate
      >
        {formError ? (
          <div
            role="alert"
            className="rounded-xl border-[1.5px] border-brand-red-dark/40 bg-brand-red/5 px-4 py-3 text-[15px] text-brand-red-dark dark:text-brand-red"
          >
            {formError}
          </div>
        ) : null}

        <NumberedSection n={1} title="¿Qué le hacemos?">
          <div className="space-y-6">
            {stack.map((line, index) => (
              <div
                key={line.key}
                className={index > 0 ? "border-t-2 border-dashed border-seam pt-6" : ""}
              >
                {stack.length > 1 ? (
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="font-display text-xl font-bold uppercase text-foreground">
                      Servicio {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      aria-label={`Quitar servicio ${index + 1}`}
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-muted transition hover:bg-brand-red/5 hover:text-brand-red-dark"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ) : null}
                <ServiceMaterialSelector
                  services={services}
                  onSelectionChange={(sel) => updateLine(line.key, sel)}
                  initialServiceId={line.selection.serviceId ?? undefined}
                  initialMaterialTypeId={line.selection.materialTypeId ?? undefined}
                  initialMaterialColorId={line.selection.materialColorId ?? undefined}
                />
              </div>
            ))}
          </div>

          {fieldErrors.serviceId ? <p className={fieldErrorClass}>{fieldErrors.serviceId}</p> : null}

          {!anyRequiresVisit ? (
            <>
              <div className="mt-6 border-t-2 border-dashed border-seam" />
              <button
                type="button"
                onClick={addLine}
                className="mt-3 inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-foreground"
              >
                <Plus size={18} strokeWidth={2.4} /> Agregar otro servicio a este pedido
              </button>
            </>
          ) : null}
        </NumberedSection>

        {anyRequiresVisit ? (
          <div className="rounded-2xl border-2 border-dashed border-brand-yellow-dark/50 bg-highlight p-5 sm:p-6 dark:border-brand-yellow/40">
            <p className="text-base font-semibold text-foreground">
              Este color necesita una visita al taller
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-foreground/80">
              Para pieles distintas al negro de fábrica tomamos una muestra de tu asiento y así
              igualamos el tono exacto. Agenda tu visita en línea o escríbenos.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="/portal/agendar-cita" className={buttonClass("ink")}>
                Agendar visita en línea
              </a>
              <WhatsAppLink
                href={
                  whatsappNumber
                    ? buildWhatsAppLink(
                        "Hola, quiero agendar una visita al taller para cotizar un color de piel personalizado.",
                        whatsappNumber,
                      )
                    : "#"
                }
                label="WhatsApp"
              />
            </div>
          </div>
        ) : (
          <>
            <NumberedSection n={2} title="Tu vehículo">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="vehicleMake" className={labelClass}>
                    Marca
                  </label>
                  <input
                    id="vehicleMake"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    placeholder="Nissan"
                    autoComplete="off"
                    aria-invalid={Boolean(fieldErrors.vehicleMake)}
                    className={fieldClass}
                    disabled={isLoading}
                  />
                  {fieldErrors.vehicleMake ? (
                    <p className={fieldErrorClass}>{fieldErrors.vehicleMake}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="vehicleModel" className={labelClass}>
                    Modelo
                  </label>
                  <input
                    id="vehicleModel"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Versa"
                    autoComplete="off"
                    aria-invalid={Boolean(fieldErrors.vehicleModel)}
                    className={fieldClass}
                    disabled={isLoading}
                  />
                  {fieldErrors.vehicleModel ? (
                    <p className={fieldErrorClass}>{fieldErrors.vehicleModel}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="vehicleYear" className={labelClass}>
                    Año
                  </label>
                  <input
                    id="vehicleYear"
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(e.target.value)}
                    inputMode="numeric"
                    placeholder="2020"
                    aria-invalid={Boolean(fieldErrors.vehicleYear)}
                    className={fieldClass}
                    disabled={isLoading}
                  />
                  {fieldErrors.vehicleYear ? (
                    <p className={fieldErrorClass}>{fieldErrors.vehicleYear}</p>
                  ) : null}
                </div>
              </div>
            </NumberedSection>

            <NumberedSection n={3} title="Cuéntanos más">
              <label htmlFor="serviceDescription" className={labelClass}>
                ¿Qué le pasa o qué quieres?
              </label>
              <textarea
                id="serviceDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Ej. El asiento del conductor está roto del costado y quiero costura doble en rojo."
                aria-invalid={Boolean(fieldErrors.serviceDescription)}
                className={textareaClass}
                disabled={isLoading}
              />
              {fieldErrors.serviceDescription ? (
                <p className={fieldErrorClass}>{fieldErrors.serviceDescription}</p>
              ) : null}

              <p className="mb-2.5 mt-6 text-[15px] font-semibold text-foreground">
                Fotos{" "}
                <span className="font-normal text-muted">
                  (opcional, máx. {MAX_PHOTOS} · ayudan a cotizar más rápido)
                </span>
              </p>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square overflow-hidden rounded-xl bg-seam">
                    <StorageImage src={URL.createObjectURL(photo)} alt="" fill sizes="200px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      aria-label="Quitar foto"
                      className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}

                {photos.length < MAX_PHOTOS ? (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-field-border text-[15px] font-semibold text-foreground/80 transition hover:border-foreground">
                    <ImagePlus size={22} />
                    Agregar
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={handlePhotoChange}
                      disabled={isLoading}
                    />
                  </label>
                ) : null}
              </div>
              {photoError ? <p className={fieldErrorClass}>{photoError}</p> : null}
            </NumberedSection>

            <CouponSelector
              serviceIds={serviceIds}
              selectedCouponId={selectedCouponId}
              onSelect={setSelectedCouponId}
            />
          </>
        )}
      </form>

      {/* Resumen tipo ticket */}
      <aside
        aria-label="Resumen de tu solicitud"
        className="relative min-w-0 flex-[1_1_300px] overflow-hidden rounded-[18px] bg-ink px-6 py-7 text-on-ink lg:sticky lg:top-6 dark:ring-1 dark:ring-white/10"
      >
        <p className="font-display text-[13px] font-semibold uppercase tracking-[0.18em] text-brand-yellow">
          Tu orden
        </p>
        <p className="mt-1.5 font-display text-[34px] font-extrabold uppercase leading-none">
          {vehicleSummary || "Tu vehículo"}
        </p>
        {!anyRequiresVisit && missing.length > 0 ? (
          <p className="mt-1.5 text-[15px] text-on-ink-muted">Falta {missing.join(", ")}</p>
        ) : null}

        <ul className="mt-5 space-y-3">
          {stack.map((line, index) => (
            <li key={line.key} className="flex items-start gap-2.5">
              <Check
                size={18}
                strokeWidth={2.6}
                className={`mt-0.5 shrink-0 ${line.selection.serviceId ? "text-brand-yellow" : "text-[#4a4844]"}`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">
                  {line.selection.serviceName ??
                    `Servicio ${stack.length > 1 ? index + 1 : ""} sin elegir`}
                </p>
                {line.selection.materialName ? (
                  <p className="text-[13px] text-[#bdbab3]">
                    {line.selection.materialName}
                    {line.selection.colorName ? ` · ${line.selection.colorName}` : ""}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
          {photos.length > 0 ? (
            <li className="flex items-start gap-2.5">
              <Check size={18} strokeWidth={2.6} className="mt-0.5 shrink-0 text-brand-yellow" aria-hidden="true" />
              <p className="text-[15px]">
                {photos.length} {photos.length === 1 ? "foto adjunta" : "fotos adjuntas"}
              </p>
            </li>
          ) : null}
          {selectedCouponId ? (
            <li className="flex items-start gap-2.5">
              <Check size={18} strokeWidth={2.6} className="mt-0.5 shrink-0 text-brand-yellow" aria-hidden="true" />
              <p className="text-[15px]">Cupón aplicado</p>
            </li>
          ) : null}
        </ul>

        <div className="relative my-6" aria-hidden="true">
          <span className="absolute -left-[35px] top-1/2 h-[22px] w-[22px] -translate-y-1/2 rounded-full bg-background" />
          <span className="absolute -right-[35px] top-1/2 h-[22px] w-[22px] -translate-y-1/2 rounded-full bg-background" />
          <div className="border-t-2 border-dashed border-brand-yellow/50" />
        </div>

        {anyRequiresVisit ? (
          <p className="text-[15px] leading-relaxed text-[#d9d5cc]">
            Primero agenda tu visita para tomar la muestra del color. Ahí mismo armamos tu
            cotización.
          </p>
        ) : (
          <>
            <p className="text-[15px] leading-relaxed text-[#d9d5cc]">
              Revisamos tu solicitud y te mandamos el precio de cada servicio. Tú decides si la
              aceptas.
            </p>
            <button
              type="submit"
              form="new-order-form"
              disabled={isLoading}
              className={`${buttonClass("primary", "lg")} mt-4 w-full !text-[17px] !font-bold`}
            >
              {isLoading ? "Enviando…" : "Enviar solicitud"}
            </button>
          </>
        )}
      </aside>
    </div>
  );
}

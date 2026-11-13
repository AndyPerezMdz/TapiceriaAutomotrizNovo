/** Audiencias de cupón (valor en la base de datos → cómo se muestra). */
export type CouponAudience = "nuevos" | "ambos" | "registrados" | "frecuentes" | "clientes";

/** Categoría de cada cliente; un cliente está en exactamente una. */
export type ClientSegment = "nuevo" | "no_frecuente" | "frecuente";

export const audienceOptions: { value: CouponAudience; label: string; short: string; help: string }[] = [
  {
    value: "nuevos",
    label: "Clientes nuevos (solo para ellos)",
    short: "Clientes nuevos",
    help: "Quienes todavía no tienen pedidos. Ideal para el Buen Fin o promociones en redes.",
  },
  {
    value: "ambos",
    label: "Clientes nuevos y ya registrados",
    short: "Todos",
    help: "Le aparece a todos los clientes.",
  },
  {
    value: "registrados",
    label: "Clientes ya registrados",
    short: "Ya registrados",
    help: "Quienes ya nos han hecho al menos un pedido (frecuentes y no frecuentes).",
  },
  {
    value: "frecuentes",
    label: "Clientes frecuentes",
    short: "Frecuentes",
    help: "Quienes tienen 5 o más pedidos entregados.",
  },
  {
    value: "clientes",
    label: "Clientes no frecuentes",
    short: "No frecuentes",
    help: "Quienes ya tienen pedidos, pero menos de 5 entregados.",
  },
];

export const audienceShort: Record<string, string> = Object.fromEntries(
  audienceOptions.map((o) => [o.value, o.short]),
);

/** Mismo criterio que coupon_audience_matches en la base de datos. */
export function audienceIncludes(audience: CouponAudience, segment: ClientSegment) {
  switch (audience) {
    case "ambos":
      return true;
    case "nuevos":
      return segment === "nuevo";
    case "registrados":
      return segment !== "nuevo";
    case "frecuentes":
      return segment === "frecuente";
    case "clientes":
      return segment === "no_frecuente";
  }
}

export const segmentLabels: Record<ClientSegment, string> = {
  nuevo: "Nuevo",
  no_frecuente: "No frecuente",
  frecuente: "Frecuente",
};

export interface SegmentedClient {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  orders_count: number;
  delivered_count: number;
  segment: ClientSegment;
}

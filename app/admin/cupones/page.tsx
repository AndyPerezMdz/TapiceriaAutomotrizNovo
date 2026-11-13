import { CouponForm } from "@/components/admin/CouponForm";
import { CouponRow } from "@/components/admin/CouponRow";
import { ClientSegmentsButton } from "@/components/admin/ClientSegmentsButton";
import type { SegmentedClient } from "@/lib/coupons/audience";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminCuponesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: myProfile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  if (myProfile?.role !== "admin") {
    redirect("/admin");
  }

  const [{ data: coupons }, { data: services }, { data: redemptions }] = await Promise.all([
    supabase
      .from("coupons")
      .select(
        "id, title, description, discount_type, discount_value, audience, is_active, expires_at, requires_deposit, services(title)",
      )
      // Los cupones personales (canje de puntos) no se administran aquí.
      .is("client_id", null)
      .order("created_at", { ascending: false }),
    supabase.from("services").select("id, title").eq("is_active", true).order("order", { ascending: true }),
    supabase.from("coupon_redemptions").select("coupon_id"),
  ]);
  const { data: segmentRows } = await supabase.rpc("get_client_segments");
  const clients = (segmentRows ?? []) as SegmentedClient[];

  const usesByCoupon = new Map<string, number>();
  for (const r of redemptions ?? []) {
    usesByCoupon.set(r.coupon_id, (usesByCoupon.get(r.coupon_id) ?? 0) + 1);
  }

  const formattedCoupons =
    coupons?.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      audience: c.audience,
      is_active: c.is_active,
      expires_at: c.expires_at,
      uses: usesByCoupon.get(c.id) ?? 0,
      requires_deposit: Boolean(c.requires_deposit),
      service_title: (c.services as unknown as { title: string } | null)?.title ?? null,
    })) ?? [];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] text-foreground sm:text-6xl">
          Cupones de descuento
        </h1>
        <ClientSegmentsButton clients={clients} />
      </div>

      <div className="mb-8">
        <CouponForm services={services ?? []} clients={clients} />
      </div>

      <h2 className="font-display text-2xl font-bold uppercase mb-3 text-foreground">Cupones existentes</h2>
      {formattedCoupons.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-field-border bg-surface p-10 text-center">
          <p className="text-[0.9375rem] text-muted">Aún no has creado ningún cupón.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {formattedCoupons.map((c) => (
            <CouponRow key={c.id} coupon={c} />
          ))}
        </div>
      )}
    </div>
  );
}
import { CouponForm } from "@/components/admin/CouponForm";
import { CouponRow } from "@/components/admin/CouponRow";
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

  const [{ data: coupons }, { data: services }] = await Promise.all([
    supabase
      .from("coupons")
      .select(
        "id, title, description, discount_type, discount_value, audience, is_active, services(title)",
      )
      .order("created_at", { ascending: false }),
    supabase.from("services").select("id, title").eq("is_active", true).order("order", { ascending: true }),
  ]);

  const formattedCoupons =
    coupons?.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      audience: c.audience,
      is_active: c.is_active,
      service_title: (c.services as unknown as { title: string } | null)?.title ?? null,
    })) ?? [];

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
        Cupones de descuento
      </h1>

      <div className="mb-8">
        <CouponForm services={services ?? []} />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-foreground">Cupones existentes</h2>
      {formattedCoupons.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 bg-surface p-10 text-center dark:border-white/15">
          <p className="text-sm text-muted">Aún no has creado ningún cupón.</p>
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
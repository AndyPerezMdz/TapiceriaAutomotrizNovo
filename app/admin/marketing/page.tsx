import { MarketingBlastForm } from "@/components/admin/MarketingBlastForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminMarketingPage() {
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

  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("marketing_opt_in", true)
    .eq("role", "cliente");

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
        Correo promocional
      </h1>
      <p className="mb-8 text-sm text-muted">
        {count ?? 0} cliente(s) suscritos actualmente para recibir promociones.
      </p>
      <MarketingBlastForm />
    </div>
  );
}
import { BusinessSettingsForm } from "@/components/admin/BusinessSettingsForm";
import { PurgeOrdersButton } from "@/components/admin/PurgeOrdersButton";
import { getBusinessSettings } from "@/lib/data/business-settings";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ConfiguracionPage() {
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

  const settings = await getBusinessSettings();

  const { count: deletedCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .not("deleted_at", "is", null);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
        Configuración del negocio
      </h1>
      <div className="space-y-8">
        <BusinessSettingsForm settings={settings} />
        <PurgeOrdersButton deletedCount={deletedCount ?? 0} />
      </div>
    </div>
  );
}
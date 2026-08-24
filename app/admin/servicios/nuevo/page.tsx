import { ServiceForm } from "@/components/admin/ServiceForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NuevoServicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: myProfile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  if (myProfile?.role !== "admin") {
    redirect("/admin/servicios");
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
        Nuevo servicio
      </h1>
      <ServiceForm />
    </div>
  );
}
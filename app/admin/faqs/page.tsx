import { FaqManager } from "@/components/admin/FaqManager";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminFaqsPage() {
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

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
        Preguntas frecuentes
      </h1>
      <p className="mb-8 text-sm text-muted">
        Estas preguntas aparecen en la página principal del sitio.
      </p>
      <FaqManager />
    </div>
  );
}
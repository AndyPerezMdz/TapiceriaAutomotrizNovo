import { InviteStaffForm } from "@/components/admin/InviteStaffForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminUsuariosPage() {
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

  const { data: staff } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .in("role", ["admin", "empleado"])
    .order("full_name", { ascending: true });

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
        Usuarios del staff
      </h1>

      <div className="mb-10">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Invitar nueva persona
        </h2>
        <InviteStaffForm />
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Personal actual
        </h2>
        <div className="space-y-2">
          {staff?.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10"
            >
              <div>
                <p className="font-medium text-foreground">{person.full_name}</p>
                <p className="text-xs text-muted">{person.email}</p>
              </div>
              <span className="rounded-full bg-brand-yellow/20 px-3 py-1 text-xs font-medium capitalize text-brand-yellow-dark dark:text-brand-yellow">
                {person.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
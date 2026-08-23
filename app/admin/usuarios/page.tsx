import { InviteStaffForm } from "@/components/admin/InviteStaffForm";
import { StaffMemberRow } from "@/components/admin/StaffMemberRow";
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
    .select("id, full_name, email, role, is_active, created_at")
    .in("role", ["admin", "empleado"])
    .order("full_name", { ascending: true });

  // last_sign_in_at vive en auth.users, no en profiles — lo consultamos aparte
  // usando una vista si existiera; por simplicidad, lo omitimos por ahora si
  // no hay una forma directa desde el cliente RLS. Se puede agregar después
  // con una función RPC si se necesita ese dato exacto.
  const staffWithDefaults =
    staff?.map((s) => ({ ...s, last_sign_in_at: null as string | null })) ?? [];

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
          {staffWithDefaults.map((person) => (
            <StaffMemberRow key={person.id} member={person} />
          ))}
        </div>
      </div>
    </div>
  );
}
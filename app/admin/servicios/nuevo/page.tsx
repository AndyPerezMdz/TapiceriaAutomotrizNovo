import { ServiceForm } from "@/components/admin/ServiceForm";

export default function NuevoServicioPage() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
        Nuevo servicio
      </h1>
      <ServiceForm />
    </div>
  );
}
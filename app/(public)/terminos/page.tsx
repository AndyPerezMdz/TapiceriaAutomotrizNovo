import { businessInfo } from "@/lib/constants/business";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones | Tapicería Automotriz by NOVO",
};

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
        Términos y Condiciones
      </h1>
      <p className="mb-10 text-sm text-muted">
        Última actualización: {new Date().toLocaleDateString("es-MX", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      <div className="space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            Aceptación de los términos
          </h2>
          <p>
            Al usar este sitio y crear una cuenta con {businessInfo.name},
            aceptas los presentes Términos y Condiciones.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            Sobre las cotizaciones
          </h2>
          <p>
            Los precios mostrados como &quot;precio de referencia&quot; en el
            sitio son estimados y no representan un compromiso vinculante.
            El precio final se confirma únicamente después de que nuestro
            equipo revisa tu solicitud, y debe ser aceptado por ti antes de
            iniciar cualquier trabajo.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            Colores personalizados
          </h2>
          <p>
            Para tapizados en piel de colores distintos al negro de fábrica,
            es necesario agendar una visita presencial al taller para tomar
            una muestra física y garantizar la igualación correcta del tono.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            Forma de pago
          </h2>
          <p>
            El pago de los servicios se realiza de forma presencial en el
            taller, salvo que se acuerde lo contrario directamente con
            nuestro personal.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            Cancelaciones
          </h2>
          <p>
            Puedes cancelar tu pedido en cualquier momento antes de que el
            trabajo haya iniciado (estado &quot;En proceso&quot;), desde tu
            portal de cliente.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            Contenido subido por el usuario
          </h2>
          <p>
            Al subir fotografías de tu vehículo, nos otorgas permiso para
            almacenarlas y usarlas exclusivamente para dar seguimiento a tu
            pedido. No se publican sin tu autorización expresa.
          </p>
        </section>
      </div>
    </div>
  );
}
import { businessInfo } from "@/lib/constants/business";
import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nosotros | Tapicería Automotriz by NOVO",
};

const values = [
  {
    title: "Materiales de calidad",
    description:
      "Trabajamos con telas, pieles y materiales resistentes, pensados para durar en el uso diario del vehículo.",
  },
  {
    title: "Atención al detalle",
    description:
      "Cada costura y acabado se revisa con cuidado, porque un buen tapizado se nota en los detalles.",
  },
  {
    title: "Garantía en el trabajo",
    description:
      "Respaldamos cada servicio realizado, para que tengas la tranquilidad de un trabajo bien hecho.",
  },
];

export default function NosotrosPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Nosotros
        </h1>
        <p className="mt-3 text-muted">Pasión por el detalle, en cada vehículo.</p>
      </div>

      <div className="space-y-5 text-base leading-relaxed text-muted">
        <p>
          En <span className="font-medium text-foreground">Tapicería Automotriz by NOVO</span>{" "}
          nos dedicamos a la tapicería automotriz con un enfoque en la calidad y el
          detalle. Desde el tapizado de asientos hasta trabajos completos de
          interior, cada proyecto lo tratamos con el mismo cuidado, sin importar
          si se trata de un auto particular, una motocicleta o una embarcación.
        </p>
        <p>
          Nuestro taller está ubicado en {businessInfo.address}, donde recibimos
          vehículos de toda la ciudad para renovar y reparar su interior. Creemos
          que el tapizado no es solo estética: también es comodidad y
          durabilidad, y por eso ponemos atención en cada costura, cada material
          y cada acabado.
        </p>
        <p>
          Con el tiempo hemos ampliado nuestros servicios para cubrir
          prácticamente cualquier necesidad relacionada con tapicería vehicular:
          desde un simple cambio de alfombra, hasta la soldadura estructural de
          asientos dañados. Nuestro objetivo siempre es el mismo: que tu
          vehículo se sienta como nuevo.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {values.map((value) => (
          <div key={value.title}>
            <CheckCircle2
              size={22}
              className="text-brand-yellow-dark dark:text-brand-yellow"
            />
            <h3 className="mt-3 font-semibold text-foreground">{value.title}</h3>
            <p className="mt-1.5 text-sm text-muted">{value.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
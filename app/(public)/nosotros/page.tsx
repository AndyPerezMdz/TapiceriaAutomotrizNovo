import { businessInfo } from "@/lib/constants/business";
import { Award, Clock, Sparkles, Wrench } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nosotros | Tapicería Automotriz by NOVO",
};

const values = [
  {
    icon: Award,
    title: "Materiales de calidad",
    description:
      "Trabajamos con telas, pieles y materiales resistentes, pensados para durar en el uso diario del vehículo.",
  },
  {
    icon: Sparkles,
    title: "Atención al detalle",
    description:
      "Cada costura y acabado se revisa con cuidado, porque un buen tapizado se nota en los detalles.",
  },
  {
    icon: Wrench,
    title: "Garantía en el trabajo",
    description:
      "Respaldamos cada servicio realizado, para que tengas la tranquilidad de un trabajo bien hecho.",
  },
];

export default function NosotrosPage() {
  return (
    <div>
      {/* Encabezado */}
      <section className="border-b border-black/10 bg-surface dark:border-white/10">
        <div className="mx-auto max-w-3xl animate-fade-up px-6 py-20 text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-yellow-dark dark:text-brand-yellow">
            Nuestra historia
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pasión por el detalle, en cada vehículo.
          </h1>
        </div>
      </section>

      {/* Historia */}
      <section className="mx-auto max-w-3xl animate-fade-up-on-scroll px-6 py-16">
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
      </section>

      {/* Valores */}
      <section className="border-t border-black/10 bg-surface py-20 dark:border-white/10">
        <div className="mx-auto max-w-5xl animate-fade-up-on-scroll px-6">
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Lo que nos define
          </h2>
          <div className="grid gap-10 sm:grid-cols-3">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-yellow/15 text-brand-yellow-dark dark:text-brand-yellow">
                  <value.icon size={24} />
                </div>
                <h3 className="font-semibold text-foreground">{value.title}</h3>
                <p className="mt-2 text-sm text-muted">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cierre */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl animate-fade-up-on-scroll px-6 text-center">
          <Clock size={28} className="mx-auto mb-4 text-brand-yellow-dark dark:text-brand-yellow" />
          <p className="text-lg font-medium text-foreground">
            Cada vehículo que pasa por nuestras manos recibe el mismo compromiso:
            calidad, cuidado, y un trabajo del que nos sentimos orgullosos.
          </p>
        </div>
      </section>
    </div>
  );
}
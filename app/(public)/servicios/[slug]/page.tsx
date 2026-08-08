import { WhatsAppButton } from "@/components/WhatsAppButton";
import { buildWhatsAppLink } from "@/lib/constants/business";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: service } = await supabase
    .from("services")
    .select("title")
    .eq("slug", slug)
    .single();

  return {
    title: service ? `${service.title} | Tapicería Automotriz by NOVO` : "Servicio",
  };
}

export default async function ServicioDetallePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!service) {
    notFound();
  }

  const whatsappHref = buildWhatsAppLink(
    `Hola, me interesa el servicio de ${service.title}`,
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/servicios"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={16} /> Volver a servicios
      </Link>

      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {service.title}
      </h1>

      <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-muted">
        {service.full_description}
      </p>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-block rounded-md bg-brand-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black dark:hover:bg-white/85"
      >
        Cotizar este servicio por WhatsApp
      </a>
    </div>
  );
}
import { LegalPage } from "@/components/public/LegalPage";
import { businessInfo, formatWhatsApp } from "@/lib/constants/business";
import { getBusinessSettings } from "@/lib/data/business-settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso de Privacidad | Tapicería Automotriz by NOVO",
};

export default async function PrivacidadPage() {
  const settings = await getBusinessSettings();
  return (
    <LegalPage title="Aviso de privacidad">
        <section>
          <h2>
            Responsable de tus datos
          </h2>
          <p>
            {businessInfo.name}, con domicilio en {businessInfo.address}, es
            responsable del uso y protección de tus datos personales conforme
            a este aviso.
          </p>
        </section>

        <section>
          <h2>
            Datos que recopilamos
          </h2>
          <p>
            Recopilamos los siguientes datos personales cuando utilizas
            nuestro sitio: nombre completo, correo electrónico, número de
            teléfono, información de tu vehículo, y fotografías que subas
            voluntariamente para solicitar una cotización.
          </p>
        </section>

        <section>
          <h2>
            Finalidad del tratamiento
          </h2>
          <p>Usamos tus datos personales para:</p>
          <ul>
            <li>Crear y administrar tu cuenta en nuestro portal de cliente.</li>
            <li>Procesar y dar seguimiento a tus solicitudes de cotización y pedidos.</li>
            <li>Contactarte por correo electrónico o WhatsApp respecto a tus pedidos.</li>
            <li>Responder a mensajes enviados a través de nuestro formulario de contacto.</li>
          </ul>
        </section>

        <section>
          <h2>
            Con quién compartimos tus datos
          </h2>
          <p>
            No vendemos ni compartimos tus datos personales con terceros para
            fines de mercadotecnia. Tus datos se almacenan de forma segura
            mediante nuestro proveedor de infraestructura tecnológica
            (Supabase) y solo son accesibles por nuestro personal autorizado.
          </p>
        </section>

        <section>
          <h2>
            Derechos ARCO
          </h2>
          <p>
            Tienes derecho a acceder, rectificar, cancelar u oponerte al uso
            de tus datos personales. Puedes ejercer estos derechos
            actualizando tu información directamente en tu perfil, o
            contactándonos por WhatsApp al {formatWhatsApp(settings.whatsapp)}.
          </p>
        </section>

        <section>
          <h2>
            Cambios a este aviso
          </h2>
          <p>
            Podemos actualizar este aviso de privacidad en cualquier momento.
            Cualquier cambio será publicado en esta misma página.
          </p>
        </section>
      </LegalPage>
  );
}

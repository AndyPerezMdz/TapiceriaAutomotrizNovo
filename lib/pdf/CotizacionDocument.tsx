import path from "path";
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// Tipografías del sitio (Barlow / Barlow Condensed, licencia OFL) incluidas en el repo.
const fontDir = path.join(process.cwd(), "lib", "pdf", "fonts");
Font.register({
  family: "Barlow",
  fonts: [
    { src: path.join(fontDir, "barlow-latin-400-normal.woff"), fontWeight: 400 },
    { src: path.join(fontDir, "barlow-latin-600-normal.woff"), fontWeight: 600 },
    { src: path.join(fontDir, "barlow-latin-700-normal.woff"), fontWeight: 700 },
  ],
});
Font.register({
  family: "BarlowCondensed",
  fonts: [
    { src: path.join(fontDir, "barlow-condensed-latin-700-normal.woff"), fontWeight: 700 },
    { src: path.join(fontDir, "barlow-condensed-latin-800-normal.woff"), fontWeight: 800 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

const LOGO = path.join(process.cwd(), "public", "images", "logo-amarillo-wbg.png");

const INK = "#1a1a1a";
const YELLOW = "#f5c518";
const MUTED = "#5c5a55";
const SEAM = "#e0dbd0";
const CREAM = "#f3f1ec";

const styles = StyleSheet.create({
  page: { fontFamily: "Barlow", fontSize: 10, color: INK, backgroundColor: "#ffffff", paddingBottom: 92 },

  // Cabecera tipo orden de trabajo
  header: { backgroundColor: INK, color: "#f5f5f5", paddingTop: 30, paddingHorizontal: 40, paddingBottom: 22 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { width: 104 },
  eyebrow: { fontFamily: "BarlowCondensed", fontWeight: 700, fontSize: 10, letterSpacing: 2, color: YELLOW, textTransform: "uppercase" },
  docTitle: { fontFamily: "BarlowCondensed", fontWeight: 800, fontSize: 40, lineHeight: 0.95, textTransform: "uppercase", marginTop: 4 },
  stamp: { borderWidth: 2, borderColor: YELLOW, borderRadius: 6, paddingVertical: 5, paddingHorizontal: 10, transform: "rotate(-5deg)", marginTop: 6 },
  stampText: { fontFamily: "BarlowCondensed", fontWeight: 800, fontSize: 14, letterSpacing: 1, color: YELLOW, textTransform: "uppercase" },
  seamOnInk: { borderBottomWidth: 1.5, borderBottomColor: "#8a7322", borderBottomStyle: "dashed", marginTop: 18, marginBottom: 14 },
  metaRow: { flexDirection: "row" },
  metaCell: { flex: 1, paddingRight: 10 },
  metaLabel: { fontSize: 7.5, letterSpacing: 1.2, textTransform: "uppercase", color: "#a8a49c" },
  metaValue: { fontSize: 11, fontWeight: 600, marginTop: 3, color: "#f5f5f5" },

  body: { paddingHorizontal: 40, paddingTop: 22 },
  sectionTitle: { fontFamily: "BarlowCondensed", fontWeight: 800, fontSize: 16, textTransform: "uppercase", marginBottom: 8 },

  clientBox: { flexDirection: "row", backgroundColor: CREAM, borderRadius: 8, padding: 14, marginBottom: 20 },
  clientCell: { flex: 1, paddingRight: 10 },
  label: { fontSize: 7.5, letterSpacing: 1.2, textTransform: "uppercase", color: MUTED },
  value: { fontSize: 11, fontWeight: 600, marginTop: 3 },

  tableHead: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: SEAM, borderBottomStyle: "dashed", paddingBottom: 6 },
  th: { fontSize: 7.5, letterSpacing: 1.2, textTransform: "uppercase", color: MUTED, fontWeight: 600 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", borderBottomWidth: 1, borderBottomColor: "#efece6", paddingVertical: 9 },
  itemNum: { width: 22, fontFamily: "BarlowCondensed", fontWeight: 800, fontSize: 13, color: "#7a5c00" },
  itemLeft: { flex: 1, paddingRight: 10 },
  itemTitle: { fontWeight: 700, fontSize: 11 },
  itemMaterial: { fontSize: 9, color: MUTED, marginTop: 2 },
  itemPrice: { width: 90, textAlign: "right", fontFamily: "BarlowCondensed", fontWeight: 700, fontSize: 14 },

  notes: { marginTop: 18 },
  notesText: { fontSize: 9.5, lineHeight: 1.5, color: "#3d3b37" },

  totalWrap: { marginTop: 22, flexDirection: "row", justifyContent: "flex-end" },
  totalBox: { width: 240, backgroundColor: YELLOW, borderRadius: 10, padding: 6 },
  totalInner: { borderWidth: 1.5, borderColor: "#8a7322", borderStyle: "dashed", borderRadius: 7, paddingVertical: 12, paddingHorizontal: 14 },
  totalLabel: { fontSize: 8, letterSpacing: 1.2, textTransform: "uppercase", color: "#3d3200", fontWeight: 600 },
  totalValue: { fontFamily: "BarlowCondensed", fontWeight: 800, fontSize: 30, marginTop: 2 },
  totalNote: { fontSize: 8, color: "#3d3200", marginTop: 2 },

  disclaimer: { marginTop: 18, fontSize: 8.5, lineHeight: 1.5, color: MUTED },

  footer: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: INK, color: "#d9d5cc", paddingHorizontal: 40, paddingTop: 12, paddingBottom: 16 },
  footerSeam: { borderTopWidth: 1.5, borderTopColor: "#8a7322", borderTopStyle: "dashed", marginBottom: 10 },
  footerRow: { flexDirection: "row", justifyContent: "space-between" },
  footerCol: { flex: 1, paddingRight: 12 },
  footerLabel: { fontFamily: "BarlowCondensed", fontWeight: 700, fontSize: 9, letterSpacing: 1, color: YELLOW, textTransform: "uppercase" },
  footerText: { fontSize: 8, lineHeight: 1.45, marginTop: 2 },
});

interface OrderItemLine {
  title: string;
  materialLabel: string | null;
  price: number | null;
}

interface Props {
  isReceipt: boolean;
  orderId: string;
  createdAt: string;
  clientName: string;
  clientPhone: string | null;
  vehicle: string;
  items: OrderItemLine[];
  description: string;
  totalPrice: number | null;
  couponTitle: string | null;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  hoursWeekday?: string;
  hoursSaturday?: string;
}

function money(value: number) {
  return `$${value.toLocaleString("es-MX", { maximumFractionDigits: 2 })}`;
}

export function CotizacionDocument({
  isReceipt,
  orderId,
  createdAt,
  clientName,
  clientPhone,
  vehicle,
  items,
  description,
  totalPrice,
  couponTitle,
  businessName,
  businessAddress,
  businessPhone,
  hoursWeekday,
  hoursSaturday,
}: Props) {
  const folio = orderId.slice(0, 8).toUpperCase();
  const issued = new Date().toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Merida",
  });
  const received = new Date(createdAt).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Merida",
  });

  return (
    <Document title={`${isReceipt ? "Recibo" : "Cotización"} ${folio} · ${businessName}`} author={businessName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed={false}>
          <View style={styles.headerTop}>
            <View>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={LOGO} style={styles.logo} />
              <Text style={[styles.eyebrow, { marginTop: 14 }]}>Orden de trabajo</Text>
              <Text style={styles.docTitle}>{isReceipt ? "Recibo de servicio" : "Cotización"}</Text>
            </View>
            <View style={styles.stamp}>
              <Text style={styles.stampText}>{isReceipt ? "Entregado" : "Por aprobar"}</Text>
            </View>
          </View>

          <View style={styles.seamOnInk} />

          <View style={styles.metaRow}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Folio</Text>
              <Text style={styles.metaValue}>{folio}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Pedido recibido</Text>
              <Text style={styles.metaValue}>{received}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Emitido</Text>
              <Text style={styles.metaValue}>{issued}</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.clientBox}>
            <View style={styles.clientCell}>
              <Text style={styles.label}>Cliente</Text>
              <Text style={styles.value}>{clientName}</Text>
            </View>
            {clientPhone ? (
              <View style={styles.clientCell}>
                <Text style={styles.label}>Teléfono</Text>
                <Text style={styles.value}>{clientPhone}</Text>
              </View>
            ) : null}
            <View style={styles.clientCell}>
              <Text style={styles.label}>Vehículo</Text>
              <Text style={styles.value}>{vehicle || "No especificado"}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Servicios</Text>
          <View style={styles.tableHead}>
            <Text style={[styles.th, { width: 22 }]}>#</Text>
            <Text style={[styles.th, { flex: 1 }]}>Servicio y material</Text>
            <Text style={[styles.th, { width: 90, textAlign: "right" }]}>Importe</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.itemRow} wrap={false}>
              <Text style={styles.itemNum}>{String(i + 1).padStart(2, "0")}</Text>
              <View style={styles.itemLeft}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.materialLabel ? <Text style={styles.itemMaterial}>{item.materialLabel}</Text> : null}
              </View>
              <Text style={styles.itemPrice}>{item.price !== null ? money(item.price) : "—"}</Text>
            </View>
          ))}

          {description ? (
            <View style={styles.notes} wrap={false}>
              <Text style={styles.sectionTitle}>Lo que nos pediste</Text>
              <Text style={styles.notesText}>{description}</Text>
            </View>
          ) : null}

          <View style={styles.totalWrap} wrap={false}>
            <View style={styles.totalBox}>
              <View style={styles.totalInner}>
                <Text style={styles.totalLabel}>{isReceipt ? "Total pagado" : "Total estimado"}</Text>
                <Text style={styles.totalValue}>
                  {totalPrice !== null ? `${money(totalPrice)} MXN` : "Por cotizar"}
                </Text>
                {couponTitle ? <Text style={styles.totalNote}>Incluye el cupón “{couponTitle}”</Text> : null}
              </View>
            </View>
          </View>

          <Text style={styles.disclaimer}>
            {isReceipt
              ? "Gracias por tu preferencia. Este documento comprueba el servicio realizado; todos nuestros trabajos tienen garantía. Si notas algún detalle, escríbenos y lo revisamos sin costo."
              : "Precio de referencia sujeto a confirmación al revisar el vehículo en el taller. Puedes aceptar o rechazar esta cotización desde tu portal. El pago se realiza en el taller."}
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <View style={styles.footerSeam} />
          <View style={styles.footerRow}>
            <View style={styles.footerCol}>
              <Text style={styles.footerLabel}>{businessName}</Text>
              <Text style={styles.footerText}>{businessAddress}</Text>
            </View>
            {hoursWeekday ? (
              <View style={styles.footerCol}>
                <Text style={styles.footerLabel}>Horario</Text>
                <Text style={styles.footerText}>
                  Lun a vie · {hoursWeekday}
                  {hoursSaturday ? `\nSábado · ${hoursSaturday}` : ""}
                </Text>
              </View>
            ) : null}
            <View style={[styles.footerCol, { paddingRight: 0 }]}>
              <Text style={styles.footerLabel}>Contacto</Text>
              <Text style={styles.footerText}>
                WhatsApp {businessPhone}
                {"\n"}tapiceriaautomotrizbynovo.com
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

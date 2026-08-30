import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    borderBottom: "2 solid #f5c518",
    paddingBottom: 16,
  },
  logo: { width: 100 },
  headerRight: { alignItems: "flex-end" },
  businessName: { fontSize: 11, fontWeight: 700 },
  businessDetail: { fontSize: 8, color: "#6b6b6b", marginTop: 2 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 9, color: "#6b6b6b", marginBottom: 20 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#fdf3d6",
    color: "#a67c00",
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 16,
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#6b6b6b",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 100, color: "#6b6b6b" },
  value: { flex: 1, fontWeight: 500 },
  divider: { borderBottom: "1 solid #e5e5e5", marginVertical: 16 },
  priceBox: {
    backgroundColor: "#fafafa",
    padding: 16,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 20,
  },
  priceLabel: { fontSize: 9, color: "#6b6b6b", marginBottom: 4 },
  priceValue: { fontSize: 24, fontWeight: 700 },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#9a9a9a",
    textAlign: "center",
    borderTop: "1 solid #e5e5e5",
    paddingTop: 10,
  },
});

interface Props {
  isReceipt: boolean;
  orderId: string;
  createdAt: string;
  clientName: string;
  clientPhone: string | null;
  vehicle: string;
  serviceName: string | null;
  materialName: string | null;
  colorName: string | null;
  description: string;
  price: number | null;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
}

export function CotizacionDocument({
  isReceipt,
  orderId,
  createdAt,
  clientName,
  clientPhone,
  vehicle,
  serviceName,
  materialName,
  colorName,
  description,
  price,
  businessName,
  businessAddress,
  businessPhone,
}: Props) {
  const docTitle = isReceipt ? "Recibo de servicio" : "Cotización de servicio";
  const folio = orderId.slice(0, 8).toUpperCase();
  const dateLabel = new Date(createdAt).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image
            src="https://tapiceriaautomotrizbynovo.com/images/logo-negro-wbg.png"
            style={styles.logo}
          />
          <View style={styles.headerRight}>
            <Text style={styles.businessName}>{businessName}</Text>
            <Text style={styles.businessDetail}>{businessAddress}</Text>
            <Text style={styles.businessDetail}>{businessPhone}</Text>
          </View>
        </View>

        <View style={styles.badge}>
          <Text>Folio {folio}</Text>
        </View>

        <Text style={styles.title}>{docTitle}</Text>
        <Text style={styles.subtitle}>Emitido el {dateLabel}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.value}>{clientName}</Text>
          </View>
          {clientPhone ? (
            <View style={styles.row}>
              <Text style={styles.label}>Teléfono</Text>
              <Text style={styles.value}>{clientPhone}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehículo y servicio</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Vehículo</Text>
            <Text style={styles.value}>{vehicle || "No especificado"}</Text>
          </View>
          {serviceName ? (
            <View style={styles.row}>
              <Text style={styles.label}>Servicio</Text>
              <Text style={styles.value}>{serviceName}</Text>
            </View>
          ) : null}
          {materialName ? (
            <View style={styles.row}>
              <Text style={styles.label}>Material</Text>
              <Text style={styles.value}>
                {materialName}
                {colorName ? ` · ${colorName}` : ""}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={{ lineHeight: 1.5 }}>{description}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>
            {isReceipt ? "Total pagado" : "Precio estimado"}
          </Text>
          <Text style={styles.priceValue}>
            {price !== null
              ? `$${price.toLocaleString("es-MX")} MXN`
              : "Pendiente de cotizar"}
          </Text>
        </View>

        <Text style={{ fontSize: 8, color: "#9a9a9a", textAlign: "center" }}>
          {isReceipt
            ? "Gracias por tu preferencia. Este documento comprueba el servicio realizado."
            : "Este precio es una referencia sujeta a confirmación al revisar el vehículo. El pago se realiza de forma presencial en el taller."}
        </Text>

        <View style={styles.footer}>
          <Text>
            {businessName} · {businessAddress} · tapiceriaautomotrizbynovo.com
          </Text>
        </View>
      </Page>
    </Document>
  );
}
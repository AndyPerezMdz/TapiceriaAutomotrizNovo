export const businessInfo = {
  name: "Tapicería Automotriz by NOVO",
  address: "C. 47 694-E x 88 y 90, Cd Caucel, 97314 Mérida, Yuc.",
  facebook:
    "https://www.facebook.com/people/Tapicería-automotriz-by-NOVO/100065386363184/",
} as const;

export function formatWhatsApp(rawNumber: string) {
  return `+52 ${rawNumber.slice(0, 3)} ${rawNumber.slice(3, 6)} ${rawNumber.slice(6)}`;
}

export function buildWhatsAppLink(message: string, rawNumber: string) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/52${rawNumber}?text=${encoded}`;
}
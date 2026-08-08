export const businessInfo = {
    name: "Tapicería Automotriz by NOVO",
    whatsapp: "9998024783",
    whatsappFormatted: "+52 999 802 4783",
    address: "C. 47 694-E x 88 y 90, Cd Caucel, 97314 Mérida, Yuc.",
    hours: [
      { days: "Lunes a Viernes", time: "9:30 am – 5:00 pm" },
      { days: "Sábado", time: "9:30 am – 3:00 pm" },
    ],
    facebook: "https://www.facebook.com/people/Tapicería-automotriz-by-NOVO/100065386363184/",
  } as const;
  
  export function buildWhatsAppLink(message: string) {
    const encoded = encodeURIComponent(message);
    return `https://wa.me/52${businessInfo.whatsapp}?text=${encoded}`;
  }
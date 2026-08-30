import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Tapicería Automotriz by NOVO",
  description: "Taller de tapicería automotriz en Mérida, Yucatán.",
  manifest: "/manifest.json",
  themeColor: "#f5c518",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NOVO",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
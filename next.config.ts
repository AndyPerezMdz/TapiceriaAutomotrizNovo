import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/api/pdf/pedido/[id]": [
      "./node_modules/pdfkit/js/standard-fonts/*.cjs",
      "./node_modules/pdfkit/js/standard-fonts/*.afm",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uselstfcbygkzohamzhd.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
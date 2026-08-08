import type { Config } from "tailwindcss";

/**
 * Paleta de marca NOVO.
 * En Tailwind v4 los tokens activos se registran en app/globals.css (@theme).
 * Este archivo documenta la misma paleta para referencia y herramientas.
 */
const config: Config = {
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: {
            DEFAULT: "#F5C518",
            dark: "#C9A012",
          },
          red: {
            DEFAULT: "#E4292B",
            dark: "#B81F21",
          },
          black: "#1A1A1A",
          gray: {
            light: "#F7F7F7",
            DEFAULT: "#6B6B6B",
          },
        },
      },
    },
  },
};

export default config;

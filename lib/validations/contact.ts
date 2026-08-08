import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre"),
  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length === 10, {
      message: "Ingresa un teléfono a 10 dígitos",
    }),
  message: z.string().trim().min(10, "Cuéntanos un poco más (mínimo 10 caracteres)"),
});

export type ContactFormData = z.infer<typeof contactSchema>;
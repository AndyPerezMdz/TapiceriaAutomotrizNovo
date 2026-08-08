import { z } from "zod";

export const serviceSchema = z.object({
  title: z.string().trim().min(2, "Ingresa un nombre"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones (sin espacios)"),
  shortDescription: z.string().trim().min(5, "Ingresa una descripción corta"),
  fullDescription: z.string().trim().min(10, "Ingresa una descripción completa"),
  isActive: z.boolean(),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;
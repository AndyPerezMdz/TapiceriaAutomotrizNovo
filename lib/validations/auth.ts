import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "El nombre completo es obligatorio"),
    email: z.string().trim().email("Ingresa un correo electrónico válido"),
    phone: z
      .string()
      .trim()
      .transform((val) => val.replace(/\D/g, "")) // quita espacios, guiones, paréntesis, etc.
      .refine((val) => val.length === 10, {
        message: "Ingresa un teléfono a 10 dígitos (ej. 9999999999)",
      }),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Ingresa un correo electrónico válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

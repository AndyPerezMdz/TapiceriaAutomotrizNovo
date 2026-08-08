import { z } from "zod";

export const newOrderSchema = z.object({
  serviceId: z.string().trim().min(1, "Selecciona un servicio"),
  vehicleMake: z.string().trim().min(1, "Ingresa la marca del vehículo"),
  vehicleModel: z.string().trim().min(1, "Ingresa el modelo"),
  vehicleYear: z
    .string()
    .trim()
    .refine((val) => {
      const year = Number(val);
      return year >= 1970 && year <= new Date().getFullYear() + 1;
    }, "Ingresa un año válido"),
  serviceDescription: z
    .string()
    .trim()
    .min(15, "Describe con más detalle lo que necesitas (mínimo 15 caracteres)"),
});

export type NewOrderFormData = z.infer<typeof newOrderSchema>;
import { z } from "zod";
import { DIAS_SEMANA } from "@/lib/constants";

const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const horaSchema = z
  .string()
  .regex(horaRegex, "Formato de hora inválido (HH:MM)")
  .optional()
  .or(z.literal(""));

export const pasajeroSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  telefono: z.string().trim().optional().or(z.literal("")),
  whatsapp: z.string().trim().optional().or(z.literal("")),
  email: z
    .union([z.string().trim().email("Email inválido"), z.literal("")])
    .optional(),
  contactoExtra: z.string().trim().optional().or(z.literal("")),
  notasGenerales: z.string().trim().optional().or(z.literal("")),
  estado: z.enum(["ACTIVO", "INACTIVO"]).optional(),
});

export const servicioSchema = z.object({
  diaSemana: z.enum(DIAS_SEMANA),
  barrioId: z.string().trim().optional().or(z.literal("")),
  direccion: z.string().trim().optional().or(z.literal("")),
  destino: z.string().trim().optional().or(z.literal("")),
  tipoViaje: z.enum(["IDA", "VUELTA", "IDA_VUELTA"]),
  horaIda: horaSchema,
  horaVuelta: horaSchema,
  cantidadTramos: z.coerce.number().int().min(0).default(1),
  estado: z
    .enum([
      "ACTIVO",
      "INACTIVO",
      "CONFIRMADO",
      "PENDIENTE",
      "CANCELADO",
      "REALIZADO",
    ])
    .optional(),
  fechaInicio: z.string().trim().optional().or(z.literal("")),
  fechaFin: z.string().trim().optional().or(z.literal("")),
  montoAbonado: z.coerce.number().min(0).optional(),
  estadoPago: z.enum(["PENDIENTE", "PARCIAL", "PAGADO"]).optional(),
  metodoPago: z.string().trim().optional().or(z.literal("")),
  montoPendiente: z.coerce.number().min(0).optional().nullable(),
  notasPago: z.string().trim().optional().or(z.literal("")),
  notas: z.string().trim().optional().or(z.literal("")),
});

export const pasajeroConServiciosSchema = z.object({
  pasajero: pasajeroSchema,
  servicios: z.array(servicioSchema).min(1, "Agregá al menos un día"),
});

export const barrioSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  color: z.string().trim().optional().or(z.literal("")),
});

export const notaSchema = z.object({
  pasajeroId: z.string().min(1),
  servicioId: z.string().optional().or(z.literal("")),
  contenido: z.string().trim().min(1, "La nota no puede estar vacía"),
});

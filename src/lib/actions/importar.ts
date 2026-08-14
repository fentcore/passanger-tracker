"use server";

import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/auth-helpers";
import { registrarCambio } from "@/lib/actions/historial";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const filaSchema = z.object({
  pasajeroId: z.string().min(1),
  diaSemana: z.enum([
    "LUNES",
    "MARTES",
    "MIERCOLES",
    "JUEVES",
    "VIERNES",
    "SABADO",
    "DOMINGO",
  ]),
  barrioId: z.string().optional().nullable(),
  tipoViaje: z.enum(["IDA", "VUELTA", "IDA_VUELTA"]),
  horaIda: z.string().optional(),
  horaVuelta: z.string().optional(),
  cantidadTramos: z.number().int().min(0),
});

export async function importarTramosMasivo(filas: unknown) {
  const usuario = await requirePermiso("servicio:crear");
  const data = z.array(filaSchema).min(1).parse(filas);

  const resultado = await prisma.servicio.createMany({
    data: data.map((f) => ({
      pasajeroId: f.pasajeroId,
      diaSemana: f.diaSemana,
      barrioId: f.barrioId || null,
      tipoViaje: f.tipoViaje,
      horaIda: f.horaIda || null,
      horaVuelta: f.horaVuelta || null,
      cantidadTramos: f.cantidadTramos,
    })),
  });

  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Servicio",
    entidadId: "importacion-masiva",
    accion: "crear",
    descripcion: `${usuario.nombre} importó ${resultado.count} tramo(s) desde texto pegado`,
  });

  revalidatePath("/");
  revalidatePath("/pasajeros");
  return resultado;
}

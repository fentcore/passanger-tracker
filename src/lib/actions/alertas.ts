"use server";

import { prisma } from "@/lib/prisma";
import { requirePermiso, requireUsuario } from "@/lib/auth-helpers";
import { registrarCambio } from "@/lib/actions/historial";
import { revalidatePath } from "next/cache";

export async function obtenerConfigAlertas() {
  await requireUsuario();
  let config = await prisma.configuracionAlertas.findFirst();
  if (!config) {
    config = await prisma.configuracionAlertas.create({ data: {} });
  }
  return config;
}

export async function actualizarConfigAlertas(input: {
  advertencia: number;
  alerta: number;
  critica: number;
}) {
  const usuario = await requirePermiso("tarifa:administrar");
  const config = await obtenerConfigAlertas();

  const actualizada = await prisma.configuracionAlertas.update({
    where: { id: config.id },
    data: input,
  });

  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "ConfiguracionAlertas",
    entidadId: actualizada.id,
    accion: "editar",
    descripcion: `${usuario.nombre} actualizó los límites de alertas de tramos (advertencia ${input.advertencia}, alerta ${input.alerta}, crítica ${input.critica})`,
  });

  revalidatePath("/pasajeros");
  revalidatePath("/");
  return actualizada;
}

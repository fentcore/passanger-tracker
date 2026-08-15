"use server";

import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/auth-helpers";
import { registrarCambio } from "@/lib/actions/historial";
import { revalidatePath } from "next/cache";

export async function limpiarArchivados(antes?: Date) {
  const usuario = await requirePermiso("archivo:administrar");

  const [pasajeros, servicios] = await prisma.$transaction([
    prisma.pasajero.deleteMany({
      where: antes ? { archivedAt: { lte: antes } } : { archivedAt: { not: null } },
    }),
    prisma.servicio.deleteMany({
      where: antes ? { archivedAt: { lte: antes } } : { archivedAt: { not: null } },
    }),
  ]);

  const total = pasajeros.count + servicios.count;
  if (total > 0) {
    await registrarCambio({
      usuarioId: usuario.id,
      entidad: "Archivados",
      entidadId: "limpieza",
      accion: "eliminar",
      descripcion: antes
        ? `${usuario.nombre} limpió permanentemente ${pasajeros.count} pasajero(s) y ${servicios.count} servicio(s) archivados anteriores a ${antes.toLocaleDateString("es-AR")}`
        : `${usuario.nombre} limpió permanentemente todos los archivados (${pasajeros.count} pasajero(s), ${servicios.count} servicio(s))`,
    });
  }

  revalidatePath("/archivados");
  revalidatePath("/pasajeros");
  revalidatePath("/");
  return { pasajeros: pasajeros.count, servicios: servicios.count };
}

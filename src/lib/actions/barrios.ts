"use server";

import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/auth-helpers";
import { barrioSchema } from "@/lib/validators";
import { registrarCambio } from "@/lib/actions/historial";
import { revalidatePath } from "next/cache";
import { esConflictoDeUnicidad, mensajeConflicto } from "@/lib/prisma-errors";

export async function listarBarrios(soloActivos = false) {
  return prisma.barrio.findMany({
    where: soloActivos ? { activo: true } : undefined,
    orderBy: { nombre: "asc" },
  });
}

export async function crearBarrio(input: unknown) {
  const usuario = await requirePermiso("barrio:administrar");
  const data = barrioSchema.parse(input);
  try {
    const barrio = await prisma.barrio.create({
      data: { nombre: data.nombre, color: data.color || null },
    });
    await registrarCambio({
      usuarioId: usuario.id,
      entidad: "Barrio",
      entidadId: barrio.id,
      accion: "crear",
      descripcion: `${usuario.nombre} creó el barrio "${barrio.nombre}"`,
    });
    revalidatePath("/barrios");
    revalidatePath("/");
    revalidatePath("/pasajeros", "layout");
    revalidatePath("/mapa");
    return barrio;
  } catch (e) {
    if (esConflictoDeUnicidad(e)) {
      return { error: mensajeConflicto(e, "un barrio") };
    }
    throw e;
  }
}

export async function actualizarBarrio(id: string, input: unknown) {
  const usuario = await requirePermiso("barrio:administrar");
  const data = barrioSchema.parse(input);
  try {
    const barrio = await prisma.barrio.update({
      where: { id },
      data: { nombre: data.nombre, color: data.color || null },
    });
    await registrarCambio({
      usuarioId: usuario.id,
      entidad: "Barrio",
      entidadId: barrio.id,
      accion: "editar",
      descripcion: `${usuario.nombre} editó el barrio "${barrio.nombre}"`,
    });
    revalidatePath("/barrios");
    revalidatePath("/");
    revalidatePath("/pasajeros", "layout");
    revalidatePath("/mapa");
    return barrio;
  } catch (e) {
    if (esConflictoDeUnicidad(e)) {
      return { error: mensajeConflicto(e, "un barrio") };
    }
    throw e;
  }
}

export async function eliminarBarrio(id: string) {
  const usuario = await requirePermiso("barrio:administrar");

  const [serviciosCount, puntosCount] = await Promise.all([
    prisma.servicio.count({ where: { barrioId: id } }),
    prisma.puntoRuta.count({ where: { barrioId: id } }),
  ]);

  if (serviciosCount > 0 || puntosCount > 0) {
    return {
      error: `No se puede eliminar: hay ${serviciosCount} servicio(s) y ${puntosCount} punto(s) del mapa usando este barrio. Desactivalo en vez de eliminarlo, o quitale el barrio a esos registros primero.`,
    };
  }

  const barrio = await prisma.barrio.delete({ where: { id } });
  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Barrio",
    entidadId: id,
    accion: "eliminar",
    descripcion: `${usuario.nombre} eliminó el barrio "${barrio.nombre}"`,
  });
  revalidatePath("/barrios");
  revalidatePath("/");
  revalidatePath("/pasajeros", "layout");
  revalidatePath("/mapa");
  return barrio;
}

export async function cambiarEstadoBarrio(id: string, activo: boolean) {
  const usuario = await requirePermiso("barrio:administrar");
  const barrio = await prisma.barrio.update({
    where: { id },
    data: { activo },
  });
  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Barrio",
    entidadId: barrio.id,
    accion: "editar",
    campo: "activo",
    valorNuevo: String(activo),
    descripcion: `${usuario.nombre} ${activo ? "activó" : "desactivó"} el barrio "${barrio.nombre}"`,
  });
  revalidatePath("/barrios");
  revalidatePath("/");
  revalidatePath("/pasajeros", "layout");
  revalidatePath("/mapa");
  return barrio;
}

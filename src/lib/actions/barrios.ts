"use server";

import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/auth-helpers";
import { barrioSchema } from "@/lib/validators";
import { registrarCambio } from "@/lib/actions/historial";
import { revalidatePath } from "next/cache";

export async function listarBarrios(soloActivos = false) {
  return prisma.barrio.findMany({
    where: soloActivos ? { activo: true } : undefined,
    orderBy: { nombre: "asc" },
  });
}

export async function crearBarrio(input: unknown) {
  const usuario = await requirePermiso("barrio:administrar");
  const data = barrioSchema.parse(input);
  const barrio = await prisma.barrio.create({ data: { nombre: data.nombre } });
  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Barrio",
    entidadId: barrio.id,
    accion: "crear",
    descripcion: `${usuario.nombre} creó el barrio "${barrio.nombre}"`,
  });
  revalidatePath("/barrios");
  revalidatePath("/");
  return barrio;
}

export async function actualizarBarrio(id: string, input: unknown) {
  const usuario = await requirePermiso("barrio:administrar");
  const data = barrioSchema.parse(input);
  const barrio = await prisma.barrio.update({
    where: { id },
    data: { nombre: data.nombre },
  });
  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Barrio",
    entidadId: barrio.id,
    accion: "editar",
    descripcion: `${usuario.nombre} renombró un barrio a "${barrio.nombre}"`,
  });
  revalidatePath("/barrios");
  revalidatePath("/");
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
  return barrio;
}

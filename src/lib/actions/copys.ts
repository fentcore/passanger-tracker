"use server";

import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/auth-helpers";
import { registrarCambio } from "@/lib/actions/historial";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { esConflictoDeUnicidad, mensajeConflicto } from "@/lib/prisma-errors";

const copySchema = z.object({
  titulo: z.string().trim().min(1, "El título es obligatorio"),
  contenido: z.string().trim().min(1, "El mensaje no puede estar vacío"),
  categoriaId: z.string().trim().optional().or(z.literal("")),
  imagenUrl: z.string().trim().optional().or(z.literal("")),
});

const categoriaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  color: z.string().trim().optional().or(z.literal("")),
});

export async function listarCategoriasCopy() {
  await requirePermiso("copy:administrar");
  return prisma.categoriaCopy.findMany({ orderBy: { orden: "asc" } });
}

export async function listarCopys(opts?: { categoriaId?: string; busqueda?: string }) {
  await requirePermiso("copy:administrar");
  return prisma.copy.findMany({
    where: {
      ...(opts?.categoriaId ? { categoriaId: opts.categoriaId } : {}),
      ...(opts?.busqueda
        ? {
            OR: [
              { titulo: { contains: opts.busqueda } },
              { contenido: { contains: opts.busqueda } },
            ],
          }
        : {}),
    },
    include: { categoria: true },
    orderBy: { titulo: "asc" },
  });
}

export async function crearCategoriaCopy(input: unknown) {
  const usuario = await requirePermiso("copy:administrar");
  const data = categoriaSchema.parse(input);
  try {
    const categoria = await prisma.categoriaCopy.create({
      data: { nombre: data.nombre, color: data.color || null },
    });
    await registrarCambio({
      usuarioId: usuario.id,
      entidad: "CategoriaCopy",
      entidadId: categoria.id,
      accion: "crear",
      descripcion: `${usuario.nombre} creó la categoría de copys "${categoria.nombre}"`,
    });
    revalidatePath("/copys");
    return categoria;
  } catch (e) {
    if (esConflictoDeUnicidad(e)) {
      return { error: mensajeConflicto(e, "una categoría") };
    }
    throw e;
  }
}

export async function actualizarCategoriaCopy(id: string, input: unknown) {
  const usuario = await requirePermiso("copy:administrar");
  const data = categoriaSchema.parse(input);
  try {
    const categoria = await prisma.categoriaCopy.update({
      where: { id },
      data: { nombre: data.nombre, color: data.color || null },
    });
    await registrarCambio({
      usuarioId: usuario.id,
      entidad: "CategoriaCopy",
      entidadId: categoria.id,
      accion: "editar",
      descripcion: `${usuario.nombre} editó la categoría de copys "${categoria.nombre}"`,
    });
    revalidatePath("/copys");
    return categoria;
  } catch (e) {
    if (esConflictoDeUnicidad(e)) {
      return { error: mensajeConflicto(e, "una categoría") };
    }
    throw e;
  }
}

export async function crearCopy(input: unknown) {
  const usuario = await requirePermiso("copy:administrar");
  const data = copySchema.parse(input);
  const copy = await prisma.copy.create({
    data: {
      titulo: data.titulo,
      contenido: data.contenido,
      categoriaId: data.categoriaId || null,
      imagenUrl: data.imagenUrl || null,
    },
  });
  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Copy",
    entidadId: copy.id,
    accion: "crear",
    descripcion: `${usuario.nombre} creó el copy "${copy.titulo}"`,
  });
  revalidatePath("/copys");
  return copy;
}

export async function actualizarCopy(id: string, input: unknown) {
  const usuario = await requirePermiso("copy:administrar");
  const data = copySchema.parse(input);
  const copy = await prisma.copy.update({
    where: { id },
    data: {
      titulo: data.titulo,
      contenido: data.contenido,
      categoriaId: data.categoriaId || null,
      imagenUrl: data.imagenUrl || null,
    },
  });
  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Copy",
    entidadId: copy.id,
    accion: "editar",
    descripcion: `${usuario.nombre} editó el copy "${copy.titulo}"`,
  });
  revalidatePath("/copys");
  return copy;
}

export async function eliminarCopy(id: string) {
  const usuario = await requirePermiso("copy:administrar");
  const copy = await prisma.copy.delete({ where: { id } });
  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Copy",
    entidadId: copy.id,
    accion: "eliminar",
    descripcion: `${usuario.nombre} eliminó el copy "${copy.titulo}"`,
  });
  revalidatePath("/copys");
  return copy;
}

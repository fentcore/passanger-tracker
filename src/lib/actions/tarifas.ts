"use server";

import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/auth-helpers";
import { registrarCambio } from "@/lib/actions/historial";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function obtenerTarifaActiva() {
  await requirePermiso("tarifa:administrar");
  let tarifa = await prisma.tarifa.findFirst({ where: { activa: true } });
  if (!tarifa) {
    tarifa = await prisma.tarifa.create({ data: { nombre: "Tarifa general", precio: 0 } });
  }
  return tarifa;
}

/**
 * Actualiza la tarifa general por un valor fijo nuevo o por un porcentaje de aumento.
 * NO toca el precio contratado de los pasajeros existentes.
 */
export async function actualizarTarifa(input: { precioNuevo?: number; porcentaje?: number }) {
  const usuario = await requirePermiso("tarifa:administrar");

  const tarifa = await obtenerTarifaActivaInterna();
  const precioAnterior = tarifa.precio;

  let precioNuevo: number;
  let porcentaje: number | null = null;

  if (input.porcentaje != null) {
    porcentaje = input.porcentaje;
    precioNuevo = Math.round(precioAnterior * (1 + input.porcentaje / 100) * 100) / 100;
  } else if (input.precioNuevo != null) {
    precioNuevo = input.precioNuevo;
    if (precioAnterior > 0) {
      porcentaje = Math.round(((precioNuevo - precioAnterior) / precioAnterior) * 10000) / 100;
    }
  } else {
    throw new Error("Indicá un precio nuevo o un porcentaje");
  }

  const actualizada = await prisma.tarifa.update({
    where: { id: tarifa.id },
    data: { precio: precioNuevo },
  });

  await prisma.historialPrecio.create({
    data: {
      tarifaId: tarifa.id,
      precioAnterior,
      precioNuevo,
      porcentaje: porcentaje ?? undefined,
      usuarioId: usuario.id,
    },
  });

  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Tarifa",
    entidadId: tarifa.id,
    accion: "editar",
    campo: "precio",
    valorAnterior: String(precioAnterior),
    valorNuevo: String(precioNuevo),
    descripcion: `${usuario.nombre} actualizó la tarifa general de $${precioAnterior} a $${precioNuevo}${
      porcentaje != null ? ` (${porcentaje > 0 ? "+" : ""}${porcentaje}%)` : ""
    }`,
  });

  revalidatePath("/precios");
  return actualizada;
}

/**
 * Acción explícita y separada: aplica el precio contratado nuevo a los
 * servicios activos que el usuario elija. Nunca se llama automáticamente
 * desde actualizarTarifa.
 */
export async function aplicarPrecioAContratados(servicioIds: string[], precio: number) {
  const usuario = await requirePermiso("tarifa:administrar");

  const resultado = await prisma.servicio.updateMany({
    where: { id: { in: servicioIds } },
    data: { precioContratado: precio },
  });

  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Servicio",
    entidadId: servicioIds.join(","),
    accion: "editar",
    campo: "precioContratado",
    valorNuevo: String(precio),
    descripcion: `${usuario.nombre} aplicó el precio contratado $${precio} a ${resultado.count} servicio(s)`,
  });

  revalidatePath("/precios");
  revalidatePath("/pasajeros");
  return resultado;
}

// --- Paquetes (promos) ---

const paqueteSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  tramos: z.coerce.number().int().min(1, "Tiene que ser al menos 1"),
  precio: z.coerce.number().min(0, "El precio no puede ser negativo"),
});

export async function listarPaquetes() {
  await requirePermiso("tarifa:administrar");
  return prisma.paqueteTarifa.findMany({ orderBy: [{ orden: "asc" }, { tramos: "asc" }] });
}

export async function crearPaquete(input: unknown) {
  const usuario = await requirePermiso("tarifa:administrar");
  const data = paqueteSchema.parse(input);
  const paquete = await prisma.paqueteTarifa.create({
    data: { nombre: data.nombre, tramos: data.tramos, precio: data.precio },
  });
  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "PaqueteTarifa",
    entidadId: paquete.id,
    accion: "crear",
    descripcion: `${usuario.nombre} creó el paquete "${paquete.nombre}" (${paquete.tramos} tramos, $${paquete.precio})`,
  });
  revalidatePath("/precios");
  return paquete;
}

export async function actualizarPaquete(id: string, input: unknown) {
  const usuario = await requirePermiso("tarifa:administrar");
  const data = paqueteSchema.parse(input);
  const paquete = await prisma.paqueteTarifa.update({
    where: { id },
    data: { nombre: data.nombre, tramos: data.tramos, precio: data.precio },
  });
  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "PaqueteTarifa",
    entidadId: paquete.id,
    accion: "editar",
    descripcion: `${usuario.nombre} editó el paquete "${paquete.nombre}"`,
  });
  revalidatePath("/precios");
  return paquete;
}

export async function cambiarEstadoPaquete(id: string, activo: boolean) {
  const usuario = await requirePermiso("tarifa:administrar");
  const paquete = await prisma.paqueteTarifa.update({ where: { id }, data: { activo } });
  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "PaqueteTarifa",
    entidadId: paquete.id,
    accion: "editar",
    campo: "activo",
    valorNuevo: String(activo),
    descripcion: `${usuario.nombre} ${activo ? "activó" : "desactivó"} el paquete "${paquete.nombre}"`,
  });
  revalidatePath("/precios");
  return paquete;
}

export async function eliminarPaquete(id: string) {
  const usuario = await requirePermiso("tarifa:administrar");
  const paquete = await prisma.paqueteTarifa.delete({ where: { id } });
  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "PaqueteTarifa",
    entidadId: id,
    accion: "eliminar",
    descripcion: `${usuario.nombre} eliminó el paquete "${paquete.nombre}"`,
  });
  revalidatePath("/precios");
  return paquete;
}

/**
 * Aplica el mismo porcentaje de aumento/descuento al precio de todos los
 * paquetes existentes, para trasladarles el mismo cambio que a la tarifa
 * general sin perder la diferencia de precio entre paquetes.
 */
export async function actualizarPreciosPaquetes(porcentaje: number) {
  const usuario = await requirePermiso("tarifa:administrar");

  const paquetes = await prisma.paqueteTarifa.findMany();
  if (paquetes.length === 0) return { count: 0 };

  await prisma.$transaction(
    paquetes.map((p) =>
      prisma.paqueteTarifa.update({
        where: { id: p.id },
        data: { precio: Math.round(p.precio * (1 + porcentaje / 100) * 100) / 100 },
      })
    )
  );

  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "PaqueteTarifa",
    entidadId: "masivo",
    accion: "editar",
    campo: "precio",
    valorNuevo: `${porcentaje > 0 ? "+" : ""}${porcentaje}%`,
    descripcion: `${usuario.nombre} actualizó el precio de todos los paquetes (${porcentaje > 0 ? "+" : ""}${porcentaje}%)`,
  });

  revalidatePath("/precios");
  return { count: paquetes.length };
}

async function obtenerTarifaActivaInterna() {
  let tarifa = await prisma.tarifa.findFirst({ where: { activa: true } });
  if (!tarifa) {
    tarifa = await prisma.tarifa.create({ data: { nombre: "Tarifa general", precio: 0 } });
  }
  return tarifa;
}

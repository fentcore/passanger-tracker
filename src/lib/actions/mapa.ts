"use server";

import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/auth-helpers";
import { registrarCambio } from "@/lib/actions/historial";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const puntoSchema = z.object({
  nombre: z.string().trim().min(1),
  tipo: z.enum(["ORIGEN", "DESTINO", "OTRO"]),
  lat: z.number(),
  lng: z.number(),
  barrioId: z.string().trim().optional().or(z.literal("")),
});

const paradaSchema = z.object({
  tipo: z.enum(["salida", "barrio", "punto"]),
  lat: z.number(),
  lng: z.number(),
  nombre: z.string().trim().min(1),
  horario: z.string().trim().optional().or(z.literal("")),
  barrioId: z.string().trim().optional().or(z.literal("")),
});

const recorridoSchema = z.object({
  nombre: z.string().trim().min(1),
  paradas: z.array(paradaSchema).min(2, "Necesitás una salida y al menos una parada"),
  duracionMin: z.number().optional(),
  distanciaKm: z.number().optional(),
});

export async function listarPuntosRuta() {
  await requirePermiso("mapa:administrar");
  return prisma.puntoRuta.findMany({
    include: { barrio: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function crearPuntoRuta(input: unknown) {
  const usuario = await requirePermiso("mapa:administrar");
  const data = puntoSchema.parse(input);
  const punto = await prisma.puntoRuta.create({
    data: {
      nombre: data.nombre,
      tipo: data.tipo,
      lat: data.lat,
      lng: data.lng,
      barrioId: data.barrioId || null,
    },
  });
  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "PuntoRuta",
    entidadId: punto.id,
    accion: "crear",
    descripcion: `${usuario.nombre} marcó el punto "${punto.nombre}" en el mapa`,
  });
  revalidatePath("/mapa");
  return punto;
}

export async function eliminarPuntoRuta(id: string) {
  const usuario = await requirePermiso("mapa:administrar");
  const punto = await prisma.puntoRuta.delete({ where: { id } });
  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "PuntoRuta",
    entidadId: id,
    accion: "eliminar",
    descripcion: `${usuario.nombre} eliminó el punto "${punto.nombre}" del mapa`,
  });
  revalidatePath("/mapa");
  return punto;
}

export async function listarRecorridos() {
  await requirePermiso("mapa:administrar");
  return prisma.recorrido.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function crearRecorrido(input: unknown) {
  const usuario = await requirePermiso("mapa:administrar");
  const data = recorridoSchema.parse(input);
  const recorrido = await prisma.recorrido.create({
    data: {
      nombre: data.nombre,
      puntosRuta: data.paradas,
      duracionMin: data.duracionMin,
      distanciaKm: data.distanciaKm,
    },
  });
  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Recorrido",
    entidadId: recorrido.id,
    accion: "crear",
    descripcion: `${usuario.nombre} guardó el recorrido "${recorrido.nombre}"`,
  });
  revalidatePath("/mapa");
  return recorrido;
}

export async function actualizarRecorrido(id: string, input: unknown) {
  const usuario = await requirePermiso("mapa:administrar");
  const data = recorridoSchema.parse(input);
  const recorrido = await prisma.recorrido.update({
    where: { id },
    data: {
      nombre: data.nombre,
      puntosRuta: data.paradas,
      duracionMin: data.duracionMin,
      distanciaKm: data.distanciaKm,
    },
  });
  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Recorrido",
    entidadId: recorrido.id,
    accion: "editar",
    descripcion: `${usuario.nombre} editó el recorrido "${recorrido.nombre}"`,
  });
  revalidatePath("/mapa");
  return recorrido;
}

export async function eliminarRecorrido(id: string) {
  const usuario = await requirePermiso("mapa:administrar");
  const recorrido = await prisma.recorrido.delete({ where: { id } });
  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Recorrido",
    entidadId: id,
    accion: "eliminar",
    descripcion: `${usuario.nombre} eliminó el recorrido "${recorrido.nombre}"`,
  });
  revalidatePath("/mapa");
  return recorrido;
}

export async function actualizarUbicacionBarrio(id: string, lat: number, lng: number) {
  const usuario = await requirePermiso("mapa:administrar");
  const barrio = await prisma.barrio.update({
    where: { id },
    data: { lat, lng },
  });
  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Barrio",
    entidadId: id,
    accion: "editar",
    campo: "ubicacion",
    descripcion: `${usuario.nombre} marcó la ubicación del barrio "${barrio.nombre}" en el mapa`,
  });
  revalidatePath("/mapa");
  revalidatePath("/barrios");
  return barrio;
}

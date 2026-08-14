"use server";

import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/auth-helpers";
import {
  pasajeroConServiciosSchema,
  pasajeroSchema,
} from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { DIAS_SEMANA } from "@/lib/constants";
import { registrarCambio } from "@/lib/actions/historial";

function vacioANulo(v: string | undefined | null) {
  return v && v.trim() !== "" ? v : null;
}

function fechaOpcional(v: string | undefined | null) {
  return v && v.trim() !== "" ? new Date(v) : null;
}

export async function crearPasajeroConServicios(input: unknown) {
  const usuario = await requirePermiso("pasajero:crear");
  const data = pasajeroConServiciosSchema.parse(input);

  const pasajero = await prisma.pasajero.create({
    data: {
      nombre: data.pasajero.nombre,
      telefono: vacioANulo(data.pasajero.telefono),
      whatsapp: vacioANulo(data.pasajero.whatsapp),
      email: vacioANulo(data.pasajero.email),
      contactoExtra: vacioANulo(data.pasajero.contactoExtra),
      notasGenerales: vacioANulo(data.pasajero.notasGenerales),
      estado: data.pasajero.estado ?? "ACTIVO",
      servicios: {
        create: data.servicios.map((s) => ({
          diaSemana: s.diaSemana,
          barrioId: vacioANulo(s.barrioId),
          direccion: vacioANulo(s.direccion),
          destino: vacioANulo(s.destino),
          tipoViaje: s.tipoViaje,
          horaIda: vacioANulo(s.horaIda),
          horaVuelta: vacioANulo(s.horaVuelta),
          cantidadTramos: s.cantidadTramos ?? 1,
          estado: s.estado ?? "ACTIVO",
          fechaInicio: fechaOpcional(s.fechaInicio),
          fechaFin: fechaOpcional(s.fechaFin),
          montoAbonado: s.montoAbonado ?? 0,
          estadoPago: s.estadoPago ?? "PENDIENTE",
          metodoPago: vacioANulo(s.metodoPago),
          montoPendiente: s.montoPendiente ?? null,
          notasPago: vacioANulo(s.notasPago),
          notas: vacioANulo(s.notas),
        })),
      },
    },
    include: { servicios: true },
  });

  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Pasajero",
    entidadId: pasajero.id,
    accion: "crear",
    descripcion: `${usuario.nombre} creó a ${pasajero.nombre}`,
  });

  revalidatePath("/");
  revalidatePath("/pasajeros");
  return pasajero;
}

export async function actualizarPasajero(id: string, input: unknown) {
  const usuario = await requirePermiso("pasajero:editar");
  const data = pasajeroSchema.parse(input);

  const pasajero = await prisma.pasajero.update({
    where: { id },
    data: {
      nombre: data.nombre,
      telefono: vacioANulo(data.telefono),
      whatsapp: vacioANulo(data.whatsapp),
      email: vacioANulo(data.email),
      contactoExtra: vacioANulo(data.contactoExtra),
      notasGenerales: vacioANulo(data.notasGenerales),
      ...(data.estado ? { estado: data.estado } : {}),
    },
  });

  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Pasajero",
    entidadId: id,
    accion: "editar",
    descripcion: `${usuario.nombre} editó los datos de ${pasajero.nombre}`,
  });

  revalidatePath("/");
  revalidatePath("/pasajeros");
  revalidatePath(`/pasajeros/${id}`);
  return pasajero;
}

export async function cambiarEstadoPasajero(id: string, estado: "ACTIVO" | "INACTIVO") {
  const usuario = await requirePermiso("pasajero:desactivar");
  const pasajero = await prisma.pasajero.update({
    where: { id },
    data: { estado },
  });

  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Pasajero",
    entidadId: id,
    accion: "editar",
    campo: "estado",
    valorNuevo: estado,
    descripcion: `${usuario.nombre} ${estado === "ACTIVO" ? "activó" : "desactivó"} a ${pasajero.nombre}`,
  });

  revalidatePath("/");
  revalidatePath("/pasajeros");
  revalidatePath(`/pasajeros/${id}`);
  return pasajero;
}

export async function archivarPasajero(id: string) {
  const usuario = await requirePermiso("archivo:administrar");
  const pasajero = await prisma.pasajero.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Pasajero",
    entidadId: id,
    accion: "archivar",
    descripcion: `${usuario.nombre} archivó a ${pasajero.nombre}`,
  });
  revalidatePath("/");
  revalidatePath("/pasajeros");
  revalidatePath("/archivados");
  revalidatePath(`/pasajeros/${id}`);
  return pasajero;
}

export async function restaurarPasajero(id: string) {
  const usuario = await requirePermiso("archivo:administrar");
  const pasajero = await prisma.pasajero.update({
    where: { id },
    data: { archivedAt: null },
  });
  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Pasajero",
    entidadId: id,
    accion: "restaurar",
    descripcion: `${usuario.nombre} restauró a ${pasajero.nombre}`,
  });
  revalidatePath("/");
  revalidatePath("/pasajeros");
  revalidatePath("/archivados");
  revalidatePath(`/pasajeros/${id}`);
  return pasajero;
}

export async function listarPasajerosArchivados() {
  await requirePermiso("archivo:administrar");
  return prisma.pasajero.findMany({
    where: { archivedAt: { not: null } },
    orderBy: { archivedAt: "desc" },
  });
}

export async function obtenerPasajero(id: string) {
  await requirePermiso("pasajero:editar");
  const pasajero = await prisma.pasajero.findUnique({
    where: { id },
    include: {
      servicios: {
        where: { archivedAt: null },
        include: {
          barrio: true,
          notasRel: {
            orderBy: { creadaEn: "desc" },
            include: { creador: true, revisor: true },
          },
        },
      },
      notas: {
        where: { servicioId: null },
        orderBy: { creadaEn: "desc" },
        include: { creador: true, revisor: true },
      },
    },
  });

  if (!pasajero) return null;

  const orden = (dia: string) => DIAS_SEMANA.indexOf(dia as (typeof DIAS_SEMANA)[number]);
  pasajero.servicios.sort((a, b) => orden(a.diaSemana) - orden(b.diaSemana));

  return pasajero;
}

export async function listarPasajeros(opts?: {
  busqueda?: string;
  estado?: "ACTIVO" | "INACTIVO";
  telefono?: string;
  barrioId?: string;
  tipoViaje?: string;
  estadoPago?: string;
}) {
  await requirePermiso("pasajero:editar");
  return prisma.pasajero.findMany({
    where: {
      archivedAt: null,
      ...(opts?.estado ? { estado: opts.estado } : {}),
      ...(opts?.busqueda ? { nombre: { contains: opts.busqueda } } : {}),
      ...(opts?.telefono ? { telefono: { contains: opts.telefono } } : {}),
      ...(opts?.barrioId || opts?.tipoViaje || opts?.estadoPago
        ? {
            servicios: {
              some: {
                ...(opts?.barrioId ? { barrioId: opts.barrioId } : {}),
                ...(opts?.tipoViaje ? { tipoViaje: opts.tipoViaje as never } : {}),
                ...(opts?.estadoPago ? { estadoPago: opts.estadoPago as never } : {}),
              },
            },
          }
        : {}),
    },
    include: { servicios: true },
    orderBy: { nombre: "asc" },
  });
}

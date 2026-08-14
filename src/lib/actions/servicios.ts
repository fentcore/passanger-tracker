"use server";

import { prisma } from "@/lib/prisma";
import { requirePermiso, requireUsuario } from "@/lib/auth-helpers";
import { servicioSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { registrarCambio } from "@/lib/actions/historial";

function vacioANulo(v: string | undefined | null) {
  return v && v.trim() !== "" ? v : null;
}

function fechaOpcional(v: string | undefined | null) {
  return v && v.trim() !== "" ? new Date(v) : null;
}

export async function crearServicio(pasajeroId: string, input: unknown) {
  const usuario = await requirePermiso("servicio:crear");
  const s = servicioSchema.parse(input);

  const servicio = await prisma.servicio.create({
    data: {
      pasajeroId,
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
    },
    include: { pasajero: { select: { nombre: true } } },
  });

  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Servicio",
    entidadId: servicio.id,
    accion: "crear",
    descripcion: `${usuario.nombre} agregó ${servicio.diaSemana.toLowerCase()} para ${servicio.pasajero.nombre}`,
  });

  revalidatePath("/");
  revalidatePath(`/pasajeros/${pasajeroId}`);
  return servicio;
}

export async function actualizarServicio(id: string, input: unknown) {
  const usuario = await requirePermiso("servicio:editar");
  const s = servicioSchema.parse(input);

  const anterior = await prisma.servicio.findUniqueOrThrow({
    where: { id },
    include: { pasajero: { select: { nombre: true } } },
  });

  const servicio = await prisma.servicio.update({
    where: { id },
    data: {
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
    },
  });

  const cambiosHorario: string[] = [];
  if (anterior.horaIda !== servicio.horaIda) {
    cambiosHorario.push(`ida de ${anterior.horaIda ?? "—"} a ${servicio.horaIda ?? "—"}`);
  }
  if (anterior.horaVuelta !== servicio.horaVuelta) {
    cambiosHorario.push(`vuelta de ${anterior.horaVuelta ?? "—"} a ${servicio.horaVuelta ?? "—"}`);
  }
  const descripcion =
    cambiosHorario.length > 0
      ? `${usuario.nombre} modificó el horario de ${anterior.pasajero.nombre} (${anterior.diaSemana.toLowerCase()}): ${cambiosHorario.join(", ")}`
      : `${usuario.nombre} editó el servicio de ${anterior.diaSemana.toLowerCase()} de ${anterior.pasajero.nombre}`;

  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Servicio",
    entidadId: servicio.id,
    accion: "editar",
    campo: cambiosHorario.length > 0 ? "horario" : undefined,
    descripcion,
  });

  revalidatePath("/");
  revalidatePath(`/pasajeros/${servicio.pasajeroId}`);
  return servicio;
}

export async function cambiarEstadoServicio(id: string, estado: string) {
  const usuario = await requirePermiso("servicio:editar");
  const servicio = await prisma.servicio.update({
    where: { id },
    data: { estado: estado as never },
    include: { pasajero: { select: { nombre: true } } },
  });

  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Servicio",
    entidadId: servicio.id,
    accion: "editar",
    campo: "estado",
    valorNuevo: estado,
    descripcion: `${usuario.nombre} cambió el estado del servicio de ${servicio.diaSemana.toLowerCase()} de ${servicio.pasajero.nombre} a ${estado}`,
  });

  revalidatePath("/");
  revalidatePath(`/pasajeros/${servicio.pasajeroId}`);
  return servicio;
}

export async function eliminarServicio(id: string) {
  const usuario = await requirePermiso("servicio:desactivar");
  const servicio = await prisma.servicio.delete({
    where: { id },
    include: { pasajero: { select: { nombre: true } } },
  });

  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Servicio",
    entidadId: id,
    accion: "eliminar",
    descripcion: `${usuario.nombre} eliminó el servicio de ${servicio.diaSemana.toLowerCase()} de ${servicio.pasajero.nombre}`,
  });

  revalidatePath("/");
  revalidatePath(`/pasajeros/${servicio.pasajeroId}`);
  return servicio;
}

export async function archivarServicio(id: string) {
  const usuario = await requirePermiso("archivo:administrar");
  const servicio = await prisma.servicio.update({
    where: { id },
    data: { archivedAt: new Date() },
    include: { pasajero: { select: { nombre: true } } },
  });

  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Servicio",
    entidadId: id,
    accion: "archivar",
    descripcion: `${usuario.nombre} archivó el servicio de ${servicio.diaSemana.toLowerCase()} de ${servicio.pasajero.nombre}`,
  });

  revalidatePath("/");
  revalidatePath(`/pasajeros/${servicio.pasajeroId}`);
  revalidatePath("/archivados");
  return servicio;
}

export async function restaurarServicio(id: string) {
  const usuario = await requirePermiso("archivo:administrar");
  const servicio = await prisma.servicio.update({
    where: { id },
    data: { archivedAt: null },
    include: { pasajero: { select: { nombre: true } } },
  });

  await registrarCambio({
    usuarioId: usuario.id,
    entidad: "Servicio",
    entidadId: id,
    accion: "restaurar",
    descripcion: `${usuario.nombre} restauró el servicio de ${servicio.diaSemana.toLowerCase()} de ${servicio.pasajero.nombre}`,
  });

  revalidatePath("/");
  revalidatePath(`/pasajeros/${servicio.pasajeroId}`);
  revalidatePath("/archivados");
  return servicio;
}

export async function listarServiciosArchivados() {
  await requirePermiso("archivo:administrar");
  return prisma.servicio.findMany({
    where: { archivedAt: { not: null } },
    include: { pasajero: { select: { id: true, nombre: true } }, barrio: true },
    orderBy: { archivedAt: "desc" },
  });
}

export async function cambiarTramos(id: string, delta: 1 | -1) {
  await requireUsuario();

  const actual = await prisma.servicio.findUnique({
    where: { id },
    select: { cantidadTramos: true, pasajeroId: true },
  });
  if (!actual) throw new Error("Servicio no encontrado");

  const nuevaCantidad = Math.max(0, actual.cantidadTramos + delta);

  const servicio = await prisma.servicio.update({
    where: { id },
    data: { cantidadTramos: nuevaCantidad },
  });

  revalidatePath("/");
  revalidatePath(`/pasajeros/${actual.pasajeroId}`);
  return servicio;
}

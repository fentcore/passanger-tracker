"use server";

import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/auth-helpers";

export async function registrarCambio(params: {
  usuarioId: string;
  entidad: string;
  entidadId: string;
  accion: string;
  campo?: string;
  valorAnterior?: string;
  valorNuevo?: string;
  descripcion: string;
}) {
  await prisma.historialCambio.create({ data: params });
}

export async function listarHistorial(opts?: {
  usuarioId?: string;
  entidad?: string;
  accion?: string;
  desde?: string;
  hasta?: string;
}) {
  await requirePermiso("historial:ver");

  return prisma.historialCambio.findMany({
    where: {
      ...(opts?.usuarioId ? { usuarioId: opts.usuarioId } : {}),
      ...(opts?.entidad ? { entidad: opts.entidad } : {}),
      ...(opts?.accion ? { accion: opts.accion } : {}),
      ...(opts?.desde || opts?.hasta
        ? {
            creadoEn: {
              ...(opts?.desde ? { gte: new Date(opts.desde) } : {}),
              ...(opts?.hasta ? { lte: new Date(opts.hasta) } : {}),
            },
          }
        : {}),
    },
    include: { usuario: true },
    orderBy: { creadoEn: "desc" },
    take: 300,
  });
}

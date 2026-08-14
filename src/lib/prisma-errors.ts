import { Prisma } from "@prisma/client";

/**
 * Next.js redacta el mensaje de cualquier error que un server action tire
 * en producción (queda como "Minified React error #441"). Para los errores
 * previsibles (nombre duplicado, etc.) hay que ATRAPARLOS y devolver un
 * objeto { error } en vez de relanzarlos, para que el mensaje llegue al
 * usuario.
 */
export function esConflictoDeUnicidad(e: unknown): e is Prisma.PrismaClientKnownRequestError {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export function mensajeConflicto(e: Prisma.PrismaClientKnownRequestError, nombreEntidad: string): string {
  const campo = Array.isArray(e.meta?.target) ? e.meta.target.join(", ") : "ese valor";
  return `Ya existe ${nombreEntidad} con ${campo === "nombre" ? "ese nombre" : campo}.`;
}

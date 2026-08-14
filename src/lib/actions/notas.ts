"use server";

import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/auth-helpers";
import { notaSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export async function crearNota(input: unknown) {
  const usuario = await requirePermiso("nota:crear");
  const data = notaSchema.parse(input);

  const nota = await prisma.nota.create({
    data: {
      pasajeroId: data.pasajeroId,
      servicioId: data.servicioId && data.servicioId !== "" ? data.servicioId : null,
      contenido: data.contenido,
      creadorId: usuario.id,
    },
  });

  revalidatePath("/");
  revalidatePath(`/pasajeros/${data.pasajeroId}`);
  return nota;
}

export async function marcarNotaRevisada(id: string) {
  const usuario = await requirePermiso("nota:revisar");

  const nota = await prisma.nota.update({
    where: { id },
    data: {
      revisada: true,
      revisadaEn: new Date(),
      revisorId: usuario.id,
    },
  });

  revalidatePath("/");
  revalidatePath(`/pasajeros/${nota.pasajeroId}`);
  return nota;
}

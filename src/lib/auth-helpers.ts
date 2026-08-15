import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Accion, can } from "@/lib/permissions";

export type UsuarioSesion = {
  id: string;
  nombre: string;
  email: string;
  rol: "ADMIN" | "ASISTENTE";
};

// Memoizado por request: layout, page y varias server actions llaman esto en
// paralelo para la misma carga de página, y sin cache() cada llamado repetía
// el viaje de red a Supabase Auth + la consulta a Postgres.
export const requireUsuario = cache(async (): Promise<UsuarioSesion> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const perfil = await prisma.usuario.findUnique({ where: { id: user.id } });
  if (!perfil || !perfil.activo) {
    throw new Error("No autenticado");
  }

  return {
    id: perfil.id,
    nombre: perfil.nombre,
    email: perfil.email,
    rol: perfil.rol,
  };
});

export async function requirePermiso(accion: Accion): Promise<UsuarioSesion> {
  const usuario = await requireUsuario();
  if (!can(usuario.rol, accion)) {
    throw new Error("No tenés permiso para realizar esta acción");
  }
  return usuario;
}

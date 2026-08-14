import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Accion, can } from "@/lib/permissions";

export type UsuarioSesion = {
  id: string;
  nombre: string;
  email: string;
  rol: "ADMIN" | "ASISTENTE";
};

export async function requireUsuario(): Promise<UsuarioSesion> {
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
}

export async function requirePermiso(accion: Accion): Promise<UsuarioSesion> {
  const usuario = await requireUsuario();
  if (!can(usuario.rol, accion)) {
    throw new Error("No tenés permiso para realizar esta acción");
  }
  return usuario;
}

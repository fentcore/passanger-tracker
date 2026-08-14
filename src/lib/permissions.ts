export type Rol = "ADMIN" | "ASISTENTE";

export type Accion =
  | "pasajero:crear"
  | "pasajero:editar"
  | "pasajero:desactivar"
  | "servicio:crear"
  | "servicio:editar"
  | "servicio:desactivar"
  | "barrio:administrar"
  | "nota:crear"
  | "nota:revisar"
  | "financiero:ver"
  | "copy:administrar"
  | "tarifa:administrar"
  | "historial:ver"
  | "archivo:administrar"
  | "mapa:administrar";

// Hoy ambos roles tienen acceso completo a la gestión de pasajeros y servicios.
// Este mapa queda como único punto de ajuste si en el futuro se necesita
// restringir alguna acción puntual para un rol específico.
const PERMISOS: Record<Rol, "ALL" | Accion[]> = {
  ADMIN: "ALL",
  ASISTENTE: "ALL",
};

export function can(rol: Rol, accion: Accion): boolean {
  const permisos = PERMISOS[rol];
  if (permisos === "ALL") return true;
  return permisos.includes(accion);
}

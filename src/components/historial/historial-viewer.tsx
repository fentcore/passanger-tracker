"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { History } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type HistorialItem = {
  id: string;
  entidad: string;
  accion: string;
  descripcion: string;
  creadoEn: Date | string;
  usuario: { nombre: string };
};

const ACCION_LABEL: Record<string, string> = {
  crear: "Creación",
  editar: "Edición",
  archivar: "Archivado",
  restaurar: "Restauración",
  eliminar: "Eliminación",
};

export function HistorialViewer({ items }: { items: HistorialItem[] }) {
  const [usuario, setUsuario] = useState("TODOS");
  const [entidad, setEntidad] = useState("TODOS");
  const [accion, setAccion] = useState("TODOS");

  const usuarios = useMemo(
    () => Array.from(new Set(items.map((i) => i.usuario.nombre))),
    [items]
  );
  const entidades = useMemo(() => Array.from(new Set(items.map((i) => i.entidad))), [items]);
  const acciones = useMemo(() => Array.from(new Set(items.map((i) => i.accion))), [items]);

  const filtrados = items.filter((i) => {
    if (usuario !== "TODOS" && i.usuario.nombre !== usuario) return false;
    if (entidad !== "TODOS" && i.entidad !== entidad) return false;
    if (accion !== "TODOS" && i.accion !== accion) return false;
    return true;
  });

  const usuarioItems = { TODOS: "Todos", ...Object.fromEntries(usuarios.map((u) => [u, u])) };
  const entidadItems = { TODOS: "Todas", ...Object.fromEntries(entidades.map((e) => [e, e])) };
  const accionItems = {
    TODOS: "Todas",
    ...Object.fromEntries(acciones.map((a) => [a, ACCION_LABEL[a] ?? a])),
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Historial de cambios</h1>
        <p className="text-sm text-muted-foreground">
          Quién modificó qué y cuándo, en todos los dispositivos
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Select items={usuarioItems} value={usuario} onValueChange={(v) => v && setUsuario(v)}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            {usuarios.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select items={entidadItems} value={entidad} onValueChange={(v) => v && setEntidad(v)}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todas</SelectItem>
            {entidades.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select items={accionItems} value={accion} onValueChange={(v) => v && setAccion(v)}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todas</SelectItem>
            {acciones.map((a) => (
              <SelectItem key={a} value={a}>
                {ACCION_LABEL[a] ?? a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <History className="size-10" />
          <p className="font-medium">No hay registros para este filtro</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtrados.map((i) => (
            <div key={i.id} className="rounded-xl border bg-card p-3 text-sm">
              <p>{i.descripcion}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {format(new Date(i.creadoEn), "d MMM yyyy HH:mm", { locale: es })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

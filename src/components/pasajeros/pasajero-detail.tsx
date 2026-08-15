"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pencil,
  MessageCircle,
  Mail,
  Info,
  Briefcase,
  Plus,
  Minus,
  Power,
  Archive,
  ArchiveRestore,
  Users,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DIAS_SEMANA, DiaSemana } from "@/lib/constants";
import { EditarPasajeroDialog } from "@/components/pasajeros/editar-pasajero-dialog";
import { ServicioEditorSheet } from "@/components/pasajeros/servicio-editor-sheet";
import { ServicioItem, ServicioDetalle } from "@/components/pasajeros/servicio-item";
import { NotaDialog, NotaItem } from "@/components/agenda/nota-dialog";
import { servicioDraftVacio } from "@/components/pasajeros/types";
import {
  cambiarEstadoPasajero,
  archivarPasajero,
  restaurarPasajero,
  cambiarTramos,
} from "@/lib/actions/pasajeros";
import { toast } from "sonner";
import { BackButton } from "@/components/back-button";

export type PasajeroDetalleData = {
  id: string;
  nombre: string;
  telefono: string | null;
  whatsapp: string | null;
  email: string | null;
  contactoExtra: string | null;
  empleador: string | null;
  notasGenerales: string | null;
  estado: "ACTIVO" | "INACTIVO";
  archivedAt: Date | string | null;
  tramos: number;
  companerosGrupo: { id: string; nombre: string }[];
  servicios: ServicioDetalle[];
  notas: NotaItem[];
};

export function PasajeroDetail({
  pasajero,
  barrios,
}: {
  pasajero: PasajeroDetalleData;
  barrios: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [addDiaOpen, setAddDiaOpen] = useState(false);
  const [notaGeneralOpen, setNotaGeneralOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [tramos, setTramos] = useState(pasajero.tramos);

  const diasUsados = pasajero.servicios.map((s) => s.diaSemana);
  const diasDisponibles = DIAS_SEMANA.filter((d) => !diasUsados.includes(d));

  const pendientesGenerales = pasajero.notas.filter((n) => !n.revisada).length;

  function ajustarTramos(delta: 1 | -1) {
    setTramos((prev) => Math.max(0, prev + delta));
    startTransition(async () => {
      try {
        await cambiarTramos(pasajero.id, delta);
        router.refresh();
      } catch {
        setTramos((prev) => Math.max(0, prev - delta));
        toast.error("No se pudo actualizar los tramos");
      }
    });
  }

  function toggleEstado() {
    const nuevo = pasajero.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    startTransition(async () => {
      try {
        await cambiarEstadoPasajero(pasajero.id, nuevo);
        toast.success(nuevo === "ACTIVO" ? "Pasajero activado" : "Pasajero desactivado");
        router.refresh();
      } catch {
        toast.error("No se pudo cambiar el estado");
      }
    });
  }

  function handleArchivar() {
    startTransition(async () => {
      try {
        await archivarPasajero(pasajero.id);
        toast.success("Pasajero archivado");
        router.refresh();
      } catch {
        toast.error("No se pudo archivar");
      }
    });
  }

  function handleRestaurar() {
    startTransition(async () => {
      try {
        await restaurarPasajero(pasajero.id);
        toast.success("Pasajero restaurado");
        router.refresh();
      } catch {
        toast.error("No se pudo restaurar");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/pasajeros" />
        <span className="text-sm text-muted-foreground">Pasajeros</span>
      </div>
      {pasajero.archivedAt && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-muted px-3.5 py-2.5 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Archive className="size-4" />
            Este pasajero está archivado
          </span>
          <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled={pending} onClick={handleRestaurar}>
            <ArchiveRestore className="size-4" />
            Restaurar
          </Button>
        </div>
      )}
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold leading-tight">{pasajero.nombre}</h1>
              <Badge
                variant="secondary"
                className={
                  pasajero.estado === "ACTIVO"
                    ? "mt-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "mt-1 bg-muted text-muted-foreground"
                }
              >
                {pasajero.estado === "ACTIVO" ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="outline" className="size-9" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="size-9"
                disabled={pending}
                onClick={toggleEstado}
                title={pasajero.estado === "ACTIVO" ? "Desactivar" : "Activar"}
              >
                <Power className="size-4" />
              </Button>
              {!pasajero.archivedAt && (
                <AlertDialog>
                  <AlertDialogTrigger render={<Button size="icon" variant="outline" className="size-9" title="Archivar" />}>
                    <Archive className="size-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Archivar a {pasajero.nombre}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Va a desaparecer de la agenda y de la lista de pasajeros. Podés restaurarlo
                        cuando quieras desde la sección Archivados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleArchivar}>Archivar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            {pasajero.whatsapp && (
              <span className="flex items-center gap-2">
                <MessageCircle className="size-4 text-muted-foreground" /> {pasajero.whatsapp}
              </span>
            )}
            {pasajero.email && (
              <span className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" /> {pasajero.email}
              </span>
            )}
            {pasajero.contactoExtra && (
              <span className="flex items-center gap-2">
                <Info className="size-4 text-muted-foreground" /> {pasajero.contactoExtra}
              </span>
            )}
            {pasajero.empleador && (
              <span className="flex items-center gap-2">
                <Briefcase className="size-4 text-muted-foreground" /> {pasajero.empleador}
              </span>
            )}
          </div>

          {pasajero.notasGenerales && (
            <p className="text-sm rounded-lg bg-muted/50 p-2.5 text-muted-foreground">
              {pasajero.notasGenerales}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3">
            <div className="min-w-0">
              <span className="text-xs font-medium text-muted-foreground">Tramos</span>
              {pasajero.companerosGrupo.length > 0 && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                  <Users className="size-3 shrink-0" />
                  Compartidos con{" "}
                  {pasajero.companerosGrupo.map((c, i) => (
                    <span key={c.id}>
                      {i > 0 && ", "}
                      <Link href={`/pasajeros/${c.id}`} className="underline">
                        {c.nombre}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="icon"
                variant="outline"
                className="size-9 rounded-full"
                disabled={pending || tramos <= 0}
                onClick={() => ajustarTramos(-1)}
                aria-label="Restar tramo"
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-10 text-center text-lg font-bold tabular-nums">{tramos}</span>
              <Button
                size="icon"
                variant="outline"
                className="size-9 rounded-full"
                disabled={pending}
                onClick={() => ajustarTramos(1)}
                aria-label="Sumar tramo"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <Button
            variant={pendientesGenerales > 0 ? "default" : "outline"}
            className="self-start h-9 rounded-full gap-1.5"
            onClick={() => setNotaGeneralOpen(true)}
          >
            <MessageCircle className="size-4" />
            Notas generales{pendientesGenerales > 0 ? ` (${pendientesGenerales})` : ""}
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-semibold">Servicios</h2>
        {diasDisponibles.length > 0 && (
          <Button size="sm" variant="outline" className="rounded-full gap-1.5" onClick={() => setAddDiaOpen(true)}>
            <Plus className="size-4" />
            Agregar día
          </Button>
        )}
      </div>

      {pasajero.servicios.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Este pasajero todavía no tiene días de viaje cargados.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {pasajero.servicios.map((s) => (
            <ServicioItem
              key={s.id}
              servicio={s}
              diasDisponibles={diasDisponibles}
              barrios={barrios}
              pasajeroNombre={pasajero.nombre}
            />
          ))}
        </div>
      )}

      <EditarPasajeroDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        pasajeroId={pasajero.id}
        inicial={{
          nombre: pasajero.nombre,
          telefono: pasajero.telefono ?? "",
          whatsapp: pasajero.whatsapp ?? "",
          email: pasajero.email ?? "",
          contactoExtra: pasajero.contactoExtra ?? "",
          empleador: pasajero.empleador ?? "",
          notasGenerales: pasajero.notasGenerales ?? "",
          estado: pasajero.estado,
        }}
      />

      {diasDisponibles.length > 0 && (
        <ServicioEditorSheet
          open={addDiaOpen}
          onOpenChange={setAddDiaOpen}
          pasajeroId={pasajero.id}
          diasDisponibles={diasDisponibles}
          inicial={servicioDraftVacio(diasDisponibles[0] as DiaSemana)}
          barrios={barrios}
        />
      )}

      <NotaDialog
        open={notaGeneralOpen}
        onOpenChange={setNotaGeneralOpen}
        pasajeroNombre={pasajero.nombre}
        diaLabel="General"
        servicioId=""
        pasajeroId={pasajero.id}
        notas={pasajero.notas}
      />
    </div>
  );
}

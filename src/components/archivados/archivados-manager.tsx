"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArchiveRestore, Archive } from "lucide-react";
import { restaurarPasajero } from "@/lib/actions/pasajeros";
import { restaurarServicio } from "@/lib/actions/servicios";
import { DIA_LABEL, DiaSemana } from "@/lib/constants";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type PasajeroArchivado = { id: string; nombre: string; archivedAt: Date | string | null };
type ServicioArchivado = {
  id: string;
  diaSemana: DiaSemana;
  archivedAt: Date | string | null;
  pasajero: { id: string; nombre: string };
  barrio: { nombre: string } | null;
};

export function ArchivadosManager({
  pasajeros,
  servicios,
}: {
  pasajeros: PasajeroArchivado[];
  servicios: ServicioArchivado[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function restaurarP(id: string) {
    startTransition(async () => {
      try {
        await restaurarPasajero(id);
        toast.success("Pasajero restaurado");
        router.refresh();
      } catch {
        toast.error("No se pudo restaurar");
      }
    });
  }

  function restaurarS(id: string) {
    startTransition(async () => {
      try {
        await restaurarServicio(id);
        toast.success("Servicio restaurado");
        router.refresh();
      } catch {
        toast.error("No se pudo restaurar");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">Archivados</h1>
        <p className="text-sm text-muted-foreground">
          Nada se elimina para siempre — restaurá cuando lo necesites.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <h2 className="text-sm font-semibold text-muted-foreground px-1">
          Pasajeros ({pasajeros.length})
        </h2>
        {pasajeros.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1">No hay pasajeros archivados.</p>
        ) : (
          pasajeros.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm"
            >
              <div className="min-w-0">
                <Link href={`/pasajeros/${p.id}`} className="font-semibold hover:underline">
                  {p.nombre}
                </Link>
                {p.archivedAt && (
                  <p className="text-xs text-muted-foreground">
                    Archivado el {format(new Date(p.archivedAt), "d MMM yyyy", { locale: es })}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full gap-1.5 shrink-0"
                disabled={pending}
                onClick={() => restaurarP(p.id)}
              >
                <ArchiveRestore className="size-4" />
                Restaurar
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <h2 className="text-sm font-semibold text-muted-foreground px-1">
          Servicios ({servicios.length})
        </h2>
        {servicios.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1">No hay servicios archivados.</p>
        ) : (
          servicios.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{DIA_LABEL[s.diaSemana]}</Badge>
                  <Link href={`/pasajeros/${s.pasajero.id}`} className="font-semibold hover:underline truncate">
                    {s.pasajero.nombre}
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">
                  {s.barrio?.nombre ?? "Sin barrio"}
                  {s.archivedAt &&
                    ` · Archivado el ${format(new Date(s.archivedAt), "d MMM yyyy", { locale: es })}`}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full gap-1.5 shrink-0"
                disabled={pending}
                onClick={() => restaurarS(s.id)}
              >
                <ArchiveRestore className="size-4" />
                Restaurar
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

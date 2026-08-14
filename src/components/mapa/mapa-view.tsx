"use client";

import "leaflet/dist/leaflet.css";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MapPin, Route, Trash2, X } from "lucide-react";
import {
  crearPuntoRuta,
  eliminarPuntoRuta,
  crearRecorrido,
  eliminarRecorrido,
  actualizarUbicacionBarrio,
} from "@/lib/actions/mapa";
import { distanciaTotalKm, duracionEstimadaMin, type LatLng } from "@/lib/geo";
import { toast } from "sonner";

type Barrio = { id: string; nombre: string; lat: number | null; lng: number | null };
type PuntoRuta = {
  id: string;
  nombre: string;
  tipo: "ORIGEN" | "DESTINO" | "OTRO";
  lat: number;
  lng: number;
  barrio: { nombre: string } | null;
};
type Recorrido = {
  id: string;
  nombre: string;
  puntosRuta: unknown;
  duracionMin: number | null;
  distanciaKm: number | null;
  origen: { nombre: string } | null;
  destino: { nombre: string } | null;
};

const COLOR_TIPO: Record<string, string> = {
  BARRIO: "#2F5FE0",
  ORIGEN: "#16a34a",
  DESTINO: "#dc2626",
  OTRO: "#6b7280",
};

function icono(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

type Modo = "ninguno" | "barrio" | "punto" | "recorrido";

function ManejadorClicks({
  modo,
  onClick,
}: {
  modo: Modo;
  onClick: (p: LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      if (modo === "ninguno") return;
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function MapaView({
  barrios,
  puntos,
  recorridos,
}: {
  barrios: Barrio[];
  puntos: PuntoRuta[];
  recorridos: Recorrido[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modo, setModo] = useState<Modo>("ninguno");

  const [barrioForm, setBarrioForm] = useState<{ pos: LatLng; barrioId: string } | null>(null);

  const [puntoForm, setPuntoForm] = useState<{
    pos: LatLng;
    nombre: string;
    tipo: "ORIGEN" | "DESTINO" | "OTRO";
  } | null>(null);

  const [rutaWaypoints, setRutaWaypoints] = useState<LatLng[]>([]);
  const [recorridoForm, setRecorridoForm] = useState<{ nombre: string } | null>(null);
  const [recorridoActivo, setRecorridoActivo] = useState<Recorrido | null>(null);

  const barrioConUbicacion = barrios.find((b) => b.lat != null && b.lng != null);
  const centro: LatLng = barrioConUbicacion
    ? { lat: barrioConUbicacion.lat!, lng: barrioConUbicacion.lng! }
    : puntos[0]
      ? { lat: puntos[0].lat, lng: puntos[0].lng }
      : { lat: -27.45, lng: -58.98 };

  function handleMapClick(p: LatLng) {
    if (modo === "barrio") {
      setBarrioForm({ pos: p, barrioId: "" });
    } else if (modo === "punto") {
      setPuntoForm({ pos: p, nombre: "", tipo: "OTRO" });
    } else if (modo === "recorrido") {
      setRutaWaypoints((prev) => [...prev, p]);
    }
  }

  function guardarBarrio() {
    if (!barrioForm?.barrioId) {
      toast.error("Elegí un barrio");
      return;
    }
    startTransition(async () => {
      try {
        await actualizarUbicacionBarrio(barrioForm.barrioId, barrioForm.pos.lat, barrioForm.pos.lng);
        toast.success("Ubicación del barrio guardada");
        setBarrioForm(null);
        setModo("ninguno");
        router.refresh();
      } catch {
        toast.error("No se pudo guardar");
      }
    });
  }

  function guardarPunto() {
    if (!puntoForm?.nombre.trim()) {
      toast.error("Ponele un nombre al punto");
      return;
    }
    startTransition(async () => {
      try {
        await crearPuntoRuta({
          nombre: puntoForm.nombre,
          tipo: puntoForm.tipo,
          lat: puntoForm.pos.lat,
          lng: puntoForm.pos.lng,
        });
        toast.success("Punto guardado");
        setPuntoForm(null);
        setModo("ninguno");
        router.refresh();
      } catch {
        toast.error("No se pudo guardar");
      }
    });
  }

  function terminarRecorrido() {
    if (rutaWaypoints.length < 2) {
      toast.error("Marcá al menos 2 puntos en el mapa");
      return;
    }
    setRecorridoForm({ nombre: "" });
  }

  function guardarRecorrido() {
    if (!recorridoForm?.nombre.trim()) {
      toast.error("Ponele un nombre al recorrido");
      return;
    }
    const km = distanciaTotalKm(rutaWaypoints);
    const min = duracionEstimadaMin(km);
    startTransition(async () => {
      try {
        await crearRecorrido({
          nombre: recorridoForm.nombre,
          puntosRuta: rutaWaypoints,
          distanciaKm: km,
          duracionMin: min,
        });
        toast.success(`Recorrido guardado (~${km} km, ~${min} min)`);
        setRutaWaypoints([]);
        setRecorridoForm(null);
        setModo("ninguno");
        router.refresh();
      } catch {
        toast.error("No se pudo guardar");
      }
    });
  }

  function cancelarModo() {
    setModo("ninguno");
    setRutaWaypoints([]);
  }

  function handleEliminarPunto(id: string) {
    startTransition(async () => {
      try {
        await eliminarPuntoRuta(id);
        toast.success("Punto eliminado");
        router.refresh();
      } catch {
        toast.error("No se pudo eliminar");
      }
    });
  }

  function handleEliminarRecorrido(id: string) {
    startTransition(async () => {
      try {
        await eliminarRecorrido(id);
        toast.success("Recorrido eliminado");
        if (recorridoActivo?.id === id) setRecorridoActivo(null);
        router.refresh();
      } catch {
        toast.error("No se pudo eliminar");
      }
    });
  }

  const puntosRecorridoActivo = (recorridoActivo?.puntosRuta as LatLng[] | undefined) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Mapa</h1>
        <p className="text-sm text-muted-foreground">Barrios, puntos y recorridos</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={modo === "barrio" ? "default" : "outline"}
          className="rounded-full gap-1.5"
          onClick={() => (modo === "barrio" ? cancelarModo() : setModo("barrio"))}
        >
          <MapPin className="size-4" />
          Marcar barrio
        </Button>
        <Button
          size="sm"
          variant={modo === "punto" ? "default" : "outline"}
          className="rounded-full gap-1.5"
          onClick={() => (modo === "punto" ? cancelarModo() : setModo("punto"))}
        >
          <MapPin className="size-4" />
          Marcar punto
        </Button>
        <Button
          size="sm"
          variant={modo === "recorrido" ? "default" : "outline"}
          className="rounded-full gap-1.5"
          onClick={() => (modo === "recorrido" ? cancelarModo() : setModo("recorrido"))}
        >
          <Route className="size-4" />
          Trazar recorrido
        </Button>
        {modo === "recorrido" && rutaWaypoints.length > 0 && (
          <Button size="sm" onClick={terminarRecorrido} className="rounded-full">
            Terminar ({rutaWaypoints.length} puntos)
          </Button>
        )}
        {modo !== "ninguno" && (
          <Button size="sm" variant="ghost" onClick={cancelarModo} className="rounded-full gap-1.5">
            <X className="size-4" />
            Cancelar
          </Button>
        )}
      </div>

      {modo !== "ninguno" && (
        <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3.5 py-2.5 text-sm font-medium text-primary">
          <MapPin className="size-4 shrink-0" />
          {modo === "barrio" && "Tocá el mapa en el lugar del barrio que querés marcar"}
          {modo === "punto" && "Tocá el mapa en el lugar donde querés marcar el punto"}
          {modo === "recorrido" &&
            (rutaWaypoints.length === 0
              ? "Tocá el mapa para empezar a marcar el recorrido"
              : `Seguí tocando el mapa para agregar puntos, o tocá "Terminar" cuando termines`)}
        </div>
      )}

      <div className="h-[50vh] min-h-[320px] w-full overflow-hidden rounded-2xl border">
        <MapContainer
          center={[centro.lat, centro.lng]}
          zoom={13}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ManejadorClicks modo={modo} onClick={handleMapClick} />

          {barrios
            .filter((b) => b.lat != null && b.lng != null)
            .map((b) => (
              <Marker key={b.id} position={[b.lat!, b.lng!]} icon={icono(COLOR_TIPO.BARRIO)}>
                <Popup>{b.nombre}</Popup>
              </Marker>
            ))}

          {puntos.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={icono(COLOR_TIPO[p.tipo])}>
              <Popup>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{p.nombre}</span>
                  <button
                    className="text-xs text-red-600 text-left"
                    onClick={() => handleEliminarPunto(p.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {rutaWaypoints.length > 1 && (
            <Polyline positions={rutaWaypoints.map((p) => [p.lat, p.lng])} color="#2F5FE0" />
          )}
          {rutaWaypoints.map((p, i) => (
            <Marker key={i} position={[p.lat, p.lng]} icon={icono("#2F5FE0")} />
          ))}

          {puntosRecorridoActivo.length > 1 && (
            <Polyline
              positions={puntosRecorridoActivo.map((p) => [p.lat, p.lng])}
              color="#dc2626"
            />
          )}
        </MapContainer>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground px-1">
          Recorridos guardados ({recorridos.length})
        </h2>
        {recorridos.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">Todavía no guardaste recorridos.</p>
        ) : (
          recorridos.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-3.5 shadow-sm"
            >
              <button
                className="min-w-0 text-left"
                onClick={() => setRecorridoActivo(recorridoActivo?.id === r.id ? null : r)}
              >
                <p className="font-medium truncate">{r.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {r.distanciaKm != null ? `${r.distanciaKm} km` : "—"} ·{" "}
                  {r.duracionMin != null ? `~${r.duracionMin} min` : "—"}
                </p>
              </button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-destructive shrink-0"
                onClick={() => handleEliminarRecorrido(r.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!barrioForm} onOpenChange={(v) => !v && setBarrioForm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Qué barrio es este punto?</DialogTitle>
          </DialogHeader>
          <Select
            items={Object.fromEntries(barrios.map((b) => [b.id, b.nombre]))}
            value={barrioForm?.barrioId || undefined}
            onValueChange={(v) => v && setBarrioForm((prev) => (prev ? { ...prev, barrioId: v } : prev))}
          >
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Elegir barrio" />
            </SelectTrigger>
            <SelectContent>
              {barrios.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button className="h-11 w-full" disabled={pending} onClick={guardarBarrio}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!puntoForm} onOpenChange={(v) => !v && setPuntoForm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo punto</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Nombre</Label>
              <Input
                className="h-11"
                value={puntoForm?.nombre ?? ""}
                onChange={(e) =>
                  setPuntoForm((prev) => (prev ? { ...prev, nombre: e.target.value } : prev))
                }
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Tipo</Label>
              <Select
                items={{ ORIGEN: "Origen", DESTINO: "Destino", OTRO: "Otro" }}
                value={puntoForm?.tipo ?? "OTRO"}
                onValueChange={(v) =>
                  v && setPuntoForm((prev) => (prev ? { ...prev, tipo: v as "ORIGEN" | "DESTINO" | "OTRO" } : prev))
                }
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORIGEN">Origen</SelectItem>
                  <SelectItem value="DESTINO">Destino</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button className="h-11 w-full" disabled={pending} onClick={guardarPunto}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!recorridoForm} onOpenChange={(v) => !v && setRecorridoForm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Guardar recorrido</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label>Nombre</Label>
            <Input
              className="h-11"
              value={recorridoForm?.nombre ?? ""}
              onChange={(e) => setRecorridoForm({ nombre: e.target.value })}
              autoFocus
            />
          </div>
          {rutaWaypoints.length > 1 && (
            <p className="text-sm text-muted-foreground">
              ~{distanciaTotalKm(rutaWaypoints)} km · ~{duracionEstimadaMin(distanciaTotalKm(rutaWaypoints))} min
            </p>
          )}
          <DialogFooter>
            <Button className="h-11 w-full" disabled={pending} onClick={guardarRecorrido}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

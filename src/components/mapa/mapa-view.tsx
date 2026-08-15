"use client";

import "leaflet/dist/leaflet.css";
import { useState, useEffect, useTransition } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MapPin, Route, Trash2, X, Plus, ArrowUp, ArrowDown, Pencil, Eye, EyeOff, Copy as CopyIcon, ChevronDown, ChevronUp } from "lucide-react";
import {
  crearPuntoRuta,
  eliminarPuntoRuta,
  crearRecorrido,
  actualizarRecorrido,
  eliminarRecorrido,
  actualizarUbicacionBarrio,
  eliminarUbicacionBarrio,
} from "@/lib/actions/mapa";
import { distanciaKm, duracionEstimadaMin, rutaCallejera, type LatLng } from "@/lib/geo";
import { BackButton } from "@/components/back-button";
import { sumarMinutos } from "@/lib/hora";
import { toast } from "sonner";

type Barrio = { id: string; nombre: string; lat: number | null; lng: number | null; color: string | null };
type PuntoRuta = {
  id: string;
  nombre: string;
  tipo: "ORIGEN" | "DESTINO" | "OTRO";
  lat: number;
  lng: number;
  barrio: { nombre: string } | null;
};
type Parada = {
  tipo: "salida" | "barrio" | "punto";
  lat: number;
  lng: number;
  nombre: string;
  horario: string;
  barrioId?: string;
};
type Turno = "MANANA" | "TARDE";
type Recorrido = {
  id: string;
  nombre: string;
  puntosRuta: unknown;
  duracionMin: number | null;
  distanciaKm: number | null;
  turno: Turno | null;
};

const TURNO_LABEL: Record<Turno, string> = {
  MANANA: "Viajes Mañana",
  TARDE: "Viajes Tarde",
};

const COLOR_DEFECTO = "#2F5FE0";
const COLOR_SALIDA = "#16a34a";
const COLOR_PUNTO = "#6b7280";

function icono(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

type Modo = "ninguno" | "barrio" | "punto";

function ManejadorClicks({ modo, onClick }: { modo: Modo; onClick: (p: LatLng) => void }) {
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

  const barriosConUbicacion = barrios.filter((b) => b.lat != null && b.lng != null);
  const puntosOrigen = puntos.filter((p) => p.tipo === "ORIGEN");

  const [recorridoId, setRecorridoId] = useState<string | null>(null);
  const [nombreRecorrido, setNombreRecorrido] = useState("");
  const [turnoRecorrido, setTurnoRecorrido] = useState<Turno | "">("");
  const [salidaId, setSalidaId] = useState("");
  const [salidaHorario, setSalidaHorario] = useState("");
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [recorridoActivo, setRecorridoActivo] = useState<Recorrido | null>(null);
  const [lineaCallejera, setLineaCallejera] = useState<LatLng[] | null>(null);
  const [mostrarCreador, setMostrarCreador] = useState(false);

  const barrioConUbicacionDefault = barrios.find((b) => b.lat != null && b.lng != null);
  const centro: LatLng = barrioConUbicacionDefault
    ? { lat: barrioConUbicacionDefault.lat!, lng: barrioConUbicacionDefault.lng! }
    : puntos[0]
      ? { lat: puntos[0].lat, lng: puntos[0].lng }
      : { lat: -27.45, lng: -58.98 };

  function handleMapClick(p: LatLng) {
    if (modo === "barrio") setBarrioForm({ pos: p, barrioId: "" });
    else if (modo === "punto") setPuntoForm({ pos: p, nombre: "", tipo: "ORIGEN" });
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

  function cancelarModo() {
    setModo("ninguno");
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

  function handleEliminarUbicacionBarrio(id: string) {
    startTransition(async () => {
      try {
        await eliminarUbicacionBarrio(id);
        toast.success("Ubicación del barrio quitada del mapa");
        router.refresh();
      } catch {
        toast.error("No se pudo quitar");
      }
    });
  }

  // --- Constructor de recorridos ---

  function nuevaRuta() {
    setRecorridoId(null);
    setNombreRecorrido("");
    setTurnoRecorrido("");
    setSalidaId("");
    setSalidaHorario("");
    setParadas([]);
    setRecorridoActivo(null);
  }

  function elegirSalida(puntoId: string) {
    setSalidaId(puntoId);
  }

  function agregarParadaBarrio(barrioId: string) {
    const b = barrios.find((x) => x.id === barrioId);
    if (!b || b.lat == null || b.lng == null) return;

    const anterior: LatLng | null =
      paradas.length > 0
        ? paradas[paradas.length - 1]
        : salidaId
          ? (() => {
              const s = puntosOrigen.find((p) => p.id === salidaId);
              return s ? { lat: s.lat, lng: s.lng } : null;
            })()
          : null;
    const horaAnterior = paradas.length > 0 ? paradas[paradas.length - 1].horario : salidaHorario;

    let horarioSugerido = "";
    if (anterior && horaAnterior) {
      const km = distanciaKm(anterior, { lat: b.lat, lng: b.lng });
      horarioSugerido = sumarMinutos(horaAnterior, duracionEstimadaMin(km));
    }

    setParadas((prev) => [
      ...prev,
      {
        tipo: "barrio",
        lat: b.lat!,
        lng: b.lng!,
        nombre: b.nombre,
        horario: horarioSugerido,
        barrioId: b.id,
      },
    ]);
  }

  function quitarParada(i: number) {
    setParadas((prev) => prev.filter((_, idx) => idx !== i));
  }

  function moverParada(i: number, dir: -1 | 1) {
    setParadas((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function actualizarHorarioParada(i: number, horario: string) {
    setParadas((prev) => prev.map((p, idx) => (idx === i ? { ...p, horario } : p)));
  }

  function cargarRecorridoParaEditar(r: Recorrido) {
    const stops = (r.puntosRuta as Parada[] | null) ?? [];
    const [salida, ...resto] = stops;
    setRecorridoId(r.id);
    setNombreRecorrido(r.nombre);
    setTurnoRecorrido(r.turno ?? "");
    setMostrarCreador(true);
    if (salida) {
      const puntoCoincidente = puntosOrigen.find(
        (p) => Math.abs(p.lat - salida.lat) < 1e-6 && Math.abs(p.lng - salida.lng) < 1e-6
      );
      setSalidaId(puntoCoincidente?.id ?? "");
      setSalidaHorario(salida.horario ?? "");
    } else {
      setSalidaId("");
      setSalidaHorario("");
    }
    setParadas(resto);
    setRecorridoActivo(r);
  }

  function guardarRecorrido() {
    if (!nombreRecorrido.trim()) {
      toast.error("Ponele un nombre al recorrido");
      return;
    }
    const salida = puntosOrigen.find((p) => p.id === salidaId);
    if (!salida) {
      toast.error("Elegí un punto de salida");
      return;
    }
    if (paradas.length === 0) {
      toast.error("Agregá al menos una parada");
      return;
    }

    const todasLasParadas: Parada[] = [
      { tipo: "salida", lat: salida.lat, lng: salida.lng, nombre: salida.nombre, horario: salidaHorario },
      ...paradas,
    ];

    startTransition(async () => {
      try {
        const ruta = await rutaCallejera(todasLasParadas.map((p) => ({ lat: p.lat, lng: p.lng })));
        let km: number;
        let duracionMin: number;
        if (ruta) {
          km = ruta.distanciaKm;
          duracionMin = ruta.duracionMin;
        } else {
          km = 0;
          for (let i = 0; i < todasLasParadas.length - 1; i++) {
            km += distanciaKm(todasLasParadas[i], todasLasParadas[i + 1]);
          }
          km = Math.round(km * 100) / 100;
          duracionMin = duracionEstimadaMin(km);
        }
        const payload = {
          nombre: nombreRecorrido,
          turno: turnoRecorrido || undefined,
          paradas: todasLasParadas,
          distanciaKm: km,
          duracionMin,
        };
        if (recorridoId) {
          await actualizarRecorrido(recorridoId, payload);
          toast.success("Recorrido actualizado");
        } else {
          await crearRecorrido(payload);
          toast.success("Recorrido guardado");
        }
        nuevaRuta();
        router.refresh();
      } catch {
        toast.error("No se pudo guardar");
      }
    });
  }

  async function copiarRecorrido(r: Recorrido) {
    const stops = (r.puntosRuta as Parada[] | null) ?? [];
    const duracionYDistancia = [
      r.distanciaKm != null ? `${r.distanciaKm} km` : null,
      r.duracionMin != null ? `~${r.duracionMin} min` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const texto = [
      `🚌 *${r.nombre}*`,
      duracionYDistancia || null,
      "",
      "*Horarios:*",
      ...stops.map((s, i) => {
        const hora = s.horario ? `${s.horario} hs` : "—";
        const parada = i === 0 ? `Salida — ${s.nombre}` : `${i}. ${s.nombre}`;
        return `${hora}  ${parada}`;
      }),
    ]
      .filter((l) => l !== null)
      .join("\n");

    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Recorrido copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  function toggleVerEnMapa(r: Recorrido) {
    const activar = recorridoActivo?.id !== r.id;
    setRecorridoActivo(activar ? r : null);
    if (activar) setMostrarCreador(true);
  }

  function handleEliminarRecorrido(id: string) {
    startTransition(async () => {
      try {
        await eliminarRecorrido(id);
        toast.success("Recorrido eliminado");
        if (recorridoId === id) nuevaRuta();
        router.refresh();
      } catch {
        toast.error("No se pudo eliminar");
      }
    });
  }

  const puntosRecorridoActivo = (recorridoActivo?.puntosRuta as Parada[] | undefined) ?? [];
  const barriosDisponiblesParaAgregar = barriosConUbicacion.filter(
    (b) => !paradas.some((p) => p.barrioId === b.id)
  );

  useEffect(() => {
    if (puntosRecorridoActivo.length < 2) {
      setLineaCallejera(null);
      return;
    }
    let cancelado = false;
    rutaCallejera(puntosRecorridoActivo.map((p) => ({ lat: p.lat, lng: p.lng }))).then((ruta) => {
      if (!cancelado) setLineaCallejera(ruta?.coords ?? null);
    });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorridoActivo?.id]);

  const lineaRecorrido: LatLng[] = lineaCallejera ?? puntosRecorridoActivo.map((p) => ({ lat: p.lat, lng: p.lng }));

  function renderRecorridoCard(r: Recorrido) {
    const stops = (r.puntosRuta as Parada[] | null) ?? [];
    return (
      <div
        key={r.id}
        className={`rounded-2xl border bg-card p-3.5 shadow-sm ${recorridoActivo?.id === r.id ? "ring-2 ring-primary" : ""}`}
      >
        <div className="flex items-center justify-between gap-2">
          <button className="min-w-0 text-left" onClick={() => toggleVerEnMapa(r)}>
            <p className="font-medium truncate">{r.nombre}</p>
            <p className="text-xs text-muted-foreground">
              {r.distanciaKm != null ? `${r.distanciaKm} km` : "—"} ·{" "}
              {r.duracionMin != null ? `~${r.duracionMin} min` : "—"}
            </p>
          </button>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className={recorridoActivo?.id === r.id ? "size-8 text-primary" : "size-8"}
              onClick={() => toggleVerEnMapa(r)}
              aria-label={recorridoActivo?.id === r.id ? "Quitar del mapa" : "Ver en el mapa"}
              title={recorridoActivo?.id === r.id ? "Quitar del mapa" : "Ver en el mapa"}
            >
              {recorridoActivo?.id === r.id ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={() => copiarRecorrido(r)}
              aria-label="Copiar como texto"
              title="Copiar como texto"
            >
              <CopyIcon className="size-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="size-8" onClick={() => cargarRecorridoParaEditar(r)}>
              <Pencil className="size-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger render={<Button size="icon" variant="ghost" className="size-8 text-destructive" />}>
                <Trash2 className="size-3.5" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar "{r.nombre}"?</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleEliminarRecorrido(r.id)} className="bg-destructive text-white">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {stops.length > 0 && (
          <ul className="mt-2 flex flex-col gap-0.5 border-t pt-2 text-xs text-muted-foreground">
            {stops.map((s, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span className="truncate">
                  {i === 0 ? "🚏 " : `${i}. `}
                  {s.nombre}
                </span>
                <span className="tabular-nums shrink-0">{s.horario || "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <BackButton />
        <div>
          <h1 className="text-xl font-bold">Mapa</h1>
          <p className="text-sm text-muted-foreground">Barrios, rutas y horarios</p>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full justify-between rounded-full"
        onClick={() => setMostrarCreador((v) => !v)}
      >
        <span className="flex items-center gap-1.5">
          <Route className="size-4" />
          {recorridoId ? "Editar recorrido" : "Nuevo recorrido / marcar en el mapa"}
        </span>
        {mostrarCreador ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </Button>

      {mostrarCreador && (
      <>
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
          Marcar punto de salida
        </Button>
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
          {modo === "barrio"
            ? "Tocá el mapa en el lugar del barrio que querés marcar"
            : "Tocá el mapa en el punto de salida (tu base)"}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="isolate h-[45vh] min-h-[280px] w-full overflow-hidden rounded-2xl border">
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

              {barriosConUbicacion.map((b) => (
                <Marker key={b.id} position={[b.lat!, b.lng!]} icon={icono(b.color ?? COLOR_DEFECTO)}>
                  <Popup>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{b.nombre}</span>
                      <button
                        className="text-xs text-red-600 text-left"
                        onClick={() => handleEliminarUbicacionBarrio(b.id)}
                      >
                        Quitar ubicación
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {puntos.map((p) => (
                <Marker
                  key={p.id}
                  position={[p.lat, p.lng]}
                  icon={icono(p.tipo === "ORIGEN" ? COLOR_SALIDA : COLOR_PUNTO)}
                >
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

              {lineaRecorrido.length > 1 && (
                <Polyline
                  positions={lineaRecorrido.map((p) => [p.lat, p.lng])}
                  color="#dc2626"
                />
              )}
            </MapContainer>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                {recorridoId ? "Editar recorrido" : "Nuevo recorrido"}
              </h2>
              {recorridoId && (
                <Button size="sm" variant="ghost" onClick={nuevaRuta}>
                  Cancelar edición
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Nombre del recorrido</Label>
              <Input
                className="h-11"
                value={nombreRecorrido}
                onChange={(e) => setNombreRecorrido(e.target.value)}
                placeholder="Ej: Recorrido mañana"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Turno</Label>
              <Select
                items={{ MANANA: "Viajes Mañana", TARDE: "Viajes Tarde" }}
                value={turnoRecorrido || undefined}
                onValueChange={(v) => v && setTurnoRecorrido(v as Turno)}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Elegir turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANANA">Viajes Mañana</SelectItem>
                  <SelectItem value="TARDE">Viajes Tarde</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Salida</Label>
                <Select
                  items={Object.fromEntries(puntosOrigen.map((p) => [p.id, p.nombre]))}
                  value={salidaId || undefined}
                  onValueChange={(v) => v && elegirSalida(v)}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Elegir punto de salida" />
                  </SelectTrigger>
                  <SelectContent>
                    {puntosOrigen.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {puntosOrigen.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Marcá un punto de salida en el mapa primero.
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Horario de salida</Label>
                <Input
                  type="time"
                  className="h-11"
                  value={salidaHorario}
                  onChange={(e) => setSalidaHorario(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Paradas (barrios)</Label>
                <Select
                  items={Object.fromEntries(barriosDisponiblesParaAgregar.map((b) => [b.id, b.nombre]))}
                  value=""
                  onValueChange={(v) => v && agregarParadaBarrio(v)}
                >
                  <SelectTrigger className="h-9 w-[160px]">
                    <span className="flex items-center gap-1 text-xs">
                      <Plus className="size-3.5" />
                      Agregar barrio
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {barriosDisponiblesParaAgregar.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {barriosConUbicacion.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Ningún barrio tiene ubicación marcada todavía. Usá "Marcar barrio" arriba.
                </p>
              )}

              {paradas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no agregaste paradas.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {paradas.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl border p-2.5">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-sm font-medium">{p.nombre}</span>
                      <Input
                        type="time"
                        className="h-9 w-[110px]"
                        value={p.horario}
                        onChange={(e) => actualizarHorarioParada(i, e.target.value)}
                      />
                      <div className="flex shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          disabled={i === 0}
                          onClick={() => moverParada(i, -1)}
                        >
                          <ArrowUp className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          disabled={i === paradas.length - 1}
                          onClick={() => moverParada(i, 1)}
                        >
                          <ArrowDown className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive"
                          onClick={() => quitarParada(i)}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button className="h-11 gap-2" disabled={pending} onClick={guardarRecorrido}>
              <Route className="size-4" />
              {recorridoId ? "Guardar cambios" : "Guardar recorrido"}
            </Button>
          </div>
        </div>
      </>
      )}

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground px-1">
            Recorridos guardados ({recorridos.length})
          </h2>
          {recorridos.length === 0 ? (
            <p className="px-1 text-sm text-muted-foreground">Todavía no guardaste recorridos.</p>
          ) : (
            <>
              {(["MANANA", "TARDE"] as const).map((turno) => {
                const grupo = recorridos.filter((r) => r.turno === turno);
                if (grupo.length === 0) return null;
                return (
                  <div key={turno} className="flex flex-col gap-2">
                    <h3 className="px-1 text-xs font-semibold text-muted-foreground">
                      {TURNO_LABEL[turno]} ({grupo.length})
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {grupo.map((r) => renderRecorridoCard(r))}
                    </div>
                  </div>
                );
              })}
              {(() => {
                const sinTurno = recorridos.filter((r) => !r.turno);
                if (sinTurno.length === 0) return null;
                return (
                  <div className="flex flex-col gap-2">
                    <h3 className="px-1 text-xs font-semibold text-muted-foreground">
                      Sin turno ({sinTurno.length})
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {sinTurno.map((r) => renderRecorridoCard(r))}
                    </div>
                  </div>
                );
              })()}
            </>
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
                placeholder="Ej: Base / Oficina"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Tipo</Label>
              <Select
                items={{ ORIGEN: "Salida", DESTINO: "Destino", OTRO: "Otro" }}
                value={puntoForm?.tipo ?? "OTRO"}
                onValueChange={(v) =>
                  v && setPuntoForm((prev) => (prev ? { ...prev, tipo: v as "ORIGEN" | "DESTINO" | "OTRO" } : prev))
                }
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORIGEN">Salida</SelectItem>
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
    </div>
  );
}

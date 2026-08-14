import { DIA_LABEL, DIAS_SEMANA, DiaSemana } from "@/lib/constants";

export type FilaImportada = {
  linea: number;
  nombrePasajero: string;
  diaSemana: DiaSemana | null;
  barrioNombre: string;
  tipoViaje: "IDA" | "VUELTA" | "IDA_VUELTA";
  horaIda: string;
  horaVuelta: string;
  cantidadTramos: number;
  pasajeroId: string | null;
  barrioId: string | null;
  errores: string[];
};

const DIA_ALIASES: Record<string, DiaSemana> = {
  lunes: "LUNES",
  lun: "LUNES",
  martes: "MARTES",
  mar: "MARTES",
  miercoles: "MIERCOLES",
  "miércoles": "MIERCOLES",
  mie: "MIERCOLES",
  "mié": "MIERCOLES",
  jueves: "JUEVES",
  jue: "JUEVES",
  viernes: "VIERNES",
  vie: "VIERNES",
  sabado: "SABADO",
  "sábado": "SABADO",
  sab: "SABADO",
  "sáb": "SABADO",
  domingo: "DOMINGO",
  dom: "DOMINGO",
};

const TIPO_ALIASES: Record<string, "IDA" | "VUELTA" | "IDA_VUELTA"> = {
  ida: "IDA",
  vuelta: "VUELTA",
  "ida y vuelta": "IDA_VUELTA",
  "ida_vuelta": "IDA_VUELTA",
  idayvuelta: "IDA_VUELTA",
  ambos: "IDA_VUELTA",
};

function normalizar(s: string) {
  return s.trim().toLowerCase();
}

function parseDia(v: string): DiaSemana | null {
  const n = normalizar(v);
  if (DIA_ALIASES[n]) return DIA_ALIASES[n];
  const directo = DIAS_SEMANA.find((d) => d === v.trim().toUpperCase());
  return directo ?? null;
}

function parseTipo(v: string): "IDA" | "VUELTA" | "IDA_VUELTA" {
  const n = normalizar(v);
  return TIPO_ALIASES[n] ?? "IDA_VUELTA";
}

function parseHora(v: string): string {
  const t = v.trim();
  if (/^([01]?\d|2[0-3]):[0-5]\d$/.test(t)) {
    const [h, m] = t.split(":");
    return `${h.padStart(2, "0")}:${m}`;
  }
  return "";
}

/**
 * Parsea texto pegado (tab o coma separado) con formato:
 * Pasajero, Día, Barrio, Tipo, Hora ida, Hora vuelta, Tramos
 */
export function parsearTextoTramos(texto: string): FilaImportada[] {
  const lineas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return lineas.map((linea, i) => {
    const partes = linea.includes("\t") ? linea.split("\t") : linea.split(",");
    const [
      nombrePasajero = "",
      dia = "",
      barrio = "",
      tipo = "",
      horaIda = "",
      horaVuelta = "",
      tramos = "",
    ] = partes.map((p) => p.trim());

    const errores: string[] = [];
    const diaSemana = parseDia(dia);
    if (!nombrePasajero) errores.push("Falta el nombre del pasajero");
    if (!diaSemana) errores.push(`Día inválido: "${dia}"`);

    const tipoViaje = parseTipo(tipo);
    const horaIdaP = parseHora(horaIda);
    const horaVueltaP = parseHora(horaVuelta);
    if (tipoViaje !== "VUELTA" && !horaIdaP && horaIda) errores.push(`Hora de ida inválida: "${horaIda}"`);
    if (tipoViaje !== "IDA" && !horaVueltaP && horaVuelta) errores.push(`Hora de vuelta inválida: "${horaVuelta}"`);
    if (!horaIdaP && !horaVueltaP) errores.push("Falta al menos un horario");

    const cantidadTramos = tramos ? parseInt(tramos, 10) : 1;

    return {
      linea: i + 1,
      nombrePasajero,
      diaSemana,
      barrioNombre: barrio,
      tipoViaje,
      horaIda: horaIdaP,
      horaVuelta: horaVueltaP,
      cantidadTramos: Number.isFinite(cantidadTramos) ? cantidadTramos : 1,
      pasajeroId: null,
      barrioId: null,
      errores,
    };
  });
}

export function emparejarConDatos(
  filas: FilaImportada[],
  pasajeros: { id: string; nombre: string }[],
  barrios: { id: string; nombre: string }[]
): FilaImportada[] {
  return filas.map((f) => {
    const errores = [...f.errores];
    const pasajero = pasajeros.find(
      (p) => normalizar(p.nombre) === normalizar(f.nombrePasajero)
    );
    if (!pasajero && f.nombrePasajero) {
      errores.push(`Pasajero "${f.nombrePasajero}" no encontrado`);
    }

    const barrio = f.barrioNombre
      ? barrios.find((b) => normalizar(b.nombre) === normalizar(f.barrioNombre))
      : undefined;
    if (f.barrioNombre && !barrio) {
      errores.push(`Barrio "${f.barrioNombre}" no encontrado (se importa sin barrio)`);
    }

    return {
      ...f,
      pasajeroId: pasajero?.id ?? null,
      barrioId: barrio?.id ?? null,
      errores,
    };
  });
}

export function filaEsValida(f: FilaImportada): boolean {
  return !!f.pasajeroId && !!f.diaSemana && (!!f.horaIda || !!f.horaVuelta);
}

export const DIAS_SEMANA = [
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
  "SABADO",
  "DOMINGO",
] as const;

export type DiaSemana = (typeof DIAS_SEMANA)[number];

export const DIA_LABEL: Record<DiaSemana, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

export const DIA_LABEL_CORTO: Record<DiaSemana, string> = {
  LUNES: "Lun",
  MARTES: "Mar",
  MIERCOLES: "Mié",
  JUEVES: "Jue",
  VIERNES: "Vie",
  SABADO: "Sáb",
  DOMINGO: "Dom",
};

export function diaDeHoy(): DiaSemana {
  const jsDay = new Date().getDay();
  const map: DiaSemana[] = [
    "DOMINGO",
    "LUNES",
    "MARTES",
    "MIERCOLES",
    "JUEVES",
    "VIERNES",
    "SABADO",
  ];
  return map[jsDay];
}

export const TIPO_VIAJE_LABEL: Record<string, string> = {
  IDA: "Solo ida",
  VUELTA: "Solo vuelta",
  IDA_VUELTA: "Ida y vuelta",
};

export const ESTADO_SERVICIO_LABEL: Record<string, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  CONFIRMADO: "Confirmado",
  PENDIENTE: "Pendiente",
  CANCELADO: "Cancelado",
  REALIZADO: "Realizado",
};

export const ESTADO_PAGO_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
  PAGADO: "Pagado",
};

export const ESTADO_PASAJERO_LABEL: Record<string, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
};

export const METODO_PAGO_OPTIONS = [
  "Efectivo",
  "Transferencia",
  "Mercado Pago",
  "Débito automático",
  "Otro",
] as const;

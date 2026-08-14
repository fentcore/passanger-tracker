import { DiaSemana } from "@/lib/constants";

export type ServicioDraft = {
  diaSemana: DiaSemana;
  tipoViaje: "IDA" | "VUELTA" | "IDA_VUELTA";
  horaIda: string;
  horaVuelta: string;
  barrioId: string;
  direccion: string;
  destino: string;
  cantidadTramos: number;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  montoAbonado: string;
  estadoPago: string;
  metodoPago: string;
  montoPendiente: string;
  notasPago: string;
  notas: string;
};

export function servicioDraftVacio(dia: DiaSemana): ServicioDraft {
  return {
    diaSemana: dia,
    tipoViaje: "IDA_VUELTA",
    horaIda: "",
    horaVuelta: "",
    barrioId: "",
    direccion: "",
    destino: "",
    cantidadTramos: 1,
    estado: "ACTIVO",
    fechaInicio: "",
    fechaFin: "",
    montoAbonado: "",
    estadoPago: "PENDIENTE",
    metodoPago: "",
    montoPendiente: "",
    notasPago: "",
    notas: "",
  };
}

export type PasajeroDraft = {
  nombre: string;
  telefono: string;
  whatsapp: string;
  email: string;
  contactoExtra: string;
  notasGenerales: string;
  estado: "ACTIVO" | "INACTIVO";
};

export function pasajeroDraftVacio(): PasajeroDraft {
  return {
    nombre: "",
    telefono: "",
    whatsapp: "",
    email: "",
    contactoExtra: "",
    notasGenerales: "",
    estado: "ACTIVO",
  };
}

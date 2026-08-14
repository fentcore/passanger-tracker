export type NivelAlerta = "normal" | "advertencia" | "alerta" | "critica";

export type ConfigAlertas = { advertencia: number; alerta: number; critica: number };

export function nivelAlertaTramos(tramos: number, config: ConfigAlertas): NivelAlerta {
  if (tramos <= config.critica) return "critica";
  if (tramos <= config.alerta) return "alerta";
  if (tramos <= config.advertencia) return "advertencia";
  return "normal";
}

export const NIVEL_ALERTA_COLOR: Record<NivelAlerta, string> = {
  normal: "",
  advertencia: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  alerta: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  critica: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export const NIVEL_ALERTA_LABEL: Record<NivelAlerta, string> = {
  normal: "",
  advertencia: "Tramos bajos",
  alerta: "Pocos tramos",
  critica: "¡Últimos tramos!",
};

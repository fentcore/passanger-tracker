export type TipoViaje = "IDA" | "VUELTA" | "IDA_VUELTA";

export function horaDeOrden(
  horaIda: string | null,
  horaVuelta: string | null,
  orden: "ida" | "vuelta"
): string {
  const preferida = orden === "ida" ? horaIda : horaVuelta;
  const alterna = orden === "ida" ? horaVuelta : horaIda;
  return preferida ?? alterna ?? "99:99";
}

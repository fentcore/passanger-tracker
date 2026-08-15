export function sumarMinutos(horaHHMM: string, minutos: number): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(horaHHMM.trim());
  if (!match) return "";
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const total = (h * 60 + m + Math.round(minutos) + 24 * 60) % (24 * 60);
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

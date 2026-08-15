// Búsqueda por palabras clave: sin tildes, sin importar el orden, con
// tolerancia a errores de tipeo cortos. No requiere coincidencia exacta.

// Rango Unicode de marcas diacríticas combinantes (U+0300–U+036F), construido
// por código numérico para no depender de caracteres combinantes literales
// en el archivo fuente (frágiles ante la codificación del editor/git).
const MARCAS_DIACRITICAS = new RegExp(
  `[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`,
  "g"
);

function normalizar(s: string): string {
  return s.normalize("NFD").replace(MARCAS_DIACRITICAS, "").toLowerCase();
}

function distanciaLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function coincideToken(token: string, palabras: string[]): boolean {
  if (palabras.some((p) => p.includes(token))) return true;
  // Tolerancia a typos: solo para palabras con largo suficiente, si no
  // cualquier token corto matchearía casi cualquier cosa.
  if (token.length >= 4) {
    return palabras.some((p) => distanciaLevenshtein(token, p) <= 1);
  }
  return false;
}

export function coincideBusqueda(texto: string, query: string): boolean {
  const tokens = normalizar(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const palabras = normalizar(texto).split(/\s+/).filter(Boolean);
  return tokens.every((t) => coincideToken(t, palabras));
}

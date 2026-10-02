export const COLORES = {
  nacimientos: "#0F766E",
  defunciones: "#9F1239",
  hombres: "#1D4ED8",
  mujeres: "#BE185D",
  suave: "#FECACA",
  gris: "#64748B",
  tinta: "#0F172A",
  linea: "#E2E8F0",
};

export const ORDEN_EDAD = [
  "Menor 1 año",
  "De 1-4 años",
  "De 5-14 años",
  "De 15-44 años",
  "De 45-64 años",
  "De 65-84 años",
  "De 85-99 años",
  "De 100 y más",
  "Edad desconocida",
];

export const ORDEN_SEXO = ["Hombres", "Mujeres", "Indeterminado"];

const enteros = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const decimales = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function entero(valor) {
  return enteros.format(Number(valor) || 0);
}

export function decimal(valor) {
  return decimales.format(Number(valor) || 0);
}

export function corto(texto, limite = 48) {
  const valor = String(texto ?? "");
  return valor.length <= limite ? valor : `${valor.slice(0, limite - 1)}…`;
}

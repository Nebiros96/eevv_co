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

export const ORDEN_EDAD_SIMPLE = [
  "Menor 1 año",
  "De 1-4 años",
  "De 5-9 años",
  "De 10-14 años",
  "De 15-19 años",
  "De 20-24 años",
  "De 25-29 años",
  "De 30-34 años",
  "De 35-39 años",
  "De 40-44 años",
  "De 45-49 años",
  "De 50-54 años",
  "De 55-59 años",
  "De 60-64 años",
  "De 65-69 años",
  "De 70-74 años",
  "De 75-79 años",
  "De 80-84 años",
  "De 85-89 años",
  "De 90-94 años",
  "De 95-99 años",
  "De 100 y más",
];

export const ORDEN_MADRE = ["10-14", "15-19", "20-24", "25-29", "30-34", "35-39", "40-44", "45-49", "50-54"];
export const PUNTO_MEDIO_MADRE = {
  "10-14": 12.5,
  "15-19": 17.5,
  "20-24": 22.5,
  "25-29": 27.5,
  "30-34": 32.5,
  "35-39": 37.5,
  "40-44": 42.5,
  "45-49": 47.5,
  "50-54": 52.5,
};

const enteros = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const decimales = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const decimales2 = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function entero(valor) {
  return enteros.format(Number(valor) || 0);
}

export function decimal(valor) {
  return decimales.format(Number(valor) || 0);
}

export function decimal2(valor) {
  return decimales2.format(Number(valor) || 0);
}

export function marca(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "";
  return Math.abs(numero - Math.round(numero)) < 1e-6 ? entero(numero) : decimal(numero);
}

function cerrar(valor) {
  return Number(valor.toPrecision(12));
}

export function ejeCerrado(maximo, holgura = 1.12) {
  const objetivo = Math.max(Number(maximo) || 0, 0) * holgura;
  if (objetivo <= 0) return { domain: [0, 1], ticks: [0, 1] };
  const magnitud = 10 ** Math.floor(Math.log10(objetivo));
  const candidatos = [1, 2, 5, 10, 20, 50].map((factor) => (factor * magnitud) / 10);
  let elegido = null;
  for (const paso of candidatos) {
    const tope = Math.ceil((objetivo - paso * 1e-10) / paso) * paso;
    const intervalos = Math.round(tope / paso);
    if (intervalos >= 4 && intervalos <= 6) elegido = { paso, tope };
  }
  if (!elegido) {
    const paso = pasoMinimo(objetivo);
    elegido = { paso, tope: Math.ceil((objetivo - paso * 1e-10) / paso) * paso };
  }
  const cantidad = Math.round(elegido.tope / elegido.paso);
  const ticks = Array.from({ length: cantidad + 1 }, (_, indice) => cerrar(indice * elegido.paso));
  return { domain: [0, ticks[cantidad]], ticks };
}

function pasoMinimo(objetivo) {
  const magnitud = 10 ** Math.floor(Math.log10(objetivo));
  return magnitud / 2 || 1;
}

export function ejeSimetrico(maximo, holgura = 1.12) {
  const { ticks } = ejeCerrado(maximo, holgura);
  const tope = ticks[ticks.length - 1];
  const marcas = ticks.slice(1).reverse().map((valor) => -valor).concat(ticks);
  return { domain: [-tope, tope], ticks: marcas };
}

export function corto(texto, limite = 48) {
  const valor = String(texto ?? "");
  return valor.length <= limite ? valor : `${valor.slice(0, limite - 1)}…`;
}

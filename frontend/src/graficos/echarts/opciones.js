import { ejeCerrado, ejeSimetrico, entero, marca } from "@/estilos/tema";
import { COLORES_TEMA } from "@/graficos/echarts/motor";

export const FUENTE = '"IBM Plex Sans Variable", system-ui, sans-serif';

export const TEXTO = { fontFamily: FUENTE, color: COLORES_TEMA.texto };

export function tooltip(formato = entero, extra = {}) {
  return {
    trigger: "axis",
    axisPointer: { type: "line", lineStyle: { color: COLORES_TEMA.tinta } },
    borderWidth: 0,
    backgroundColor: "rgba(50, 50, 50, 0.55)",
    textStyle: { fontFamily: FUENTE, color: "#fff", fontSize: 12 },
    valueFormatter: (valor) => (valor == null || !Number.isFinite(Number(valor)) ? "—" : formato(valor)),
    ...extra,
  };
}

export function leyenda(extra = {}) {
  return {
    top: 0,
    icon: "roundRect",
    itemWidth: 14,
    itemHeight: 8,
    textStyle: { ...TEXTO, fontSize: 12 },
    ...extra,
  };
}

export function ejeValor(maximo, extra = {}) {
  const { domain, ticks } = ejeCerrado(maximo);
  return {
    type: "value",
    min: domain[0],
    max: domain[1],
    interval: ticks[1] - ticks[0],
    axisLabel: { ...TEXTO, fontSize: 11, formatter: marca },
    splitLine: { lineStyle: { color: COLORES_TEMA.linea } },
    ...extra,
  };
}

export function ejeValorSimetrico(maximo, extra = {}) {
  const { domain, ticks } = ejeSimetrico(maximo);
  return {
    type: "value",
    min: domain[0],
    max: domain[1],
    interval: ticks[1] - ticks[0],
    axisLabel: { ...TEXTO, fontSize: 11, formatter: (valor) => marca(Math.abs(valor)) },
    splitLine: { lineStyle: { color: COLORES_TEMA.linea } },
    ...extra,
  };
}

export function ejeCategoria(datos, { axisLabel, ...extra } = {}) {
  return {
    type: "category",
    data: datos,
    axisTick: { show: false },
    axisLine: { lineStyle: { color: COLORES_TEMA.linea } },
    axisLabel: { ...TEXTO, fontSize: 11, ...axisLabel },
    ...extra,
  };
}

export function etiqueta(formato = entero, extra = {}) {
  return {
    show: true,
    fontFamily: FUENTE,
    fontSize: 11,
    fontWeight: 600,
    color: COLORES_TEMA.texto,
    textBorderColor: "#ffffff",
    textBorderWidth: 3,
    formatter: ({ value }) => {
      const numero = Array.isArray(value) ? value[value.length - 1] : value;
      return numero == null || !Number.isFinite(Number(numero)) ? "" : formato(numero);
    },
    ...extra,
  };
}

export function serieLinea(id, nombre, color, datos, { formato = entero, area = false, ...extra } = {}) {
  return {
    id,
    name: nombre,
    type: "line",
    data: datos,
    symbol: "circle",
    symbolSize: 7,
    lineStyle: { width: 2.5, color },
    itemStyle: { color, borderColor: "#fff", borderWidth: 1.5 },
    areaStyle: area ? { color, opacity: 0.08 } : undefined,
    label: etiqueta(formato, { position: "top" }),
    labelLayout: { hideOverlap: true },
    emphasis: { focus: "series" },
    ...extra,
  };
}

export function lineaAnio(anio) {
  if (!anio || anio === "Todos") return undefined;
  return {
    symbol: "none",
    silent: true,
    label: { show: false },
    lineStyle: { color: COLORES_TEMA.tinta, type: "dashed", width: 1, opacity: 0.6 },
    data: [{ xAxis: String(anio) }],
  };
}

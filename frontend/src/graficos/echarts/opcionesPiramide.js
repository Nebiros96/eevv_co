import { COLORES_TEMA } from "@/graficos/echarts/motor";
import { ejeCategoria, ejeValorSimetrico, etiqueta, leyenda, tooltip } from "@/graficos/echarts/opciones";

export function opcionPiramide(datos, formato) {
  const absoluto = (valor) => formato(Math.abs(valor));
  const barra = (id, color, valores, posicion) => ({
    id,
    name: id,
    type: "bar",
    stack: "edad",
    data: valores,
    barMaxWidth: 18,
    barCategoryGap: "18%",
    itemStyle: { color, borderRadius: posicion === "left" ? [4, 0, 0, 4] : [0, 4, 4, 0] },
    label: etiqueta(absoluto, { position: posicion }),
    labelLayout: { hideOverlap: true },
    emphasis: { focus: "series" },
  });

  return {
    tooltip: tooltip(absoluto),
    legend: leyenda(),
    grid: { top: 36, right: 56, bottom: 4, left: 56, containLabel: true },
    xAxis: ejeValorSimetrico(
      Math.max(0, ...datos.flatMap((fila) => [Math.abs(fila.hombres), fila.mujeres])),
    ),
    yAxis: ejeCategoria(datos.map((fila) => fila.edad), { axisLabel: { fontSize: 11 } }),
    series: [
      barra("Hombres", COLORES_TEMA.hombres, datos.map((fila) => fila.hombres), "left"),
      barra("Mujeres", COLORES_TEMA.mujeres, datos.map((fila) => fila.mujeres), "right"),
    ],
  };
}

import { useMemo } from "react";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { ORDEN_MADRE } from "@/estilos/tema";
import { Grafico } from "@/graficos/echarts/Grafico";
import { COLORES_TEMA } from "@/graficos/echarts/motor";
import { ejeCategoria, ejeValor, etiqueta, leyenda, tooltip } from "@/graficos/echarts/opciones";

export function EdadMadre({ filas, anioBase, anioActual }) {
  const datos = useMemo(
    () =>
      ORDEN_MADRE.map((grupo) => {
        const base = filas.find((fila) => fila.anio === anioBase && fila.grupo_edad_madre === grupo);
        const actual = filas.find((fila) => fila.anio === anioActual && fila.grupo_edad_madre === grupo);
        return { grupo, base: base?.nacimientos ?? 0, actual: actual?.nacimientos ?? 0 };
      }).filter((fila) => fila.base > 0 || fila.actual > 0),
    [anioActual, anioBase, filas],
  );

  const opcion = useMemo(
    () => ({
      tooltip: tooltip(),
      legend: leyenda(),
      grid: { top: 40, right: 12, bottom: 4, left: 8, containLabel: true },
      xAxis: ejeCategoria(datos.map((fila) => fila.grupo)),
      yAxis: ejeValor(Math.max(0, ...datos.flatMap((fila) => [fila.base, fila.actual]))),
      series: [
        {
          id: "base",
          name: String(anioBase),
          type: "bar",
          data: datos.map((fila) => fila.base),
          barMaxWidth: 28,
          itemStyle: { color: COLORES_TEMA.gris, borderRadius: [6, 6, 0, 0] },
          label: etiqueta(undefined, { position: "top" }),
        },
        {
          id: "actual",
          name: String(anioActual),
          type: "bar",
          data: datos.map((fila) => fila.actual),
          barMaxWidth: 28,
          itemStyle: { color: COLORES_TEMA.nacimientos, borderRadius: [6, 6, 0, 0] },
          label: etiqueta(undefined, { position: "top" }),
        },
      ],
    }),
    [anioActual, anioBase, datos],
  );

  return (
    <Tarjeta titulo="Nacimientos según grupo etario de la madre" alto={400}>
      {datos.length === 0 ? (
        <Vacio>No hay edad de la madre para comparar.</Vacio>
      ) : (
        <Grafico opcion={opcion} alto={390} />
      )}
    </Tarjeta>
  );
}

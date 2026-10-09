import { useMemo } from "react";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { useConsulta } from "@/datos/useConsulta";
import { decimal, ORDEN_MADRE } from "@/estilos/tema";
import { Grafico } from "@/graficos/echarts/Grafico";
import { COLORES_TEMA } from "@/graficos/echarts/motor";
import { ejeCategoria, ejeValor, etiqueta, tooltip } from "@/graficos/echarts/opciones";

export function BarrasFecundidad({ sql }) {
  const { filas, cargando, error } = useConsulta(sql);
  const datos = useMemo(
    () =>
      ORDEN_MADRE.map((grupo) => filas.find((fila) => fila.grupo_edad_madre === grupo))
        .filter(Boolean)
        .map((fila) => ({ grupo: fila.grupo_edad_madre, tasa: fila.tasa })),
    [filas],
  );

  const opcion = useMemo(
    () => ({
      tooltip: tooltip(decimal),
      grid: { top: 28, right: 12, bottom: 4, left: 8, containLabel: true },
      xAxis: ejeCategoria(datos.map((fila) => fila.grupo)),
      yAxis: ejeValor(Math.max(0, ...datos.map((fila) => fila.tasa || 0))),
      series: [
        {
          id: "tasa",
          name: "Tasa",
          type: "bar",
          data: datos.map((fila) => fila.tasa),
          barMaxWidth: 42,
          itemStyle: { color: COLORES_TEMA.mujeres, borderRadius: [6, 6, 0, 0] },
          label: etiqueta(decimal, { position: "top" }),
        },
      ],
    }),
    [datos],
  );

  return (
    <Tarjeta
      titulo="Fecundidad por edad de la madre (hijos por cada 1.000 mujeres)"
      cargando={cargando && datos.length === 0}
      error={error}
      alto={400}
    >
      {datos.length === 0 && !cargando ? (
        <Vacio>No hay fecundidad por edad para este filtro.</Vacio>
      ) : (
        <Grafico opcion={opcion} alto={390} cargando={cargando} />
      )}
    </Tarjeta>
  );
}

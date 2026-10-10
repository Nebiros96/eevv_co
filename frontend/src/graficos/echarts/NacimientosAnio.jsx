import { useMemo } from "react";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { whereTerritorio } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { Grafico } from "@/graficos/echarts/Grafico";
import { COLORES_TEMA } from "@/graficos/echarts/motor";
import { ejeCategoria, ejeValor, etiqueta, lineaAnio, tooltip } from "@/graficos/echarts/opciones";

export function NacimientosAnio() {
  const { filtros } = useFiltros();
  const { filas, cargando, error } = useConsulta(`
    SELECT anio, SUM(nacimientos)::DOUBLE AS nacimientos
    FROM panorama
    WHERE ${whereTerritorio(filtros, { anio: false })}
    GROUP BY anio
    ORDER BY anio
  `);

  const opcion = useMemo(
    () => ({
      tooltip: tooltip(),
      grid: { top: 28, right: 24, bottom: 8, left: 8, containLabel: true },
      xAxis: ejeCategoria(filas.map((fila) => String(fila.anio))),
      yAxis: ejeValor(Math.max(0, ...filas.map((fila) => fila.nacimientos))),
      series: [
        {
          id: "nacimientos",
          name: "Nacimientos",
          type: "bar",
          barMaxWidth: 48,
          data: filas.map((fila) => fila.nacimientos),
          itemStyle: { color: COLORES_TEMA.nacimientos, borderRadius: [6, 6, 0, 0] },
          label: etiqueta(undefined, { position: "top" }),
          markLine: lineaAnio(filtros.anio),
        },
      ],
    }),
    [filas, filtros.anio],
  );

  return (
    <Tarjeta titulo="Nacimientos por año" cargando={cargando && filas.length === 0} error={error}>
      {filas.length === 0 && !cargando ? (
        <Vacio>No hay nacimientos para este territorio.</Vacio>
      ) : (
        <Grafico opcion={opcion} cargando={cargando} />
      )}
    </Tarjeta>
  );
}

import { useMemo } from "react";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { whereTerritorio } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { Grafico } from "@/graficos/echarts/Grafico";
import { COLORES_TEMA } from "@/graficos/echarts/motor";
import { ejeCategoria, ejeValor, etiqueta, lineaAnio, tooltip } from "@/graficos/echarts/opciones";

export function DefuncionesAnio() {
  const { filtros } = useFiltros();
  const { filas, cargando, error } = useConsulta(`
    SELECT anio, SUM(defunciones)::DOUBLE AS defunciones
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
      yAxis: ejeValor(Math.max(0, ...filas.map((fila) => fila.defunciones))),
      series: [
        {
          id: "defunciones",
          name: "Defunciones",
          type: "bar",
          barMaxWidth: 48,
          data: filas.map((fila) => fila.defunciones),
          itemStyle: { color: COLORES_TEMA.defunciones, borderRadius: [6, 6, 0, 0] },
          label: etiqueta(undefined, { position: "top" }),
          markLine: lineaAnio(filtros.anio),
        },
      ],
    }),
    [filas, filtros.anio],
  );

  return (
    <Tarjeta titulo="Defunciones por año" cargando={cargando && filas.length === 0} error={error}>
      {filas.length === 0 && !cargando ? (
        <Vacio>No hay defunciones para este territorio.</Vacio>
      ) : (
        <Grafico opcion={opcion} cargando={cargando} />
      )}
    </Tarjeta>
  );
}

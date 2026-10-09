import { useMemo } from "react";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { whereTerritorio } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { Grafico } from "@/graficos/echarts/Grafico";
import { COLORES_TEMA } from "@/graficos/echarts/motor";
import {
  ejeCategoria,
  ejeValor,
  leyenda,
  lineaAnio,
  serieLinea,
  tooltip,
} from "@/graficos/echarts/opciones";

export function SerieAnual() {
  const { filtros } = useFiltros();
  const { filas, cargando, error } = useConsulta(`
    SELECT anio,
           SUM(nacimientos)::DOUBLE AS nacimientos,
           SUM(defunciones)::DOUBLE AS defunciones
    FROM panorama
    WHERE ${whereTerritorio(filtros, { anio: false })}
    GROUP BY anio
    ORDER BY anio
  `);

  const opcion = useMemo(() => {
    const maximo = Math.max(0, ...filas.flatMap((fila) => [fila.nacimientos, fila.defunciones]));
    return {
      tooltip: tooltip(),
      legend: leyenda(),
      grid: { top: 44, right: 24, bottom: 8, left: 8, containLabel: true },
      xAxis: ejeCategoria(filas.map((fila) => String(fila.anio))),
      yAxis: ejeValor(maximo),
      series: [
        serieLinea(
          "nacimientos",
          "Nacimientos",
          COLORES_TEMA.nacimientos,
          filas.map((fila) => fila.nacimientos),
          { area: true, markLine: lineaAnio(filtros.anio) },
        ),
        serieLinea(
          "defunciones",
          "Defunciones",
          COLORES_TEMA.defunciones,
          filas.map((fila) => fila.defunciones),
          { area: true },
        ),
      ],
    };
  }, [filas, filtros.anio]);

  return (
    <Tarjeta
      titulo="Histórico de Nacimientos y Defunciones"
      cargando={cargando && filas.length === 0}
      error={error}
      alto={340}
    >
      {filas.length === 0 && !cargando ? (
        <Vacio>No hay hechos vitales para este territorio.</Vacio>
      ) : (
        <Grafico opcion={opcion} alto={330} cargando={cargando} />
      )}
    </Tarjeta>
  );
}

import { useMemo } from "react";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { decimal } from "@/estilos/tema";
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

export function SerieTasas({ sql, natalidad = true, mortalidad = true }) {
  const { filtros } = useFiltros();
  const { filas, cargando, error } = useConsulta(sql);

  const opcion = useMemo(() => {
    const valores = filas.flatMap((fila) => [
      natalidad ? fila.natalidad : null,
      mortalidad ? fila.mortalidad : null,
    ]);
    const series = [];
    if (natalidad) {
      series.push(
        serieLinea("natalidad", "Natalidad", COLORES_TEMA.nacimientos, filas.map((fila) => fila.natalidad), {
          formato: decimal,
          area: true,
        }),
      );
    }
    if (mortalidad) {
      series.push(
        serieLinea("mortalidad", "Mortalidad", COLORES_TEMA.defunciones, filas.map((fila) => fila.mortalidad), {
          formato: decimal,
          area: true,
        }),
      );
    }
    if (series[0]) series[0].markLine = lineaAnio(filtros.anio);
    return {
      tooltip: tooltip(decimal),
      legend: leyenda(),
      grid: { top: 44, right: 24, bottom: 8, left: 8, containLabel: true },
      xAxis: ejeCategoria(filas.map((fila) => String(fila.anio))),
      yAxis: ejeValor(Math.max(0, ...valores.filter((valor) => Number.isFinite(valor)))),
      series,
    };
  }, [filas, filtros.anio, mortalidad, natalidad]);

  return (
    <Tarjeta
      titulo="Tasas brutas de mortalidad por 1.000 habitantes"
      cargando={cargando && filas.length === 0}
      error={error}
      alto={340}
    >
      {filas.length === 0 && !cargando ? (
        <Vacio>No hay población proyectada para este territorio.</Vacio>
      ) : (
        <Grafico opcion={opcion} alto={330} cargando={cargando} />
      )}
    </Tarjeta>
  );
}

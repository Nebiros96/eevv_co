import { useMemo } from "react";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { CAUSAS_EXTERNAS } from "@/datos/consultas";
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

const COLORES_CAUSA = {
  Homicidios: COLORES_TEMA.defunciones,
  Suicidios: COLORES_TEMA.lila,
  "Accidentes de tránsito": COLORES_TEMA.relacion,
  "Otros accidentes": COLORES_TEMA.gris,
  "Otras externas": COLORES_TEMA.nacimientos,
};

export function SerieExterna({ sql }) {
  const { filtros } = useFiltros();
  const { filas, cargando, error } = useConsulta(sql);

  const opcion = useMemo(() => {
    const anios = [...new Set(filas.map((fila) => fila.anio))].sort((a, b) => a - b);
    const causas = CAUSAS_EXTERNAS.filter((causa) => filas.some((fila) => fila.causa === causa));
    const valor = (anio, causa) => filas.find((fila) => fila.anio === anio && fila.causa === causa)?.tasa ?? null;
    return {
      tooltip: tooltip(decimal),
      legend: leyenda(),
      grid: { top: 44, right: 24, bottom: 8, left: 8, containLabel: true },
      xAxis: ejeCategoria(anios.map(String)),
      yAxis: ejeValor(Math.max(0, ...filas.map((fila) => fila.tasa || 0))),
      series: causas.map((causa, indice) =>
        serieLinea(causa, causa, COLORES_CAUSA[causa], anios.map((anio) => valor(anio, causa)), {
          formato: decimal,
          markLine: indice === 0 ? lineaAnio(filtros.anio) : undefined,
        }),
      ),
    };
  }, [filas, filtros.anio]);

  return (
    <Tarjeta
      titulo="Tasas de defunciones por causas externas por 100.000 habitantes"
      cargando={cargando && filas.length === 0}
      error={error}
    >
      {filas.length === 0 && !cargando ? (
        <Vacio>No hay causas externas para este filtro.</Vacio>
      ) : (
        <Grafico opcion={opcion} cargando={cargando} />
      )}
    </Tarjeta>
  );
}

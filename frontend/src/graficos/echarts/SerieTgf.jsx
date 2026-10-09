import { useMemo } from "react";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { decimal2 } from "@/estilos/tema";
import { Grafico } from "@/graficos/echarts/Grafico";
import { COLORES_TEMA } from "@/graficos/echarts/motor";
import { ejeCategoria, ejeValor, etiqueta, lineaAnio, tooltip } from "@/graficos/echarts/opciones";

export function SerieTgf({ sql }) {
  const { filtros } = useFiltros();
  const { filas, cargando, error } = useConsulta(sql);

  const opcion = useMemo(
    () => ({
      tooltip: tooltip(decimal2, { axisPointer: { type: "line" } }),
      grid: { top: 28, right: 24, bottom: 8, left: 8, containLabel: true },
      xAxis: ejeCategoria(filas.map((fila) => String(fila.anio))),
      yAxis: ejeValor(Math.max(0, ...filas.map((fila) => fila.tgf || 0))),
      series: [
        {
          id: "tgf",
          name: "Hijos por mujer",
          type: "line",
          data: filas.map((fila) => fila.tgf),
          symbol: "circle",
          symbolSize: 7,
          lineStyle: { width: 2.5, color: COLORES_TEMA.mujeres },
          itemStyle: { color: COLORES_TEMA.mujeres, borderColor: "#fff", borderWidth: 1.5 },
          areaStyle: { color: COLORES_TEMA.mujeres, opacity: 0.08 },
          label: etiqueta(decimal2, { position: "top" }),
          labelLayout: { hideOverlap: true },
          markLine: lineaAnio(filtros.anio),
        },
      ],
    }),
    [filas, filtros.anio],
  );

  return (
    <Tarjeta
      titulo="Tasa global de fecundidad (hijos por mujer)"
      cargando={cargando && filas.length === 0}
      error={error}
      alto={340}
    >
      {filas.length === 0 && !cargando ? (
        <Vacio>No hay TGF para este territorio.</Vacio>
      ) : (
        <Grafico opcion={opcion} alto={330} cargando={cargando} />
      )}
    </Tarjeta>
  );
}

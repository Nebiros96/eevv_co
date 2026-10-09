import { useMemo } from "react";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { literal, whereTerritorio } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { corto } from "@/estilos/tema";
import { Grafico } from "@/graficos/echarts/Grafico";
import { COLORES_TEMA } from "@/graficos/echarts/motor";
import { ejeCategoria, ejeValor, etiqueta, tooltip } from "@/graficos/echarts/opciones";

export function BarrasCausas() {
  const { filtros } = useFiltros();
  const territorio = whereTerritorio(filtros);
  const extra =
    filtros.causa === "Todas"
      ? ""
      : `UNION ALL
         SELECT * FROM base
         WHERE cod_causa = ${literal(filtros.causa)}
           AND cod_causa NOT IN (SELECT cod_causa FROM top)`;
  const { filas, cargando, error } = useConsulta(`
    WITH base AS (
      SELECT cod_causa, causa, SUM(defunciones)::DOUBLE AS defunciones
      FROM causas
      WHERE ${territorio}
      GROUP BY 1, 2
    ),
    top AS (
      SELECT * FROM base ORDER BY defunciones DESC LIMIT 10
    )
    SELECT * FROM (
      SELECT * FROM top
      ${extra}
    )
    ORDER BY defunciones DESC
  `);

  const opcion = useMemo(
    () => ({
      tooltip: tooltip(),
      grid: { top: 8, right: 64, bottom: 4, left: 8, containLabel: true },
      xAxis: ejeValor(Math.max(0, ...filas.map((fila) => fila.defunciones))),
      yAxis: ejeCategoria(
        filas.map((fila) => String(fila.causa)),
        {
          inverse: true,
          axisLabel: { fontSize: 11, width: 220, overflow: "truncate", formatter: (valor) => corto(valor, 36) },
        },
      ),
      series: [
        {
          id: "defunciones",
          name: "Defunciones",
          type: "bar",
          barMaxWidth: 16,
          data: filas.map((fila) => ({
            value: fila.defunciones,
            itemStyle: {
              color:
                filtros.causa === "Todas" || String(fila.cod_causa) === filtros.causa
                  ? COLORES_TEMA.defunciones
                  : COLORES_TEMA.suave,
            },
          })),
          itemStyle: { borderRadius: [0, 4, 4, 0] },
          label: etiqueta(undefined, { position: "right" }),
        },
      ],
    }),
    [filas, filtros.causa],
  );

  return (
    <Tarjeta
      titulo="Principales causas de defunción"
      cargando={cargando && filas.length === 0}
      error={error}
    >
      {filas.length === 0 && !cargando ? (
        <Vacio>No hay causas para este filtro.</Vacio>
      ) : (
        <Grafico opcion={opcion} cargando={cargando} />
      )}
    </Tarjeta>
  );
}

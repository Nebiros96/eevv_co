import { useMemo } from "react";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { whereTerritorio } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { corto } from "@/estilos/tema";
import { Grafico } from "@/graficos/echarts/Grafico";
import { COLORES_TEMA } from "@/graficos/echarts/motor";
import { ejeCategoria, ejeValor, etiqueta, leyenda, tooltip } from "@/graficos/echarts/opciones";

function barra(id, nombre, color, datos) {
  return {
    id,
    name: nombre,
    type: "bar",
    data: datos,
    barMaxWidth: 14,
    barGap: "25%",
    itemStyle: { color, borderRadius: [0, 4, 4, 0] },
    label: etiqueta(undefined, { position: "right" }),
    emphasis: { focus: "series" },
  };
}

export function Ranking() {
  const { filtros } = useFiltros();
  const columna =
    filtros.departamento === "Todos" && filtros.municipio === "Todos" ? "departamento" : "municipio";
  const { filas, cargando, error } = useConsulta(`
    SELECT ${columna} AS etiqueta,
           SUM(defunciones)::DOUBLE AS defunciones,
           SUM(nacimientos)::DOUBLE AS nacimientos
    FROM panorama
    WHERE ${whereTerritorio(filtros)}
    GROUP BY 1
    ORDER BY defunciones DESC
    LIMIT 10
  `);

  const opcion = useMemo(() => {
    const maximo = Math.max(0, ...filas.flatMap((fila) => [fila.defunciones, fila.nacimientos]));
    return {
      tooltip: tooltip(),
      legend: leyenda(),
      grid: { top: 36, right: 64, bottom: 4, left: 8, containLabel: true },
      xAxis: ejeValor(maximo),
      yAxis: ejeCategoria(
        filas.map((fila) => String(fila.etiqueta)),
        {
          inverse: true,
          axisLabel: {
            fontSize: 12,
            width: 130,
            overflow: "truncate",
            formatter: (valor) => corto(valor, 22),
          },
        },
      ),
      series: [
        barra("defunciones", "Defunciones", COLORES_TEMA.defunciones, filas.map((fila) => fila.defunciones)),
        barra("nacimientos", "Nacimientos", COLORES_TEMA.nacimientos, filas.map((fila) => fila.nacimientos)),
      ],
    };
  }, [filas]);

  return (
    <Tarjeta
      titulo="Entidades Territoriales con más defunciones y nacimientos"
      cargando={cargando && filas.length === 0}
      error={error}
    >
      {filas.length === 0 && !cargando ? (
        <Vacio>No hay territorios para este filtro.</Vacio>
      ) : (
        <Grafico opcion={opcion} cargando={cargando} />
      )}
    </Tarjeta>
  );
}

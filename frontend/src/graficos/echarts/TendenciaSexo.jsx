import { useMemo } from "react";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { whereCausas } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { ORDEN_SEXO } from "@/estilos/tema";
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

const TRAZOS = {
  Hombres: COLORES_TEMA.hombres,
  Mujeres: COLORES_TEMA.mujeres,
  Indeterminado: COLORES_TEMA.gris,
};

export function TendenciaSexo() {
  const { filtros } = useFiltros();
  const { filas, cargando, error } = useConsulta(`
    SELECT anio, sexo, SUM(defunciones)::DOUBLE AS defunciones
    FROM causas
    WHERE ${whereCausas(filtros, { anio: false })}
    GROUP BY 1, 2
    ORDER BY 1
  `);

  const datos = useMemo(() => {
    const porAnio = new Map();
    for (const fila of filas) {
      if (!porAnio.has(fila.anio)) {
        porAnio.set(fila.anio, { anio: fila.anio, Hombres: 0, Mujeres: 0, Indeterminado: 0 });
      }
      porAnio.get(fila.anio)[fila.sexo] = fila.defunciones;
    }
    return [...porAnio.values()];
  }, [filas]);

  const opcion = useMemo(
    () => ({
      tooltip: tooltip(),
      legend: leyenda(),
      grid: { top: 44, right: 24, bottom: 8, left: 8, containLabel: true },
      xAxis: ejeCategoria(datos.map((fila) => String(fila.anio))),
      yAxis: ejeValor(
        Math.max(0, ...datos.flatMap((fila) => [fila.Hombres, fila.Mujeres, fila.Indeterminado])),
      ),
      series: ORDEN_SEXO.map((sexo, indice) =>
        serieLinea(sexo, sexo, TRAZOS[sexo], datos.map((fila) => fila[sexo]), {
          markLine: indice === 0 ? lineaAnio(filtros.anio) : undefined,
        }),
      ),
    }),
    [datos, filtros.anio],
  );

  return (
    <Tarjeta
      titulo="Defunciones por sexo y año"
      cargando={cargando && filas.length === 0}
      error={error}
      alto={400}
    >
      {datos.length === 0 && !cargando ? (
        <Vacio>No hay serie para esta causa.</Vacio>
      ) : (
        <Grafico opcion={opcion} alto={390} cargando={cargando} />
      )}
    </Tarjeta>
  );
}

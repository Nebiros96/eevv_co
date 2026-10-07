import {
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { useConsulta } from "@/datos/useConsulta";
import { whereTerritorio } from "@/datos/consultas";
import { useFiltros } from "@/estado/FiltrosProvider";
import { COLORES, ejeCerrado, entero, marca } from "@/estilos/tema";
import { crearEtiquetas } from "@/graficos/etiquetas";

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

  const etiquetas = crearEtiquetas();
  const eje = ejeCerrado(Math.max(0, ...filas.flatMap((fila) => [fila.nacimientos, fila.defunciones])));

  return (
    <Tarjeta titulo="Nacimientos y defunciones por año" cargando={cargando} error={error} alto={340}>
      {filas.length === 0 ? (
        <Vacio>No hay hechos vitales para este territorio.</Vacio>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={filas} margin={{ top: 22, right: 28, left: 0, bottom: 4 }}>
            <CartesianGrid stroke={COLORES.linea} vertical={false} />
            <XAxis dataKey="anio" padding={{ left: 28, right: 20 }} />
            <YAxis {...eje} tickFormatter={marca} width={72} tick={{ fontSize: 11 }} />
            <Tooltip formatter={entero} />
            <Legend />
            <Line
              dataKey="nacimientos"
              name="Nacimientos"
              stroke={COLORES.nacimientos}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              isAnimationActive={false}
            >
              <LabelList dataKey="nacimientos" content={etiquetas.punto} />
            </Line>
            <Line
              dataKey="defunciones"
              name="Defunciones"
              stroke={COLORES.defunciones}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              isAnimationActive={false}
            >
              <LabelList dataKey="defunciones" content={etiquetas.punto} />
            </Line>
            {filtros.anio !== "Todos" ? (
              <ReferenceLine x={Number(filtros.anio)} stroke={COLORES.gris} strokeDasharray="4 4" />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Tarjeta>
  );
}

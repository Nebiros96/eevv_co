import {
  CartesianGrid,
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
import { COLORES, entero } from "@/estilos/tema";

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

  return (
    <Tarjeta titulo="Nacimientos y defunciones anuales" cargando={cargando} error={error} alto={340}>
      {filas.length === 0 ? (
        <Vacio>No hay hechos vitales para este territorio.</Vacio>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={filas} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={COLORES.linea} vertical={false} />
            <XAxis dataKey="anio" />
            <YAxis tickFormatter={entero} width={64} />
            <Tooltip formatter={entero} />
            <Legend />
            <Line
              dataKey="nacimientos"
              name="Nacimientos"
              stroke={COLORES.nacimientos}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
            <Line
              dataKey="defunciones"
              name="Defunciones"
              stroke={COLORES.defunciones}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
            {filtros.anio !== "Todos" ? (
              <ReferenceLine x={Number(filtros.anio)} stroke={COLORES.gris} strokeDasharray="4 4" />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Tarjeta>
  );
}

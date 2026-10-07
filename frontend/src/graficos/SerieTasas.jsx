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
import { useFiltros } from "@/estado/FiltrosProvider";
import { COLORES, decimal, ejeCerrado, marca } from "@/estilos/tema";
import { crearEtiquetas } from "@/graficos/etiquetas";

export function SerieTasas({ sql, natalidad = true, mortalidad = true }) {
  const { filtros } = useFiltros();
  const { filas, cargando, error } = useConsulta(sql);
  const etiquetas = crearEtiquetas({ formato: decimal });
  const valores = filas.flatMap((fila) => [natalidad ? fila.natalidad : null, mortalidad ? fila.mortalidad : null]);
  const eje = ejeCerrado(Math.max(0, ...valores.filter((valor) => Number.isFinite(valor))));

  return (
    <Tarjeta titulo="Tasas brutas por 1.000 habitantes" cargando={cargando} error={error} alto={340}>
      {filas.length === 0 ? (
        <Vacio>No hay población proyectada para este territorio.</Vacio>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={filas} margin={{ top: 22, right: 28, left: 0, bottom: 4 }}>
            <CartesianGrid stroke={COLORES.linea} vertical={false} />
            <XAxis dataKey="anio" padding={{ left: 28, right: 20 }} />
            <YAxis {...eje} tickFormatter={marca} width={48} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(valor) => decimal(valor)} />
            <Legend />
            {natalidad ? (
              <Line
                dataKey="natalidad"
                name="Natalidad"
                stroke={COLORES.nacimientos}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                isAnimationActive={false}
              >
                <LabelList dataKey="natalidad" content={etiquetas.punto} />
              </Line>
            ) : null}
            {mortalidad ? (
              <Line
                dataKey="mortalidad"
                name="Mortalidad"
                stroke={COLORES.defunciones}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                isAnimationActive={false}
              >
                <LabelList dataKey="mortalidad" content={etiquetas.punto} />
              </Line>
            ) : null}
            {filtros.anio !== "Todos" ? (
              <ReferenceLine x={Number(filtros.anio)} stroke={COLORES.gris} strokeDasharray="4 4" />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Tarjeta>
  );
}

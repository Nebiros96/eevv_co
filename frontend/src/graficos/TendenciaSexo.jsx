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
import { whereCausas } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { COLORES, entero, ORDEN_SEXO } from "@/estilos/tema";

const TRAZOS = {
  Hombres: COLORES.hombres,
  Mujeres: COLORES.mujeres,
  Indeterminado: COLORES.gris,
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
  const porAnio = new Map();
  for (const fila of filas) {
    if (!porAnio.has(fila.anio)) {
      porAnio.set(fila.anio, { anio: fila.anio, Hombres: 0, Mujeres: 0, Indeterminado: 0 });
    }
    porAnio.get(fila.anio)[fila.sexo] = fila.defunciones;
  }
  const datos = [...porAnio.values()];

  return (
    <Tarjeta titulo="Defunciones por sexo, todos los años" cargando={cargando} error={error}>
      {datos.length === 0 ? (
        <Vacio>No hay serie para esta causa.</Vacio>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={COLORES.linea} vertical={false} />
            <XAxis dataKey="anio" />
            <YAxis tickFormatter={entero} width={64} />
            <Tooltip formatter={entero} />
            <Legend />
            {ORDEN_SEXO.map((sexo) => (
              <Line
                key={sexo}
                dataKey={sexo}
                stroke={TRAZOS[sexo]}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
            ))}
            {filtros.anio !== "Todos" ? (
              <ReferenceLine x={Number(filtros.anio)} stroke={COLORES.gris} strokeDasharray="4 4" />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Tarjeta>
  );
}

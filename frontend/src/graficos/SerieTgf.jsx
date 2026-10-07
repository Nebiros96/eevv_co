import {
  CartesianGrid,
  LabelList,
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
import { COLORES, decimal2, ejeCerrado, marca } from "@/estilos/tema";
import { crearEtiquetas } from "@/graficos/etiquetas";

export function SerieTgf({ sql }) {
  const { filtros } = useFiltros();
  const { filas, cargando, error } = useConsulta(sql);
  const etiquetas = crearEtiquetas({ formato: decimal2 });
  const eje = ejeCerrado(Math.max(0, ...filas.map((fila) => fila.tgf || 0)));

  return (
    <Tarjeta titulo="Tasa global de fecundidad (hijos por mujer)" cargando={cargando} error={error} alto={340}>
      {filas.length === 0 ? (
        <Vacio>No hay TGF para este territorio.</Vacio>
      ) : (
        <div className="grafica-caja" style={{ minHeight: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filas} margin={{ top: 22, right: 28, left: 0, bottom: 4 }}>
            <CartesianGrid stroke={COLORES.linea} vertical={false} />
            <XAxis dataKey="anio" padding={{ left: 28, right: 20 }} />
            <YAxis {...eje} tickFormatter={marca} width={48} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(valor) => decimal2(valor)} />
            <Line
              dataKey="tgf"
              name="Hijos por mujer"
              stroke={COLORES.mujeres}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              isAnimationActive={false}
            >
              <LabelList dataKey="tgf" content={etiquetas.punto} />
            </Line>
            {filtros.anio !== "Todos" ? (
              <ReferenceLine x={Number(filtros.anio)} stroke={COLORES.gris} strokeDasharray="4 4" />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
        </div>
      )}
    </Tarjeta>
  );
}

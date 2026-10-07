import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { useConsulta } from "@/datos/useConsulta";
import { COLORES, decimal, ejeCerrado, marca, ORDEN_MADRE } from "@/estilos/tema";
import { crearEtiquetas } from "@/graficos/etiquetas";

export function BarrasFecundidad({ sql }) {
  const { filas, cargando, error } = useConsulta(sql);
  const datos = ORDEN_MADRE.map((grupo) => filas.find((fila) => fila.grupo_edad_madre === grupo))
    .filter(Boolean)
    .map((fila) => ({ grupo: fila.grupo_edad_madre, tasa: fila.tasa }));
  const etiquetas = crearEtiquetas({ formato: decimal });
  const eje = ejeCerrado(Math.max(0, ...datos.map((fila) => fila.tasa || 0)));

  return (
    <Tarjeta titulo="Fecundidad por edad de la madre (hijos por cada 1.000 mujeres)" cargando={cargando} error={error} alto={400}>
      {datos.length === 0 ? (
        <Vacio>No hay fecundidad por edad para este filtro.</Vacio>
      ) : (
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={datos} margin={{ top: 28, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="grupo" tick={{ fontSize: 11 }} />
            <YAxis {...eje} tickFormatter={marca} width={48} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(valor) => decimal(valor)} />
            <Bar dataKey="tasa" name="Tasa" fill={COLORES.mujeres} isAnimationActive={false}>
              <LabelList dataKey="tasa" content={etiquetas.arriba} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Tarjeta>
  );
}

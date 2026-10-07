import { Bar, BarChart, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { COLORES, ejeCerrado, entero, marca, ORDEN_MADRE } from "@/estilos/tema";
import { crearEtiquetas } from "@/graficos/etiquetas";

export function EdadMadre({ filas, anioBase, anioActual }) {
  const datos = ORDEN_MADRE.map((grupo) => {
    const base = filas.find((fila) => fila.anio === anioBase && fila.grupo_edad_madre === grupo);
    const actual = filas.find((fila) => fila.anio === anioActual && fila.grupo_edad_madre === grupo);
    return {
      grupo,
      [anioBase]: base?.nacimientos ?? 0,
      [anioActual]: actual?.nacimientos ?? 0,
    };
  }).filter((fila) => fila[anioBase] > 0 || fila[anioActual] > 0);
  const etiquetas = crearEtiquetas();
  const eje = ejeCerrado(Math.max(0, ...datos.flatMap((fila) => [fila[anioBase], fila[anioActual]])));

  return (
    <Tarjeta titulo="Nacimientos según edad de la madre" alto={400}>
      {datos.length === 0 ? (
        <Vacio>No hay edad de la madre para comparar.</Vacio>
      ) : (
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={datos} margin={{ top: 28, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="grupo" tick={{ fontSize: 11 }} />
            <YAxis {...eje} tickFormatter={marca} width={64} tick={{ fontSize: 11 }} />
            <Tooltip formatter={entero} />
            <Legend />
            <Bar dataKey={String(anioBase)} name={String(anioBase)} fill={COLORES.gris} isAnimationActive={false}>
              <LabelList dataKey={String(anioBase)} content={etiquetas.arriba} />
            </Bar>
            <Bar dataKey={String(anioActual)} name={String(anioActual)} fill={COLORES.nacimientos} isAnimationActive={false}>
              <LabelList dataKey={String(anioActual)} content={etiquetas.arriba} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Tarjeta>
  );
}

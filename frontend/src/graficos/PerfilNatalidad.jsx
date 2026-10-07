import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { useConsulta } from "@/datos/useConsulta";
import { COLORES, decimal, ejeSimetrico, entero, marca } from "@/estilos/tema";
import { crearEtiquetas } from "@/graficos/etiquetas";

export function PerfilNatalidad({ titulo, sql, color = COLORES.nacimientos, orden = null }) {
  const { filas, cargando, error } = useConsulta(sql);
  const datos = filas
    .map((fila) => ({
      categoria: fila.categoria,
      base: fila.base,
      actual: fila.actual,
      cambio: fila.base ? (100 * (fila.actual - fila.base)) / fila.base : null,
    }))
    .filter((fila) => fila.base > 0 || fila.actual > 0)
    .sort((a, b) => {
      if (orden) return orden.indexOf(a.categoria) - orden.indexOf(b.categoria);
      return (a.cambio ?? 0) - (b.cambio ?? 0);
    });
  const etiquetas = crearEtiquetas({ formato: (valor) => `${decimal(valor)}%` });
  const eje = ejeSimetrico(Math.max(0, ...datos.map((fila) => Math.abs(fila.cambio || 0))));

  return (
    <Tarjeta titulo={titulo} cargando={cargando} error={error} alto={400}>
      {datos.length === 0 ? (
        <Vacio>No hay desagregación para este filtro.</Vacio>
      ) : (
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={datos} layout="vertical" margin={{ top: 8, right: 78, left: 8, bottom: 0 }}>
            <XAxis type="number" {...eje} tickFormatter={(valor) => marca(Math.abs(valor))} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="categoria" width={150} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(valor, nombre, extra) => {
                if (nombre === "cambio") return `${decimal(valor)}%`;
                return entero(extra.payload[nombre] ?? valor);
              }}
            />
            <Bar dataKey="cambio" name="Variación" fill={color} isAnimationActive={false}>
              <LabelList dataKey="cambio" content={etiquetas.derecha} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Tarjeta>
  );
}

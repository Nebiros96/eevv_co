import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { useConsulta } from "@/datos/useConsulta";
import { ejeCerrado, marca } from "@/estilos/tema";
import { crearEtiquetas } from "@/graficos/etiquetas";

export function RankingTasas({ titulo, sql, color, formato, nombre = "Tasa", alto = 420 }) {
  const { filas, cargando, error } = useConsulta(sql);
  const datos = filas.filter((fila) => Number.isFinite(fila.valor));
  const etiquetas = crearEtiquetas({ formato });
  const eje = ejeCerrado(Math.max(0, ...datos.map((fila) => fila.valor || 0)));
  const altoGrafica = Math.max(alto, datos.length * 34 + 48);

  return (
    <Tarjeta titulo={titulo} cargando={cargando} error={error} alto={altoGrafica}>
      {datos.length === 0 ? (
        <Vacio>No hay tasas para este territorio.</Vacio>
      ) : (
        <div className="grafica-caja" style={{ height: altoGrafica }}>
          <ResponsiveContainer width="100%" height={altoGrafica}>
            <BarChart
              data={datos}
              layout="vertical"
              barCategoryGap={6}
              margin={{ top: 8, right: 78, left: 8, bottom: 8 }}
            >
              <XAxis type="number" {...eje} tickFormatter={marca} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="etiqueta" width={140} interval={0} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(valor) => formato(valor)} />
              <Bar dataKey="valor" name={nombre} fill={color} isAnimationActive={false}>
                <LabelList dataKey="valor" content={etiquetas.derecha} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Tarjeta>
  );
}

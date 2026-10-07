import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { whereCausas } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { COLORES, ejeCerrado, entero, marca } from "@/estilos/tema";
import { crearEtiquetas } from "@/graficos/etiquetas";

export function TerritoriosCausa() {
  const { filtros } = useFiltros();
  const columna =
    filtros.departamento !== "Todos" || filtros.municipio !== "Todos" ? "municipio" : "departamento";
  const { filas, cargando, error } = useConsulta(`
    SELECT ${columna} AS etiqueta, SUM(defunciones)::DOUBLE AS defunciones
    FROM causas
    WHERE ${whereCausas(filtros)}
    GROUP BY 1
    ORDER BY defunciones DESC
    LIMIT 12
  `);

  const etiquetas = crearEtiquetas();
  const eje = ejeCerrado(Math.max(0, ...filas.map((fila) => fila.defunciones)));

  return (
    <Tarjeta titulo="Defunciones por entidad territorial" cargando={cargando} error={error} alto={400}>
      {filas.length === 0 ? (
        <Vacio>No hay territorios para esta causa.</Vacio>
      ) : (
        <div className="grafica-caja" style={{ minHeight: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filas}
            layout="vertical"
            margin={{ top: 8, right: 78, left: 8, bottom: 0 }}
          >
            <XAxis type="number" {...eje} tickFormatter={marca} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="etiqueta" width={140} tick={{ fontSize: 12 }} />
            <Tooltip formatter={entero} />
            <Bar dataKey="defunciones" name="Defunciones" fill={COLORES.defunciones} isAnimationActive={false}>
              <LabelList dataKey="defunciones" content={etiquetas.derecha} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      )}
    </Tarjeta>
  );
}

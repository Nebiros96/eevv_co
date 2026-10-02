import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { whereTerritorio } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { COLORES, entero } from "@/estilos/tema";

export function Ranking() {
  const { filtros } = useFiltros();
  const columna =
    filtros.departamento === "Todos" && filtros.municipio === "Todos" ? "departamento" : "municipio";
  const { filas, cargando, error } = useConsulta(`
    SELECT ${columna} AS etiqueta,
           SUM(defunciones)::DOUBLE AS defunciones,
           SUM(nacimientos)::DOUBLE AS nacimientos
    FROM panorama
    WHERE ${whereTerritorio(filtros)}
    GROUP BY 1
    ORDER BY defunciones DESC
    LIMIT 10
  `);
  const datos = filas;

  return (
    <Tarjeta titulo="Entidades Territoriales con más defunciones y nacimientos" cargando={cargando} error={error} alto={420}>
      {datos.length === 0 ? (
        <Vacio>No hay territorios para este filtro.</Vacio>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={datos} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid stroke={COLORES.linea} horizontal={false} />
            <XAxis type="number" tickFormatter={entero} />
            <YAxis type="category" dataKey="etiqueta" width={130} tick={{ fontSize: 12 }} />
            <Tooltip formatter={entero} />
            <Legend />
            <Bar dataKey="defunciones" name="Defunciones" fill={COLORES.defunciones} isAnimationActive={false} />
            <Bar dataKey="nacimientos" name="Nacimientos" fill={COLORES.nacimientos} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Tarjeta>
  );
}

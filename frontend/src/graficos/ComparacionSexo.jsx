import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
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
import { COLORES, ejeCerrado, entero, marca, ORDEN_SEXO } from "@/estilos/tema";
import { crearEtiquetas } from "@/graficos/etiquetas";

export function ComparacionSexo() {
  const { filtros } = useFiltros();
  const { filas, cargando, error } = useConsulta(`
    SELECT sexo,
           SUM(nacimientos)::DOUBLE AS nacimientos,
           SUM(defunciones)::DOUBLE AS defunciones
    FROM panorama
    WHERE ${whereTerritorio(filtros)} AND sexo <> 'Indeterminado'
    GROUP BY sexo
  `);
  const datos = ORDEN_SEXO.filter((sexo) => filas.some((fila) => fila.sexo === sexo)).map((sexo) => {
    const fila = filas.find((item) => item.sexo === sexo);
    return {
      sexo,
      nacimientos: fila?.nacimientos ?? 0,
      defunciones: fila?.defunciones ?? 0,
    };
  });
  const etiquetas = crearEtiquetas();
  const eje = ejeCerrado(Math.max(0, ...datos.flatMap((fila) => [fila.nacimientos, fila.defunciones])));

  return (
    <Tarjeta titulo="Comparación entre sexos" cargando={cargando} error={error} alto={420}>
      {datos.length === 0 ? (
        <Vacio>No hay desagregación por sexo.</Vacio>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={datos} margin={{ top: 28, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={COLORES.linea} vertical={false} />
            <XAxis dataKey="sexo" />
            <YAxis {...eje} tickFormatter={marca} width={72} tick={{ fontSize: 11 }} />
            <Tooltip formatter={entero} />
            <Legend />
            <Bar dataKey="nacimientos" name="Nacimientos" fill={COLORES.nacimientos} isAnimationActive={false}>
              <LabelList dataKey="nacimientos" content={etiquetas.arriba} />
            </Bar>
            <Bar dataKey="defunciones" name="Defunciones" fill={COLORES.defunciones} isAnimationActive={false}>
              <LabelList dataKey="defunciones" content={etiquetas.arriba} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Tarjeta>
  );
}

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
import { COLORES, entero, ORDEN_SEXO } from "@/estilos/tema";

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

  return (
    <Tarjeta titulo="Comparación entre sexos" cargando={cargando} error={error}>
      {datos.length === 0 ? (
        <Vacio>No hay desagregación por sexo.</Vacio>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={COLORES.linea} vertical={false} />
            <XAxis dataKey="sexo" />
            <YAxis tickFormatter={entero} width={64} />
            <Tooltip formatter={entero} />
            <Legend />
            <Bar dataKey="nacimientos" name="Nacimientos" fill={COLORES.nacimientos} isAnimationActive={false} />
            <Bar dataKey="defunciones" name="Defunciones" fill={COLORES.defunciones} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Tarjeta>
  );
}

import { Bar, BarChart, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { whereCausas } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { COLORES, entero, ORDEN_EDAD } from "@/estilos/tema";
import { crearEtiquetas } from "@/graficos/etiquetas";

export function Piramide() {
  const { filtros } = useFiltros();
  const { filas, cargando, error } = useConsulta(`
    SELECT grupo_edad, sexo, SUM(defunciones)::DOUBLE AS defunciones
    FROM causas
    WHERE ${whereCausas(filtros)}
      AND sexo IN ('Hombres', 'Mujeres')
    GROUP BY 1, 2
  `);
  const edades = [...ORDEN_EDAD.filter((edad) => edad !== "Edad desconocida")].reverse();
  if (filas.some((fila) => fila.grupo_edad === "Edad desconocida")) edades.push("Edad desconocida");
  const datos = edades.map((edad) => {
    const hombres = filas.find((fila) => fila.grupo_edad === edad && fila.sexo === "Hombres");
    const mujeres = filas.find((fila) => fila.grupo_edad === edad && fila.sexo === "Mujeres");
    return {
      edad,
      Hombres: -(hombres?.defunciones ?? 0),
      Mujeres: mujeres?.defunciones ?? 0,
    };
  }).filter((fila) => fila.Hombres !== 0 || fila.Mujeres !== 0);
  const etiquetas = crearEtiquetas();

  return (
    <Tarjeta titulo="Edad y sexo" cargando={cargando} error={error} alto={460}>
      {datos.length === 0 ? (
        <Vacio>No hay edad y sexo para este filtro.</Vacio>
      ) : (
        <ResponsiveContainer width="100%" height={440}>
          <BarChart data={datos} layout="vertical" stackOffset="sign" margin={{ top: 8, right: 72, left: 8, bottom: 0 }}>
            <XAxis type="number" tickFormatter={(valor) => entero(Math.abs(valor))} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="edad" width={110} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(valor) => entero(Math.abs(valor))} />
            <Legend />
            <Bar dataKey="Hombres" fill={COLORES.hombres} stackId="edad" isAnimationActive={false}>
              <LabelList dataKey="Hombres" content={etiquetas.extremo} />
            </Bar>
            <Bar dataKey="Mujeres" fill={COLORES.mujeres} stackId="edad" isAnimationActive={false}>
              <LabelList dataKey="Mujeres" content={etiquetas.extremo} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Tarjeta>
  );
}

import { Bar, BarChart, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { useConsulta } from "@/datos/useConsulta";
import { COLORES, decimal, ejeSimetrico, marca, ORDEN_EDAD_SIMPLE } from "@/estilos/tema";
import { crearEtiquetas } from "@/graficos/etiquetas";

function clave(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function PiramideTasas({ sql }) {
  const { filas, cargando, error } = useConsulta(sql);
  const ordenClaves = new Map(ORDEN_EDAD_SIMPLE.map((edad, indice) => [clave(edad), { edad, indice }]));
  const grupos = new Map();
  for (const fila of filas) {
    const id = clave(fila.grupo_edad);
    if (!grupos.has(id)) {
      grupos.set(id, {
        edad: ordenClaves.get(id)?.edad ?? fila.grupo_edad,
        indice: ordenClaves.get(id)?.indice ?? 1000,
        Hombres: 0,
        Mujeres: 0,
      });
    }
    if (fila.sexo === "Hombres") grupos.get(id).Hombres = -(fila.tasa ?? 0);
    if (fila.sexo === "Mujeres") grupos.get(id).Mujeres = fila.tasa ?? 0;
  }
  const datos = [...grupos.values()]
    .filter((fila) => fila.Hombres !== 0 || fila.Mujeres !== 0)
    .sort((a, b) => b.indice - a.indice);
  const etiquetas = crearEtiquetas({ formato: decimal });
  const eje = ejeSimetrico(Math.max(0, ...datos.flatMap((fila) => [Math.abs(fila.Hombres), fila.Mujeres])));
  const alto = Math.max(640, datos.length * 28);

  return (
    <Tarjeta titulo="Mortalidad por edad y sexo (por 1.000)" cargando={cargando} error={error} alto={alto}>
      {datos.length === 0 ? (
        <Vacio>No hay mortalidad específica para este filtro.</Vacio>
      ) : (
        <div className="grafica-caja" style={{ height: alto }}>
          <ResponsiveContainer width="100%" height={alto}>
            <BarChart
              data={datos}
              layout="vertical"
              stackOffset="sign"
              barCategoryGap={4}
              margin={{ top: 8, right: 72, left: 8, bottom: 0 }}
            >
              <XAxis type="number" {...eje} tickFormatter={(valor) => marca(Math.abs(valor))} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="edad" width={110} interval={0} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(valor) => decimal(Math.abs(valor))} />
              <Legend />
              <Bar dataKey="Hombres" fill={COLORES.hombres} stackId="edad" isAnimationActive={false}>
                <LabelList dataKey="Hombres" content={etiquetas.extremo} />
              </Bar>
              <Bar dataKey="Mujeres" fill={COLORES.mujeres} stackId="edad" isAnimationActive={false}>
                <LabelList dataKey="Mujeres" content={etiquetas.extremo} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Tarjeta>
  );
}

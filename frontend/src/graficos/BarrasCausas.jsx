import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { literal, whereTerritorio } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { COLORES, corto, entero } from "@/estilos/tema";

export function BarrasCausas() {
  const { filtros } = useFiltros();
  const territorio = whereTerritorio(filtros);
  const extra =
    filtros.causa === "Todas"
      ? ""
      : `UNION ALL
         SELECT * FROM base
         WHERE cod_causa = ${literal(filtros.causa)}
           AND cod_causa NOT IN (SELECT cod_causa FROM top)`;
  const { filas, cargando, error } = useConsulta(`
    WITH base AS (
      SELECT cod_causa, causa, SUM(defunciones)::DOUBLE AS defunciones
      FROM causas
      WHERE ${territorio}
      GROUP BY 1, 2
    ),
    top AS (
      SELECT * FROM base ORDER BY defunciones DESC LIMIT 12
    )
    SELECT * FROM (
      SELECT * FROM top
      ${extra}
    )
    ORDER BY defunciones DESC
  `);

  return (
    <Tarjeta titulo="Principales causas de defunción" cargando={cargando} error={error} alto={460}>
      {filas.length === 0 ? (
        <Vacio>No hay causas para este filtro.</Vacio>
      ) : (
        <ResponsiveContainer width="100%" height={440}>
          <BarChart data={filas} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <XAxis type="number" tickFormatter={entero} />
            <YAxis
              type="category"
              dataKey="causa"
              width={220}
              tickFormatter={(valor) => corto(valor, 36)}
              tick={{ fontSize: 11 }}
            />
            <Tooltip formatter={entero} />
            <Bar dataKey="defunciones" name="Defunciones" isAnimationActive={false}>
              {filas.map((fila) => (
                <Cell
                  key={fila.cod_causa}
                  fill={
                    filtros.causa === "Todas" || fila.cod_causa === filtros.causa
                      ? COLORES.defunciones
                      : COLORES.suave
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Tarjeta>
  );
}

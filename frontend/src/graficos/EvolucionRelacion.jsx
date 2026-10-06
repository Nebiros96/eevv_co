import {
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { whereTerritorio } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useDatos } from "@/datos/DatosProvider";
import { useFiltros } from "@/estado/FiltrosProvider";
import { COLORES, decimal, ejeCerrado, marca } from "@/estilos/tema";
import { crearEtiquetas } from "@/graficos/etiquetas";

function tasa(defunciones, nacimientos) {
  if (!nacimientos) return null;
  return (100 * defunciones) / nacimientos;
}

function nombreTerritorio(filtros, municipios) {
  if (filtros.municipio !== "Todos") {
    const [codDepartamento, codMunicipio] = filtros.municipio.split("|");
    const fila = municipios.find(
      (item) => item.cod_departamento === codDepartamento && item.cod_municipio === codMunicipio,
    );
    return fila?.municipio ?? "Municipio";
  }
  return filtros.departamento;
}

export function EvolucionRelacion() {
  const { filtros } = useFiltros();
  const { catalogos } = useDatos();
  const comparar = filtros.departamento !== "Todos" || filtros.municipio !== "Todos";
  const territorio = nombreTerritorio(filtros, catalogos.municipios);
  const { filas, cargando, error } = useConsulta(`
    WITH nacional AS (
      SELECT anio,
             SUM(nacimientos)::DOUBLE AS nacimientos,
             SUM(defunciones)::DOUBLE AS defunciones
      FROM panorama
      GROUP BY anio
    ),
    local AS (
      SELECT anio,
             SUM(nacimientos)::DOUBLE AS nacimientos,
             SUM(defunciones)::DOUBLE AS defunciones
      FROM panorama
      WHERE ${whereTerritorio(filtros, { anio: false })}
      GROUP BY anio
    )
    SELECT n.anio,
           n.nacimientos AS nacimientos_nacional,
           n.defunciones AS defunciones_nacional,
           l.nacimientos AS nacimientos_local,
           l.defunciones AS defunciones_local
    FROM nacional n
    LEFT JOIN local l USING (anio)
    ORDER BY n.anio
  `);
  const datos = filas.map((fila) => ({
    anio: fila.anio,
    nacional: tasa(fila.defunciones_nacional, fila.nacimientos_nacional),
    local: tasa(fila.defunciones_local, fila.nacimientos_local),
  }));
  const etiquetas = crearEtiquetas({ formato: decimal });
  const valores = datos.flatMap((fila) => (comparar ? [fila.nacional, fila.local] : [fila.nacional]));
  const eje = ejeCerrado(Math.max(0, ...valores.map((valor) => valor ?? 0)));
  const superaCien = comparar && datos.some((fila) => fila.local != null && fila.local > 100);

  return (
    <Tarjeta
      titulo="Evolución de defunciones por 100 nacimientos"
      cargando={cargando}
      error={error}
      alto={520}
    >
      {datos.length === 0 ? (
        <Vacio>No hay hechos vitales para este territorio.</Vacio>
      ) : (
        <ResponsiveContainer width="100%" height={480}>
          <LineChart data={datos} margin={{ top: comparar ? 28 : 22, right: 28, left: 0, bottom: 4 }}>
            {superaCien ? (
              <ReferenceArea
                y1={100}
                y2={eje.domain[1]}
                fill={COLORES.defunciones}
                fillOpacity={0.14}
                stroke="none"
              />
            ) : null}
            <CartesianGrid stroke={COLORES.linea} vertical={false} />
            <XAxis dataKey="anio" padding={{ left: 28, right: 20 }} />
            <YAxis {...eje} tickFormatter={marca} width={48} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(valor) => (valor == null ? "—" : decimal(valor))} />
            {comparar ? <Legend /> : null}
            <Line
              dataKey="nacional"
              name="Nacional"
              stroke={comparar ? COLORES.gris : "#c2410c"}
              strokeWidth={comparar ? 2 : 2.5}
              strokeDasharray={comparar ? "6 4" : undefined}
              dot={{ r: 3 }}
              connectNulls={false}
              isAnimationActive={false}
            >
              <LabelList dataKey="nacional" content={etiquetas.punto} />
            </Line>
            {comparar ? (
              <Line
                dataKey="local"
                name={territorio}
                stroke="#c2410c"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                connectNulls={false}
                isAnimationActive={false}
              >
                <LabelList dataKey="local" content={etiquetas.punto} />
              </Line>
            ) : null}
            {filtros.anio !== "Todos" ? (
              <ReferenceLine x={Number(filtros.anio)} stroke={COLORES.gris} strokeDasharray="4 4" />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Tarjeta>
  );
}

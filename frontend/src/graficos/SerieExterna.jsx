import {
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { CAUSAS_EXTERNAS } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { COLORES, decimal, ejeCerrado, marca } from "@/estilos/tema";
import { crearEtiquetas } from "@/graficos/etiquetas";

const COLORES_CAUSA = {
  Homicidios: COLORES.defunciones,
  Suicidios: "#6d28d9",
  "Accidentes de tránsito": "#c2410c",
  "Otros accidentes": COLORES.gris,
  "Otras externas": "#0f766e",
};

export function SerieExterna({ sql }) {
  const { filtros } = useFiltros();
  const { filas, cargando, error } = useConsulta(sql);
  const porAnio = new Map();
  for (const fila of filas) {
    if (!porAnio.has(fila.anio)) porAnio.set(fila.anio, { anio: fila.anio });
    porAnio.get(fila.anio)[fila.causa] = fila.tasa;
  }
  const datos = [...porAnio.values()];
  const series = CAUSAS_EXTERNAS.filter((causa) => filas.some((fila) => fila.causa === causa));
  const etiquetas = crearEtiquetas({ formato: decimal });
  const eje = ejeCerrado(Math.max(0, ...filas.map((fila) => fila.tasa || 0)));

  return (
    <Tarjeta titulo="Tasas por 100.000 habitantes" cargando={cargando} error={error} alto={360}>
      {datos.length === 0 ? (
        <Vacio>No hay causas externas para este filtro.</Vacio>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={datos} margin={{ top: 22, right: 28, left: 0, bottom: 4 }}>
            <CartesianGrid stroke={COLORES.linea} vertical={false} />
            <XAxis dataKey="anio" padding={{ left: 28, right: 20 }} />
            <YAxis {...eje} tickFormatter={marca} width={48} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(valor) => (valor == null ? "—" : decimal(valor))} />
            <Legend />
            {series.map((causa) => (
              <Line
                key={causa}
                dataKey={causa}
                stroke={COLORES_CAUSA[causa]}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                connectNulls={false}
                isAnimationActive={false}
              >
                <LabelList dataKey={causa} content={etiquetas.punto} />
              </Line>
            ))}
            {filtros.anio !== "Todos" ? (
              <ReferenceLine x={Number(filtros.anio)} stroke={COLORES.gris} strokeDasharray="4 4" />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Tarjeta>
  );
}

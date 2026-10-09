import { useMemo } from "react";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { useConsulta } from "@/datos/useConsulta";
import { corto, entero } from "@/estilos/tema";
import { Grafico } from "@/graficos/echarts/Grafico";
import { ejeCategoria, ejeValor, etiqueta, tooltip } from "@/graficos/echarts/opciones";

export function RankingTasas({
  titulo,
  sql,
  color,
  formato = entero,
  nombre = "Tasa",
  alto = 420,
  vacio = "No hay tasas para este territorio.",
}) {
  const { filas, cargando, error } = useConsulta(sql);
  const datos = useMemo(() => filas.filter((fila) => Number.isFinite(fila.valor)), [filas]);
  const altura = Math.max(alto, datos.length * 32 + 48);

  const opcion = useMemo(
    () => ({
      tooltip: tooltip(formato),
      grid: { top: 12, right: 64, bottom: 4, left: 8, containLabel: true },
      xAxis: ejeValor(Math.max(0, ...datos.map((fila) => fila.valor || 0))),
      yAxis: ejeCategoria(
        datos.map((fila) => String(fila.etiqueta)),
        {
          inverse: true,
          axisLabel: { fontSize: 12, width: 140, overflow: "truncate", formatter: (valor) => corto(valor, 24) },
        },
      ),
      series: [
        {
          id: "valor",
          name: nombre,
          type: "bar",
          data: datos.map((fila) => fila.valor),
          barMaxWidth: 14,
          itemStyle: { color, borderRadius: [0, 4, 4, 0] },
          label: etiqueta(formato, { position: "right" }),
        },
      ],
    }),
    [color, datos, formato, nombre],
  );

  return (
    <Tarjeta titulo={titulo} cargando={cargando && datos.length === 0} error={error} alto={altura}>
      {datos.length === 0 && !cargando ? (
        <Vacio>{vacio}</Vacio>
      ) : (
        <Grafico opcion={opcion} alto={altura - 28} cargando={cargando} />
      )}
    </Tarjeta>
  );
}

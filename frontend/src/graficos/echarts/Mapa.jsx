import { useMemo } from "react";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { whereTerritorio } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useDatos } from "@/datos/DatosProvider";
import { useFiltros } from "@/estado/FiltrosProvider";
import { decimal, entero } from "@/estilos/tema";
import { Grafico } from "@/graficos/echarts/Grafico";
import { datoRecuadro, recortar, RECUADRO, registrarMapa, serieMapa, tooltipMapa, useGeometria } from "@/graficos/echarts/geometria";
import { COLORES_TEMA } from "@/graficos/echarts/motor";
import { FUENTE } from "@/graficos/echarts/opciones";

function consultaTerritorio(filtros, nacional) {
  const donde = whereTerritorio(filtros, { tabla: "p" });
  if (nacional) {
    return `
      SELECT g.cod_departamento AS codigo,
             MAX(g.departamento) AS nombre,
             '' AS detalle,
             SUM(p.nacimientos)::DOUBLE AS nacimientos,
             SUM(p.defunciones)::DOUBLE AS defunciones
      FROM panorama p
      JOIN geografia g
        ON p.cod_departamento = g.cod_departamento
       AND p.cod_municipio = g.cod_municipio
      WHERE ${donde}
      GROUP BY g.cod_departamento
    `;
  }
  return `
    SELECT g.cod_municipio AS codigo,
           MAX(g.municipio) AS nombre,
           MAX(g.departamento) AS detalle,
           SUM(p.nacimientos)::DOUBLE AS nacimientos,
           SUM(p.defunciones)::DOUBLE AS defunciones
    FROM panorama p
    JOIN geografia g
      ON p.cod_departamento = g.cod_departamento
     AND p.cod_municipio = g.cod_municipio
    WHERE ${donde}
    GROUP BY g.cod_municipio
  `;
}

function rgb(hex) {
  const valor = hex.replace("#", "");
  return [0, 2, 4].map((inicio) => parseInt(valor.slice(inicio, inicio + 2), 16));
}

function mezclar(desde, hasta, peso) {
  const canales = rgb(desde).map((canal, indice) =>
    Math.round(canal + (rgb(hasta)[indice] - canal) * peso),
  );
  return `rgb(${canales.join(", ")})`;
}

function relacion(fila) {
  if (!fila || !fila.nacimientos) return null;
  return (100 * fila.defunciones) / fila.nacimientos;
}

const AMARILLO = "#F2C94C";
const TOPE_ROJO = 150;

function colorRelacion(valor) {
  if (valor == null || !Number.isFinite(valor)) return "#E2E8F0";
  if (valor <= 100) {
    const verde = 1 - Math.min(Math.max(valor, 0), 100) / 100;
    return mezclar(AMARILLO, COLORES_TEMA.nacimientos, verde);
  }
  const exceso = Math.min((valor - 100) / (TOPE_ROJO - 100), 1);
  return mezclar(AMARILLO, COLORES_TEMA.defunciones, Math.sqrt(exceso));
}

function escapar(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function htmlTooltip(fila) {
  if (!fila) return "Sin registros en el año";
  const tasa = relacion(fila);
  const lugar = fila.detalle ? `<br/>${escapar(fila.detalle)}` : "";
  const textoTasa = tasa == null ? "—" : decimal(tasa);
  return `<strong>${escapar(fila.nombre)}</strong>${lugar}<br/>Nacimientos: ${entero(fila.nacimientos)}<br/>Defunciones: ${entero(fila.defunciones)}<br/>Defunciones por 100 nacimientos: ${textoTasa}`;
}

export function Mapa() {
  const { filtros } = useFiltros();
  const { catalogos } = useDatos();
  const { capas, error: errorMapa } = useGeometria();
  const nacional = filtros.departamento === "Todos" && filtros.municipio === "Todos";
  const { filas, cargando, error } = useConsulta(consultaTerritorio(filtros, nacional));
  const coleccion = useMemo(
    () => (capas ? recortar(capas, filtros, catalogos.municipios) : null),
    [capas, catalogos.municipios, filtros],
  );
  const nombreMapa = `relacion-${filtros.departamento}-${filtros.municipio}`;

  const opcion = useMemo(() => {
    if (!coleccion || coleccion.features.length === 0) return null;
    const { geometria, insertar, islas } = registrarMapa(nombreMapa, coleccion);
    const porCodigo = new Map(filas.map((fila) => [String(fila.codigo), fila]));
    const cupo = coleccion.features.length === 1 ? 1 : 12;
    const etiquetados = new Set(
      [...filas]
        .filter((fila) => relacion(fila) != null)
        .sort((a, b) => b.nacimientos - a.nacimientos)
        .slice(0, cupo)
        .map((fila) => String(fila.codigo)),
    );
    const datos = geometria.features.map((feature) => {
      const codigo = String(feature.properties.codigo);
      if (codigo === RECUADRO) return datoRecuadro();
      const fila = porCodigo.get(codigo);
      const tasa = relacion(fila);
      const color = colorRelacion(tasa);
      return {
        name: codigo,
        value: tasa,
        label: { show: etiquetados.has(codigo) || (insertar && islas.includes(codigo)) },
        itemStyle: { areaColor: color },
        emphasis: { itemStyle: { areaColor: color }, label: { show: true } },
      };
    });
    return {
      backgroundColor: "#ffffff",
      tooltip: tooltipMapa((params) => htmlTooltip(porCodigo.get(String(params.name)))),
      series: [
        serieMapa(nombreMapa, datos, {
          emphasis: {
            label: { show: true },
            itemStyle: { borderColor: "#0f172a", borderWidth: 1.2 },
          },
          label: {
            color: "#0f172a",
            fontFamily: FUENTE,
            fontSize: 11,
            fontWeight: 700,
            textBorderColor: "#ffffff",
            textBorderWidth: 2,
            formatter: (params) => {
              const tasa = relacion(porCodigo.get(String(params.name)));
              return tasa == null ? "" : decimal(tasa);
            },
          },
          labelLayout: { hideOverlap: true },
        }),
      ],
    };
  }, [coleccion, filas, nombreMapa]);

  const fallo = error || errorMapa;
  const listo = !cargando && Boolean(coleccion) && !fallo;

  return (
    <Tarjeta titulo="Defunciones por 100 nacimientos" cargando={!listo && !fallo} error={fallo}>
      {listo && coleccion.features.length === 0 ? (
        <Vacio>Solo aplica para los departamentos seleccionados.</Vacio>
      ) : null}
      {listo && opcion ? (
        <div className="marco-mapa">
          <Grafico key={nombreMapa} opcion={opcion} cargando={cargando} />
          <div className="leyenda">
            <span>Nac {">"} Def</span>
            <span
              className="leyenda-barra"
              style={{ background: `linear-gradient(90deg, ${COLORES_TEMA.nacimientos}, ${AMARILLO})` }}
            />
            <span>100</span>
            <span
              className="leyenda-barra"
              style={{ background: `linear-gradient(90deg, ${AMARILLO}, ${COLORES_TEMA.defunciones})` }}
            />
            <span>Def {">"} Nac</span>
          </div>
        </div>
      ) : null}
    </Tarjeta>
  );
}

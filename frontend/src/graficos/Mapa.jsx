import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, useMap } from "react-leaflet";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { whereTerritorio } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useDatos } from "@/datos/DatosProvider";
import { useFiltros } from "@/estado/FiltrosProvider";
import { COLORES, decimal, entero } from "@/estilos/tema";

let geometriaPromesa;

function cargarGeometria() {
  if (!geometriaPromesa) {
    geometriaPromesa = Promise.all(
      ["departamentos", "municipios"].map(async (nombre) => {
        const respuesta = await fetch(`/mapas/${nombre}.geojson`);
        if (!respuesta.ok) throw new Error(`No se pudo leer el mapa de ${nombre}.`);
        return respuesta.json();
      }),
    ).then(([departamentos, municipios]) => ({ departamentos, municipios }));
  }
  return geometriaPromesa;
}

function useGeometria() {
  const [estado, setEstado] = useState({ capas: null, error: "" });

  useEffect(() => {
    let activo = true;
    cargarGeometria()
      .then((capas) => {
        if (activo) setEstado({ capas, error: "" });
      })
      .catch((error) => {
        if (activo) setEstado({ capas: null, error: error.message });
      });
    return () => {
      activo = false;
    };
  }, []);

  return estado;
}

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

function recortar(capas, filtros, municipios) {
  if (filtros.departamento === "Todos" && filtros.municipio === "Todos") {
    return capas.departamentos;
  }
  if (filtros.municipio !== "Todos") {
    const codigo = filtros.municipio.split("|")[1];
    return {
      type: "FeatureCollection",
      features: capas.municipios.features.filter((feature) => feature.properties.codigo === codigo),
    };
  }
  const departamento = municipios.find((fila) => fila.departamento === filtros.departamento)?.cod_departamento;
  return {
    type: "FeatureCollection",
    features: capas.municipios.features.filter((feature) => feature.properties.departamento === departamento),
  };
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

const BLANCO = "#F8FAFC";
const TOPE_ROJO = 150;

function colorRelacion(valor) {
  if (valor == null || !Number.isFinite(valor)) return "#E2E8F0";
  if (valor <= 100) {
    const verde = 1 - Math.min(Math.max(valor, 0), 100) / 100;
    return mezclar(BLANCO, COLORES.nacimientos, verde);
  }
  const exceso = Math.min((valor - 100) / (TOPE_ROJO - 100), 1);
  return mezclar(BLANCO, COLORES.defunciones, Math.sqrt(exceso));
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

function EtiquetasMapa({ coleccion, valores }) {
  const mapa = useMap();

  useEffect(() => {
    const marcas = [];
    const colocar = () => {
      marcas.forEach((marca) => marca.remove());
      marcas.length = 0;
      const candidatos = coleccion.features
        .map((feature) => {
          const fila = valores.get(String(feature.properties.codigo));
          const tasa = relacion(fila);
          if (tasa == null) return null;
          const centro = L.geoJSON(feature).getBounds().getCenter();
          if (!centro) return null;
          const punto = mapa.latLngToContainerPoint(centro);
          const texto = decimal(tasa);
          return {
            centro,
            texto,
            x: punto.x,
            y: punto.y,
            peso: fila.nacimientos,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.peso - a.peso);
      const ocupadas = [];
      const tamano = mapa.getSize();
      for (const item of candidatos) {
        const ancho = item.texto.length * 6.6 + 8;
        const alto = 14;
        if (item.x < ancho / 2 || item.y < 8 || item.x > tamano.x - ancho / 2 || item.y > tamano.y - 8) {
          continue;
        }
        const choca = ocupadas.some(
          (otra) =>
            Math.abs(otra.x - item.x) < (otra.ancho + ancho) / 2 + 8 && Math.abs(otra.y - item.y) < 18,
        );
        if (choca) continue;
        ocupadas.push({ x: item.x, y: item.y, ancho });
        const marca = L.marker(item.centro, {
          interactive: false,
          keyboard: false,
          icon: L.divIcon({
            className: "etiqueta-mapa",
            html: item.texto,
            iconSize: [ancho, alto],
            iconAnchor: [ancho / 2, alto / 2],
          }),
        });
        marca.addTo(mapa);
        marcas.push(marca);
      }
    };
    colocar();
    const marco = requestAnimationFrame(colocar);
    mapa.on("zoomend", colocar);
    return () => {
      cancelAnimationFrame(marco);
      mapa.off("zoomend", colocar);
      marcas.forEach((marca) => marca.remove());
    };
  }, [coleccion, mapa, valores]);

  return null;
}

function Ajustar({ coleccion }) {
  const mapa = useMap();

  useEffect(() => {
    const territorios = new Set(
      coleccion.features.map((feature) => feature.properties.departamento || feature.properties.codigo),
    );
    const features =
      territorios.size > 1
        ? coleccion.features.filter(
            (feature) => (feature.properties.departamento || feature.properties.codigo) !== "88",
          )
        : coleccion.features;
    if (features.length === 0) return;
    const limites = L.geoJSON({ type: "FeatureCollection", features }).getBounds();
    if (limites.isValid()) mapa.fitBounds(limites, { padding: [16, 16], maxZoom: 10 });
  }, [coleccion, mapa]);

  return null;
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
  const valores = useMemo(() => new Map(filas.map((fila) => [String(fila.codigo), fila])), [filas]);
  const fallo = error || errorMapa;
  const listo = !cargando && Boolean(coleccion) && !fallo;

  return (
    <Tarjeta
      titulo="Defunciones por 100 nacimientos"
      cargando={!listo && !fallo}
      error={fallo}
      alto={520}
    >
      {listo && coleccion.features.length === 0 ? (
        <Vacio>Solo aplica para los departamentos seleccionados.</Vacio>
      ) : null}
      {listo && coleccion.features.length > 0 ? (
        <div className="marco-mapa">
          <MapContainer
            center={[4.6, -74.1]}
            zoom={5}
            scrollWheelZoom={false}
            attributionControl={false}
            className="mapa"
          >
            <Ajustar coleccion={coleccion} />
            <EtiquetasMapa coleccion={coleccion} valores={valores} />
            <GeoJSON
              key={`${filtros.anio}|${filtros.departamento}|${filtros.municipio}|${coleccion.features.length}`}
              data={coleccion}
              style={(feature) => {
                const tasa = relacion(valores.get(String(feature.properties.codigo)));
                return {
                  color: "#ffffff",
                  weight: 0.8,
                  fillColor: colorRelacion(tasa),
                  fillOpacity: 1,
                };
              }}
              onEachFeature={(feature, capa) => {
                capa.bindTooltip(htmlTooltip(valores.get(feature.properties.codigo)), { sticky: true });
              }}
            />
          </MapContainer>
          <div className="leyenda">
            <span>nacimientos {'>'} defunciones</span>
            <span className="leyenda-barra" />
            <span>100</span>
            <span className="leyenda-barra leyenda-barra-alta" />
            <span>defunciones {'>'} nacimientos</span>
          </div>
        </div>
      ) : null}
    </Tarjeta>
  );
}

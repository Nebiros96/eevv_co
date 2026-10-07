import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, useMap } from "react-leaflet";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { useConsulta } from "@/datos/useConsulta";
import { useDatos } from "@/datos/DatosProvider";
import { useFiltros } from "@/estado/FiltrosProvider";
import { COLORES, decimal, entero } from "@/estilos/tema";

let geometriaPromesa;

function cargarGeometria() {
  if (!geometriaPromesa) {
    geometriaPromesa = Promise.all(
      ["departamentos", "municipios"].map(async (nombre) => {
        const respuesta = await fetch(`${import.meta.env.BASE_URL}mapas/${nombre}.geojson`);
        if (!respuesta.ok) throw new Error(`No se pudo leer el mapa de ${nombre}.`);
        return respuesta.json();
      }),
    ).then(([departamentos, municipios]) => ({ departamentos, municipios }));
  }
  return geometriaPromesa;
}

function recortar(capas, filtros, municipios, municipal) {
  if (filtros.municipio !== "Todos") {
    const codigo = filtros.municipio.split("|")[1];
    return {
      type: "FeatureCollection",
      features: capas.municipios.features.filter((feature) => feature.properties.codigo === codigo),
    };
  }
  if (filtros.departamento !== "Todos") {
    const departamento = municipios.find((fila) => fila.departamento === filtros.departamento)?.cod_departamento;
    return {
      type: "FeatureCollection",
      features: capas.municipios.features.filter((feature) => feature.properties.departamento === departamento),
    };
  }
  return municipal ? capas.municipios : capas.departamentos;
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

function escapar(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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

export function MapaCoropletas({
  titulo,
  sql,
  municipal = false,
  color = COLORES.nacimientos,
  formato = decimal,
  unidad = "",
  hechoEtiqueta = "Hechos",
}) {
  const { filtros } = useFiltros();
  const { catalogos } = useDatos();
  const [capas, setCapas] = useState(null);
  const [errorMapa, setErrorMapa] = useState("");
  const { filas, cargando, error } = useConsulta(sql);

  useEffect(() => {
    let activo = true;
    cargarGeometria()
      .then((datos) => {
        if (activo) setCapas(datos);
      })
      .catch((fallo) => {
        if (activo) setErrorMapa(fallo.message);
      });
    return () => {
      activo = false;
    };
  }, []);

  const coleccion = useMemo(
    () => (capas ? recortar(capas, filtros, catalogos.municipios, municipal) : null),
    [capas, catalogos.municipios, filtros, municipal],
  );
  const valores = useMemo(() => new Map(filas.map((fila) => [String(fila.codigo), fila])), [filas]);
  const extremos = useMemo(() => {
    const nums = filas.map((fila) => fila.valor).filter((valor) => Number.isFinite(valor));
    if (!nums.length) return { min: 0, max: 1 };
    return { min: Math.min(...nums), max: Math.max(...nums) };
  }, [filas]);

  function colorDe(valor) {
    if (valor == null || !Number.isFinite(valor)) return "#E2E8F0";
    const peso = (valor - extremos.min) / (extremos.max - extremos.min || 1);
    return mezclar("#F8FAFC", color, Math.sqrt(Math.min(Math.max(peso, 0), 1)));
  }

  const fallo = error || errorMapa;
  const listo = !cargando && Boolean(coleccion) && !fallo;

  return (
    <Tarjeta titulo={titulo} cargando={!listo && !fallo} error={fallo} alto={520}>
      {listo && coleccion.features.length === 0 ? <Vacio>No hay geometría para este territorio.</Vacio> : null}
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
            <GeoJSON
              key={`${sql}|${coleccion.features.length}`}
              data={coleccion}
              style={(feature) => ({
                color: "#ffffff",
                weight: municipal || filtros.departamento !== "Todos" ? 0.4 : 0.8,
                fillColor: colorDe(valores.get(String(feature.properties.codigo))?.valor),
                fillOpacity: 1,
              })}
              onEachFeature={(feature, capa) => {
                const fila = valores.get(String(feature.properties.codigo));
                const lugar = fila?.detalle ? `<br/>${escapar(fila.detalle)}` : "";
                const hechos =
                  fila && Number.isFinite(fila.hechos)
                    ? `<br/>${hechoEtiqueta}: ${entero(fila.hechos)}`
                    : "";
                const texto = fila
                  ? `<strong>${escapar(fila.nombre)}</strong>${lugar}${hechos}<br/>${unidad || "Tasa"}: ${fila.valor == null ? "—" : formato(fila.valor)}`
                  : "Sin tasa";
                capa.bindTooltip(texto, { sticky: true });
              }}
            />
          </MapContainer>
          <div className="leyenda">
            <span>{leyendaTexto(extremos.min, formato)} </span>
            <span className="leyenda-barra" style={{ background: `linear-gradient(90deg, #f8fafc, ${color})` }} />
            <span>{leyendaTexto(extremos.max, formato)}</span>
          </div>
        </div>
      ) : null}
    </Tarjeta>
  );
}

function leyendaTexto(valor, formato) {
  return Number.isFinite(valor) ? formato(valor) : "—";
}

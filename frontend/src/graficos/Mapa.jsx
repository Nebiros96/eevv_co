import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { whereTerritorio } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { COLORES, entero } from "@/estilos/tema";

export function Mapa() {
  const { filtros } = useFiltros();
  const { filas, cargando, error } = useConsulta(`
    SELECT g.municipio,
           g.departamento,
           g.latitud,
           g.longitud,
           SUM(p.defunciones)::DOUBLE AS defunciones,
           SUM(p.nacimientos)::DOUBLE AS nacimientos
    FROM panorama p
    JOIN geografia g
      ON p.cod_departamento = g.cod_departamento
     AND p.cod_municipio = g.cod_municipio
    WHERE ${whereTerritorio(filtros)}
      AND g.latitud IS NOT NULL
    GROUP BY 1, 2, 3, 4
  `);
  const maximo = filas.reduce((mayor, fila) => Math.max(mayor, fila.defunciones), 0);

  return (
    <Tarjeta titulo="Defunciones por municipio de residencia" cargando={cargando} error={error} alto={520}>
      {filas.length === 0 ? (
        <Vacio>No hay coordenadas para este territorio.</Vacio>
      ) : (
        <MapContainer center={[4.6, -74.1]} zoom={5} scrollWheelZoom={false} className="mapa">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Encuadrar puntos={filas} />
          {filas.map((fila) => (
            <CircleMarker
              key={`${fila.departamento}-${fila.municipio}`}
              center={[fila.latitud, fila.longitud]}
              radius={4 + Math.sqrt(fila.defunciones / Math.max(maximo, 1)) * 18}
              pathOptions={{ color: COLORES.defunciones, fillColor: COLORES.defunciones, fillOpacity: 0.55, weight: 1 }}
            >
              <Tooltip>
                <strong>{fila.municipio}</strong>
                <br />
                {fila.departamento}
                <br />
                Defunciones: {entero(fila.defunciones)}
                <br />
                Nacimientos: {entero(fila.nacimientos)}
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      )}
    </Tarjeta>
  );
}

function Encuadrar({ puntos }) {
  const mapa = useMap();
  useEffect(() => {
    if (puntos.length === 0) return;
    const limites = puntos.map((fila) => [fila.latitud, fila.longitud]);
    mapa.fitBounds(limites, { padding: [24, 24], maxZoom: 9 });
  }, [mapa, puntos]);
  return null;
}

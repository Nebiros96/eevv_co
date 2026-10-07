# Estadísticas vitales de Colombia (EEVV)

Dashboard estático de nacimientos y defunciones en Colombia a partir de las estadísticas vitales del DANE. Consulta Parquet en el navegador con DuckDB WASM: no hay backend en producción.

Sitio publicado: [https://estadisticasvitales.github.io/](https://estadisticasvitales.github.io/)

## Qué muestra

- **Panorama:** nacimientos, defunciones y su relación; mapa departamental o municipal; series y rankings.
- **Defunciones:** pirámide por edad y sexo, causas principales y comparaciones territoriales.

Los filtros cubren año, departamento, municipio y causa.

## Stack

| Capa | Tecnología |
| --- | --- |
| Interfaz | React 19 + Vite |
| Consultas | DuckDB WASM sobre Parquet |
| Gráficos | Recharts |
| Mapa | Leaflet / React Leaflet |

El frontend vive en `frontend/`. Los cortes analíticos están en `datos/` (`panorama.parquet`, `causas.parquet`, `geografia.parquet`). Los GeoJSON del mapa están en `frontend/public/mapas/`.

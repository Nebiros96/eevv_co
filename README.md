# Estadísticas vitales de Colombia (EEVV)

Dashboard estático de nacimientos y defunciones en Colombia a partir de las estadísticas vitales del DANE. Consulta Parquet en el navegador con DuckDB WASM: no hay backend en producción.

Sitio publicado: [https://estadisticasvitales.github.io/](https://estadisticasvitales.github.io/)

## Qué muestra

- **Panorama:** conteos, tasas brutas por 1.000 habitantes, relación nacimientos-defunciones, mapa y rankings.
- **Nacimientos:** fecundidad por edad, tasa global, fecundidad adolescente, y la caída desde 2019 por edad de la madre, educación y régimen.
- **Defunciones:** causas, mortalidad específica y estandarizada, y causas externas por 100.000 con mapa municipal.

Los filtros cubren año, departamento, municipio y causa.

## Stack

| Capa | Tecnología |
| --- | --- |
| Interfaz | React 19 + Vite |
| Consultas | DuckDB WASM sobre Parquet |
| Gráficos | Recharts |
| Mapa | Leaflet / React Leaflet |

El frontend vive en `frontend/`. Los cortes analíticos están en `datos/` (`panorama.parquet`, `causas.parquet`, `geografia.parquet`). Los GeoJSON del mapa están en `frontend/public/mapas/`.

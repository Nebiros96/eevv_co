# Estadísticas vitales de Colombia (EEVV)

Dashboard estático de nacimientos y defunciones en Colombia a partir de las estadísticas vitales del DANE. Consulta Parquet en el navegador con DuckDB WASM: no hay backend en producción.

Sitio publicado: [https://estadisticasvitales.github.io/](https://estadisticasvitales.github.io/)

## Qué muestra

- **Panorama:** conteos, tasas brutas por 1.000 habitantes, relación nacimientos-defunciones, mapa y rankings.
- **Nacimientos:** fecundidad por edad, tasa global y fecundidad adolescente (Fecundidad), y la caída de la natalidad desde 2019 por edad de la madre, educación y régimen (Natalidad).
- **Defunciones:** causas, mortalidad específica y estandarizada, y causas externas por 100.000 con mapa municipal.

Los filtros cubren año, departamento, municipio y causa.

## Stack

| Capa | Tecnología |
| --- | --- |
| Interfaz | React 19 + Vite |
| Consultas | DuckDB WASM sobre Parquet |
| Gráficos | Apache ECharts (tema macarons) |
| Mapa | Apache ECharts |

El frontend vive en `frontend/`. Los gráficos y los mapas están en `frontend/src/graficos/echarts/`: `motor.js` registra los módulos de ECharts y el tema, `Grafico.jsx` es el contenedor común y `opciones.js` reúne ejes, etiquetas y tooltips compartidos. Los cortes analíticos están en `datos/` (`panorama.parquet`, `causas.parquet`, `geografia.parquet`). Los GeoJSON del mapa están en `frontend/public/mapas/`.

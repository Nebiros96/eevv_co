import { FilaIndicadores, Indicador } from "@/componentes/Indicadores";
import { literal, whereTerritorio } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { corto, decimal, entero } from "@/estilos/tema";
import { BarrasCausas } from "@/graficos/BarrasCausas";
import { Piramide } from "@/graficos/Piramide";
import { TendenciaSexo } from "@/graficos/TendenciaSexo";
import { TerritoriosCausa } from "@/graficos/TerritoriosCausa";

export function Defunciones() {
  const { filtros } = useFiltros();
  const { filas } = useConsulta(`
    WITH base AS (
      SELECT * FROM causas WHERE ${whereTerritorio(filtros)}
    ),
    filtrada AS (
      SELECT * FROM base
      ${filtros.causa === "Todas" ? "" : `WHERE cod_causa = ${literal(filtros.causa)}`}
    )
    SELECT
      (SELECT COALESCE(SUM(defunciones), 0)::DOUBLE FROM filtrada) AS parte,
      (SELECT COALESCE(SUM(defunciones), 0)::DOUBLE FROM base) AS total,
      (SELECT COALESCE(SUM(CASE WHEN sexo = 'Hombres' THEN defunciones ELSE 0 END), 0)::DOUBLE FROM filtrada) AS hombres,
      (
        SELECT causa FROM (
          SELECT causa, SUM(defunciones) AS defunciones
          FROM filtrada
          GROUP BY causa
          ORDER BY defunciones DESC
          LIMIT 1
        )
      ) AS causa_lider
  `);
  const resumen = filas[0] ?? { parte: 0, total: 0, hombres: 0, causa_lider: "—" };
  const participacion = resumen.total ? (100 * resumen.parte) / resumen.total : null;
  const hombres = resumen.parte ? (100 * resumen.hombres) / resumen.parte : null;

  return (
    <>
      <FilaIndicadores>
        <Indicador titulo="Defunciones" valor={entero(resumen.parte)} tono="defunciones" />
        <Indicador
          titulo="Participación"
          valor={participacion === null ? "—" : `${decimal(participacion)}%`}
          tono="relacion"
        />
        <Indicador titulo="Causa con más defunciones" valor={corto(resumen.causa_lider ?? "—")} tono="diferencia" />
        <Indicador titulo="Hombres" valor={hombres === null ? "—" : `${decimal(hombres)}%`} tono="hombres" />
      </FilaIndicadores>
      <div className="rejilla">
        <BarrasCausas />
        <Piramide />
      </div>
      <div className="rejilla">
        <TendenciaSexo />
        <TerritoriosCausa />
      </div>
    </>
  );
}

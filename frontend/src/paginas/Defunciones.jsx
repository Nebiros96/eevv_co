import { FilaIndicadores, Indicador } from "@/componentes/Indicadores";
import { literal, whereTerritorio } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { decimal, entero } from "@/estilos/tema";
import { BarrasCausas } from "@/graficos/BarrasCausas";
import { Piramide } from "@/graficos/Piramide";
import { TendenciaSexo } from "@/graficos/TendenciaSexo";
import { TerritoriosCausa } from "@/graficos/TerritoriosCausa";

function medidaCausa(texto) {
  const largo = String(texto ?? "").length;
  if (largo <= 24) return "1.22rem";
  if (largo <= 40) return "1.02rem";
  if (largo <= 58) return "0.9rem";
  if (largo <= 78) return "0.82rem";
  return "0.76rem";
}

function compararSexo(hombres, mujeres) {
  const total = hombres + mujeres;
  if (!total) return null;
  const hombresRedondeado = Math.round((1000 * hombres) / total) / 10;
  const mujeresRedondeado = Math.round((100 - hombresRedondeado) * 10) / 10;
  return { hombres: decimal(hombresRedondeado), mujeres: decimal(mujeresRedondeado) };
}

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
      (SELECT COALESCE(SUM(CASE WHEN sexo = 'Mujeres' THEN defunciones ELSE 0 END), 0)::DOUBLE FROM filtrada) AS mujeres,
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
  const resumen = filas[0] ?? { parte: 0, total: 0, hombres: 0, mujeres: 0, causa_lider: "—" };
  const participacion = resumen.total ? (100 * resumen.parte) / resumen.total : null;
  const comparativa = compararSexo(resumen.hombres, resumen.mujeres);
  const causa = resumen.causa_lider ?? "—";

  return (
    <>
      <FilaIndicadores>
        <Indicador titulo="Defunciones" valor={entero(resumen.parte)} tono="defunciones" />
        <Indicador
          titulo="Participación"
          valor={participacion === null ? "—" : `${decimal(participacion)}%`}
          tono="relacion"
        />
        <Indicador
          titulo="Causa con más defunciones"
          clase="indicador-causa"
          tono="diferencia"
          estilo={{ "--medida-causa": medidaCausa(causa) }}
          valor={causa}
        />
        <Indicador
          titulo="Sexo"
          clase="indicador-comparativa"
          tono="hombres"
          valor={
            comparativa === null ? (
              "—"
            ) : (
              <>
                <span className="lado-sexo" title="Hombres">
                  <span className="icono-sexo" aria-hidden="true">👨</span>
                  <span className="solo-lectura">Hombres</span>
                  {comparativa.hombres}%
                </span>
                <span className="lado-sexo" title="Mujeres">
                  <span className="icono-sexo" aria-hidden="true">👩</span>
                  <span className="solo-lectura">Mujeres</span>
                  {comparativa.mujeres}%
                </span>
              </>
            )
          }
        />
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

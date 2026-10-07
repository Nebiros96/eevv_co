import { FilaIndicadores, Indicador } from "@/componentes/Indicadores";
import { literal, sqlMapaTasa, sqlRankingTasa, sqlSerieExterna, whereTerritorio } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { COLORES, decimal } from "@/estilos/tema";
import { MapaCoropletas } from "@/graficos/MapaCoropletas";
import { RankingTasas } from "@/graficos/RankingTasas";
import { SerieExterna } from "@/graficos/SerieExterna";

function extraCausa(filtros) {
  if (!filtros.externa || filtros.externa === "Todas") return "TRUE";
  return `causa = ${literal(filtros.externa)}`;
}

export function CausasExternas() {
  const { filtros } = useFiltros();
  const territorio = whereTerritorio(filtros);
  const { filas } = useConsulta(`
    WITH def AS (
      SELECT causa, SUM(defunciones)::DOUBLE AS defunciones
      FROM externas
      WHERE ${territorio}
      GROUP BY 1
    ),
    pob AS (
      SELECT SUM(poblacion)::DOUBLE AS poblacion
      FROM poblacion
      WHERE ${territorio}
    )
    SELECT d.causa, d.defunciones, p.poblacion,
           100000 * d.defunciones / NULLIF(p.poblacion, 0) AS tasa
    FROM def d
    CROSS JOIN pob p
  `);
  const tasaDe = (causa) => filas.find((fila) => fila.causa === causa)?.tasa ?? null;
  const extra = extraCausa(filtros);
  const mapaSql = sqlMapaTasa(filtros, {
    tabla: "externas",
    numerador: "defunciones",
    escala: 100000,
    municipal: true,
    extra,
  });

  return (
    <>
      <p className="intro-pagina">
        Homicidios, suicidios y accidentes por 100.000 habitantes. El mapa municipal evita que el volumen
        de las ciudades grandes oculte tasas altas en municipios pequeños.
      </p>
      <FilaIndicadores>
        <Indicador
          titulo="Homicidios"
          valor={tasaDe("Homicidios") == null ? "—" : decimal(tasaDe("Homicidios"))}
          tono="defunciones"
        />
        <Indicador
          titulo="Suicidios"
          valor={tasaDe("Suicidios") == null ? "—" : decimal(tasaDe("Suicidios"))}
          tono="hombres"
        />
        <Indicador
          titulo="Accidentes de tránsito"
          valor={tasaDe("Accidentes de tránsito") == null ? "—" : decimal(tasaDe("Accidentes de tránsito"))}
          tono="relacion"
        />
        <Indicador
          titulo="Otros accidentes"
          valor={tasaDe("Otros accidentes") == null ? "—" : decimal(tasaDe("Otros accidentes"))}
          tono="diferencia"
        />
      </FilaIndicadores>
      <SerieExterna sql={sqlSerieExterna(filtros)} />
      <RankingTasas
        titulo="Territorios con la tasa más alta"
        sql={sqlRankingTasa(filtros, {
          tabla: "externas",
          numerador: "defunciones",
          escala: 100000,
          extra,
          municipal: true,
        })}
        color={COLORES.defunciones}
        formato={decimal}
        nombre="Por 100.000"
      />
      <MapaCoropletas
        titulo={
          filtros.externa === "Todas" ? "Causas externas por 100.000" : `${filtros.externa} por 100.000`
        }
        sql={mapaSql}
        municipal
        color={COLORES.defunciones}
        formato={decimal}
        unidad="Por 100.000"
        hechoEtiqueta="Defunciones"
      />
    </>
  );
}

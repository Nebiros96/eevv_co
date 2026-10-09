import { FilaIndicadores, Indicador } from "@/componentes/Indicadores";
import {
  sqlMapaEstandar,
  sqlMortalidadEdad,
  sqlMortalidadEstandar,
  sqlRankingEstandar,
  sqlSerieTasas,
  sqlTasasVitales,
} from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { decimal } from "@/estilos/tema";
import { COLORES_TEMA, ESCALA_RIESGO } from "@/graficos/echarts/motor";
import { PiramideTasas } from "@/graficos/echarts/PiramideTasas";
import { RankingTasas } from "@/graficos/echarts/RankingTasas";
import { SerieTasas } from "@/graficos/echarts/SerieTasas";
import { MapaCoropletas } from "@/graficos/echarts/MapaCoropletas";

export function Mortalidad() {
  const { filtros } = useFiltros();
  const { filas: vitales } = useConsulta(sqlTasasVitales(filtros));
  const { filas: estandar } = useConsulta(sqlMortalidadEstandar(filtros));
  const poblacion = vitales[0]?.poblacion ?? 0;
  const defunciones = vitales[0]?.defunciones ?? 0;
  const tbm = poblacion ? (1000 * defunciones) / poblacion : null;
  const asr = estandar[0]?.tasa_estandar ?? null;

  return (
    <>
      <p className="intro-pagina">
        La mortalidad estandarizada usa la estructura de edad de Colombia en 2019, para comparar
        territorios sin que el envejecimiento distorsione el resultado.
      </p>
      <FilaIndicadores>
        <Indicador titulo="Tasa bruta por 1.000" valor={tbm == null ? "—" : decimal(tbm)} tono="defunciones" />
        <Indicador
          titulo="Mortalidad estandarizada"
          valor={asr == null ? "—" : decimal(asr)}
          tono="relacion"
        />
      </FilaIndicadores>
      <SerieTasas sql={sqlSerieTasas(filtros)} natalidad={false} />
      <div className="rejilla">
        <PiramideTasas sql={sqlMortalidadEdad(filtros)} />
        <RankingTasas
          titulo="Mortalidad estandarizada más alta"
          sql={sqlRankingEstandar(filtros)}
          color={COLORES_TEMA.defunciones}
          formato={decimal}
          nombre="Por 1.000"
        />
      </div>
      <MapaCoropletas
        titulo="Mortalidad estandarizada por edad"
        sql={sqlMapaEstandar(filtros)}
        colores={ESCALA_RIESGO}
        formato={decimal}
        unidad="Por 1.000 (estándar 2019)"
      />
    </>
  );
}

import { FilaIndicadores, Indicador } from "@/componentes/Indicadores";
import {
  GRUPOS_TGF,
  sqlFecundidadEdad,
  sqlMapaTgf,
  sqlRankingTgf,
  sqlSerieFecundidad,
} from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { COLORES, decimal, decimal2, PUNTO_MEDIO_MADRE } from "@/estilos/tema";
import { BarrasFecundidad } from "@/graficos/BarrasFecundidad";
import { MapaCoropletas } from "@/graficos/MapaCoropletas";
import { RankingTasas } from "@/graficos/RankingTasas";
import { SerieTgf } from "@/graficos/SerieTgf";

export function Fecundidad() {
  const { filtros } = useFiltros();
  const { filas } = useConsulta(sqlFecundidadEdad(filtros));
  const tgf = GRUPOS_TGF.reduce((suma, grupo) => {
    const fila = filas.find((item) => item.grupo_edad_madre === grupo);
    return suma + (fila?.tasa ?? 0) / 1000;
  }, 0) * 5;
  const adoles10 = filas.find((fila) => fila.grupo_edad_madre === "10-14")?.tasa ?? null;
  const adoles15 = filas.find((fila) => fila.grupo_edad_madre === "15-19")?.tasa ?? null;
  const nacimientos = filas.reduce((suma, fila) => suma + (fila.nacimientos || 0), 0);
  const edadMedia = nacimientos
    ? filas.reduce((suma, fila) => suma + (PUNTO_MEDIO_MADRE[fila.grupo_edad_madre] || 0) * fila.nacimientos, 0) /
      nacimientos
    : null;

  return (
    <>
      <p className="intro-pagina">
        Tasas por 1.000 mujeres de cada edad, con las proyecciones municipales del DANE. La tasa global de
        fecundidad suma los grupos de 15 a 49 años.
      </p>
      <FilaIndicadores>
        <Indicador titulo="Tasa global de fecundidad (TGF)" valor={tgf ? decimal2(tgf) : "—"} tono="nacimientos" />
        <Indicador
          titulo="Fecundidad 15-19"
          valor={adoles15 == null ? "—" : decimal(adoles15)}
          tono="relacion"
        />
        <Indicador
          titulo="Fecundidad 10-14"
          valor={adoles10 == null ? "—" : decimal(adoles10)}
          tono="diferencia"
        />
        <Indicador
          titulo="Edad promedio de la madre al dar a luz"
          valor={edadMedia == null ? "—" : decimal(edadMedia)}
          tono="hombres"
        />
      </FilaIndicadores>
      <BarrasFecundidad sql={sqlFecundidadEdad(filtros)} />
      <div className="rejilla">
        <SerieTgf sql={sqlSerieFecundidad(filtros)} />
        <RankingTasas
          titulo="Territorios con mayor TGF"
          sql={sqlRankingTgf(filtros)}
          color={COLORES.mujeres}
          formato={decimal2}
          nombre="Hijos por mujer"
        />
      </div>
      <MapaCoropletas
        titulo="Tasa global de fecundidad (TGF)"
        sql={sqlMapaTgf(filtros)}
        color={COLORES.mujeres}
        formato={decimal2}
        unidad="Hijos por mujer"
        hechoEtiqueta="Nacimientos de madres 15-49"
      />
    </>
  );
}

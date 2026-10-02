import { FilaIndicadores, Indicador } from "@/componentes/Indicadores";
import { whereTerritorio } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { decimal, entero } from "@/estilos/tema";
import { ComparacionSexo } from "@/graficos/ComparacionSexo";
import { Mapa } from "@/graficos/Mapa";
import { Ranking } from "@/graficos/Ranking";
import { SerieAnual } from "@/graficos/SerieAnual";

export function Panorama() {
  const { filtros } = useFiltros();
  const { filas } = useConsulta(`
    SELECT SUM(nacimientos)::DOUBLE AS nacimientos,
           SUM(defunciones)::DOUBLE AS defunciones
    FROM panorama
    WHERE ${whereTerritorio(filtros)}
  `);
  const nacimientos = filas[0]?.nacimientos ?? 0;
  const defunciones = filas[0]?.defunciones ?? 0;
  const diferencia = nacimientos - defunciones;

  return (
    <>
      <FilaIndicadores>
        <Indicador titulo="Nacimientos" valor={entero(nacimientos)} tono="nacimientos" />
        <Indicador titulo="Defunciones" valor={entero(defunciones)} tono="defunciones" />
        <Indicador
          titulo="Defunciones por 100 nacimientos"
          valor={nacimientos === 0 ? "—" : decimal((100 * defunciones) / nacimientos)}
          tono="relacion"
        />
        <Indicador
          titulo="Diferencia poblacional"
          valor={entero(diferencia)}
          tono="diferencia"
        />
      </FilaIndicadores>
      <SerieAnual />
      <div className="rejilla">
        <Ranking />
        <ComparacionSexo />
      </div>
      <Mapa />
    </>
  );
}

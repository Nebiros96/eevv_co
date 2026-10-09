import { whereCausas } from "@/datos/consultas";
import { useFiltros } from "@/estado/FiltrosProvider";
import { entero } from "@/estilos/tema";
import { COLORES_TEMA } from "@/graficos/echarts/motor";
import { RankingTasas } from "@/graficos/echarts/RankingTasas";

export function TerritoriosCausa() {
  const { filtros } = useFiltros();
  const columna =
    filtros.departamento !== "Todos" || filtros.municipio !== "Todos" ? "municipio" : "departamento";
  return (
    <RankingTasas
      titulo="Defunciones por entidad territorial"
      sql={`
        SELECT ${columna} AS etiqueta, SUM(defunciones)::DOUBLE AS valor
        FROM causas
        WHERE ${whereCausas(filtros)}
        GROUP BY 1
        ORDER BY valor DESC
        LIMIT 12
      `}
      color={COLORES_TEMA.defunciones}
      formato={entero}
      nombre="Defunciones"
      alto={400}
      vacio="No hay territorios para esta causa."
    />
  );
}

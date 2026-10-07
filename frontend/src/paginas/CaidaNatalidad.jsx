import { FilaIndicadores, Indicador } from "@/componentes/Indicadores";
import { anioComparacion, sqlFecundidadAnualEdad, sqlPerfilEdadMadre, sqlPerfilNatalidad, whereTerritorio } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useDatos } from "@/datos/DatosProvider";
import { useFiltros } from "@/estado/FiltrosProvider";
import { COLORES, decimal, entero, ORDEN_MADRE, PUNTO_MEDIO_MADRE } from "@/estilos/tema";
import { EdadMadre } from "@/graficos/EdadMadre";
import { PerfilNatalidad } from "@/graficos/PerfilNatalidad";

const BASE = 2019;

function edadPromedio(filas, anio) {
  const parte = filas.filter((fila) => fila.anio === anio);
  const total = parte.reduce((suma, fila) => suma + fila.nacimientos, 0);
  if (!total) return null;
  return parte.reduce((suma, fila) => suma + (PUNTO_MEDIO_MADRE[fila.grupo_edad_madre] || 0) * fila.nacimientos, 0) / total;
}

export function CaidaNatalidad() {
  const { filtros } = useFiltros();
  const { catalogos } = useDatos();
  const actual = anioComparacion(filtros, catalogos.anios);
  const territorio = whereTerritorio(filtros, { anio: false });
  const { filas: totales } = useConsulta(`
    SELECT anio, SUM(nacimientos)::DOUBLE AS nacimientos
    FROM panorama
    WHERE ${territorio} AND anio IN (${BASE}, ${actual})
    GROUP BY 1
  `);
  const { filas: edades } = useConsulta(sqlFecundidadAnualEdad(filtros));
  const nacBase = totales.find((fila) => fila.anio === BASE)?.nacimientos ?? 0;
  const nacActual = totales.find((fila) => fila.anio === actual)?.nacimientos ?? 0;
  const caida = nacBase ? (100 * (nacActual - nacBase)) / nacBase : null;
  const edadBase = edadPromedio(edades, BASE);
  const edadActual = edadPromedio(edades, actual);

  return (
    <>
      <p className="intro-pagina">
        Los nacimientos pasaron de 642.660 en 2019 a 441.537 en 2025 a nivel nacional. La caída no es
        igual en todos los grupos de edad de la madre, ni por nivel educativo o régimen de salud.
      </p>
      <FilaIndicadores>
        <Indicador titulo={`Nacimientos ${BASE}`} valor={entero(nacBase)} tono="diferencia" />
        <Indicador titulo={`Nacimientos ${actual}`} valor={entero(nacActual)} tono="nacimientos" />
        <Indicador
          titulo="Variación"
          valor={caida == null ? "—" : `${decimal(caida)}%`}
          tono="relacion"
        />
        <Indicador
          titulo="Edad promedio al nacer"
          valor={
            edadActual == null
              ? "—"
              : `${decimal(edadActual)}${edadBase == null ? "" : ` (${edadBase > edadActual ? "−" : "+"}${decimal(Math.abs(edadActual - edadBase))})`}`
          }
          tono="hombres"
        />
      </FilaIndicadores>
      <EdadMadre filas={edades} anioBase={BASE} anioActual={actual} />
      <div className="rejilla">
        <PerfilNatalidad
          titulo="Variación por grupo etario de la madre"
          sql={sqlPerfilEdadMadre(filtros, BASE, actual)}
          orden={ORDEN_MADRE}
        />
        <PerfilNatalidad
          titulo="Variación por régimen de salud"
          sql={sqlPerfilNatalidad(filtros, "regimen", BASE, actual)}
          color={COLORES.hombres}
        />
      </div>
      <PerfilNatalidad
        titulo="Variación por nivel educativo de la madre"
        sql={sqlPerfilNatalidad(filtros, "educacion", BASE, actual)}
        color={COLORES.mujeres}
      />
    </>
  );
}

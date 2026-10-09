import { useMemo } from "react";
import { Tarjeta, Vacio } from "@/componentes/Tarjeta";
import { whereCausas } from "@/datos/consultas";
import { useConsulta } from "@/datos/useConsulta";
import { useFiltros } from "@/estado/FiltrosProvider";
import { entero, ORDEN_EDAD } from "@/estilos/tema";
import { Grafico } from "@/graficos/echarts/Grafico";
import { opcionPiramide } from "@/graficos/echarts/opcionesPiramide";

export function Piramide() {
  const { filtros } = useFiltros();
  const { filas, cargando, error } = useConsulta(`
    SELECT grupo_edad, sexo, SUM(defunciones)::DOUBLE AS defunciones
    FROM causas
    WHERE ${whereCausas(filtros)}
      AND sexo IN ('Hombres', 'Mujeres')
    GROUP BY 1, 2
  `);

  const datos = useMemo(() => {
    const edades = [...ORDEN_EDAD.filter((edad) => edad !== "Edad desconocida")].reverse();
    if (filas.some((fila) => fila.grupo_edad === "Edad desconocida")) edades.push("Edad desconocida");
    return edades
      .map((edad) => {
        const hombres = filas.find((fila) => fila.grupo_edad === edad && fila.sexo === "Hombres");
        const mujeres = filas.find((fila) => fila.grupo_edad === edad && fila.sexo === "Mujeres");
        return { edad, hombres: -(hombres?.defunciones ?? 0), mujeres: mujeres?.defunciones ?? 0 };
      })
      .filter((fila) => fila.hombres !== 0 || fila.mujeres !== 0)
      .reverse();
  }, [filas]);

  const opcion = useMemo(() => opcionPiramide(datos, entero), [datos]);

  return (
    <Tarjeta
      titulo="Defunciones por grupo etario y sexo"
      cargando={cargando && filas.length === 0}
      error={error}
      alto={460}
    >
      {datos.length === 0 && !cargando ? (
        <Vacio>No hay edad y sexo para este filtro.</Vacio>
      ) : (
        <Grafico opcion={opcion} alto={450} cargando={cargando} />
      )}
    </Tarjeta>
  );
}

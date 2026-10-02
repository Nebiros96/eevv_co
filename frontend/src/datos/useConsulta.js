import { useEffect, useState } from "react";
import { useDatos } from "@/datos/DatosProvider";

export function useConsulta(sql) {
  const { consultar, listo } = useDatos();
  const [estado, setEstado] = useState({ filas: [], cargando: true, error: "" });

  useEffect(() => {
    if (!listo || !sql || !consultar) return undefined;
    let activo = true;
    setEstado((actual) => ({ ...actual, cargando: true, error: "" }));
    consultar(sql)
      .then((filas) => {
        if (activo) setEstado({ filas, cargando: false, error: "" });
      })
      .catch((error) => {
        if (activo) setEstado({ filas: [], cargando: false, error: error.message });
      });
    return () => {
      activo = false;
    };
  }, [consultar, listo, sql]);

  return estado;
}

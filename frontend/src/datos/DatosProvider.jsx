import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { cargarCatalogos } from "@/datos/consultas";
import { obtenerBase } from "@/datos/conexion";

const DatosContext = createContext(null);

export function DatosProvider({ children }) {
  const [estado, setEstado] = useState({
    listo: false,
    error: "",
    catalogos: null,
    consultar: null,
  });

  useEffect(() => {
    let activo = true;
    obtenerBase()
      .then(async ({ consultar }) => {
        const catalogos = await cargarCatalogos(consultar);
        if (!activo) return;
        setEstado({ listo: true, error: "", catalogos, consultar });
      })
      .catch((error) => {
        if (!activo) return;
        setEstado({
          listo: false,
          error: error.message || "No se pudieron abrir los datos.",
          catalogos: null,
          consultar: null,
        });
      });
    return () => {
      activo = false;
    };
  }, []);

  const valor = useMemo(() => estado, [estado]);
  return <DatosContext.Provider value={valor}>{children}</DatosContext.Provider>;
}

export function useDatos() {
  const contexto = useContext(DatosContext);
  if (!contexto) throw new Error("useDatos debe usarse dentro de DatosProvider");
  return contexto;
}

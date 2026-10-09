import { DatosProvider, useDatos } from "@/datos/DatosProvider";
import { Disposicion } from "@/componentes/Disposicion";
import { FiltrosProvider, useFiltros } from "@/estado/FiltrosProvider";

function Contenido() {
  const { listo, error } = useDatos();
  const { listos } = useFiltros();

  if (error) return <p className="estado-pagina">{error}</p>;
  if (!listo || !listos) return <p className="estado-pagina">Cargando los datos… (puede tomar unos segundos)</p>;
  return <Disposicion />;
}

export function App() {
  return (
    <DatosProvider>
      <FiltrosProvider>
        <Contenido />
      </FiltrosProvider>
    </DatosProvider>
  );
}

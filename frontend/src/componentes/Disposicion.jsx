import { useState } from "react";
import { BarraLateral } from "@/componentes/BarraLateral";
import { Defunciones } from "@/paginas/Defunciones";
import { Panorama } from "@/paginas/Panorama";

const PAGINAS = [
  { id: "panorama", titulo: "Panorama" },
  { id: "defunciones", titulo: "Defunciones" },
];

export function Disposicion() {
  const [pagina, setPagina] = useState("panorama");

  return (
    <div className="app">
      <header className="encabezado">
        <div>
          <h1>Estadísticas vitales: nacimientos y defunciones</h1>
          <p>Nacimientos y defunciones en Colombia registradas por el Departamento Administrativo Nacional de Estadística (DANE)</p>
        </div>
        <nav>
          {PAGINAS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={pagina === item.id ? "activo" : ""}
              onClick={() => setPagina(item.id)}
            >
              {item.titulo}
            </button>
          ))}
        </nav>
      </header>
      <BarraLateral pagina={pagina} />
      <main className="contenido">{pagina === "panorama" ? <Panorama /> : <Defunciones />}</main>
    </div>
  );
}

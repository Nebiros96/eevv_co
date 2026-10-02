import { useMemo, useState } from "react";
import { useDatos } from "@/datos/DatosProvider";
import { useFiltros } from "@/estado/FiltrosProvider";

export function BarraLateral() {
  const { catalogos } = useDatos();
  const { filtros, actualizar } = useFiltros();
  const [buscaMunicipio, setBuscaMunicipio] = useState("");
  const [buscaCausa, setBuscaCausa] = useState("");

  const municipios = useMemo(() => {
    const texto = buscaMunicipio.trim().toLocaleLowerCase("es");
    return catalogos.municipios.filter((fila) => {
      const mismoDepartamento =
        filtros.departamento === "Todos" || fila.departamento === filtros.departamento;
      if (!mismoDepartamento) return false;
      if (!texto) return true;
      const etiqueta = `${fila.municipio} ${fila.departamento}`.toLocaleLowerCase("es");
      return etiqueta.includes(texto);
    });
  }, [buscaMunicipio, catalogos.municipios, filtros.departamento]);

  const causas = useMemo(() => {
    const texto = buscaCausa.trim().toLocaleLowerCase("es");
    if (!texto) return catalogos.causas;
    return catalogos.causas.filter((fila) => fila.causa.toLocaleLowerCase("es").includes(texto));
  }, [buscaCausa, catalogos.causas]);

  return (
    <aside className="barra">
      <p className="nota">
        Territorio de residencia. La causa solo cambia la página Defunciones. Las series anuales
        conservan todos los años del territorio.
      </p>
      <label>
        Año
        <select value={filtros.anio} onChange={(evento) => actualizar("anio", evento.target.value)}>
          <option value="Todos">Todos</option>
          {catalogos.anios.map((anio) => (
            <option key={anio} value={String(anio)}>
              {anio}
            </option>
          ))}
        </select>
      </label>
      <label>
        Departamento
        <select
          value={filtros.departamento}
          onChange={(evento) => actualizar("departamento", evento.target.value)}
        >
          <option value="Todos">Todos</option>
          {catalogos.departamentos.map((nombre) => (
            <option key={nombre} value={nombre}>
              {nombre}
            </option>
          ))}
        </select>
      </label>
      <label>
        Municipio
        <input
          value={buscaMunicipio}
          placeholder="Buscar municipio"
          onChange={(evento) => setBuscaMunicipio(evento.target.value)}
        />
        <select
          value={filtros.municipio}
          onChange={(evento) => actualizar("municipio", evento.target.value)}
        >
          <option value="Todos">Todos</option>
          {municipios.map((fila) => {
            const clave = `${fila.cod_departamento}|${fila.cod_municipio}`;
            const etiqueta =
              filtros.departamento === "Todos"
                ? `${fila.municipio} · ${fila.departamento}`
                : fila.municipio;
            return (
              <option key={clave} value={clave}>
                {etiqueta}
              </option>
            );
          })}
        </select>
      </label>
      <label>
        Causa de defunción
        <input
          value={buscaCausa}
          placeholder="Buscar causa"
          onChange={(evento) => setBuscaCausa(evento.target.value)}
        />
        <select value={filtros.causa} onChange={(evento) => actualizar("causa", evento.target.value)}>
          <option value="Todas">Todas las causas</option>
          {causas.map((fila) => (
            <option key={fila.cod_causa} value={fila.cod_causa}>
              {fila.causa}
            </option>
          ))}
        </select>
      </label>
    </aside>
  );
}

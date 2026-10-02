export function literal(valor) {
  return `'${String(valor).replaceAll("'", "''")}'`;
}

export function whereTerritorio(filtros, { anio = true, tabla = "" } = {}) {
  const columna = (nombre) => (tabla ? `${tabla}.${nombre}` : nombre);
  const partes = [];
  if (anio && filtros.anio && filtros.anio !== "Todos") {
    partes.push(`${columna("anio")} = ${Number(filtros.anio)}`);
  }
  if (filtros.departamento && filtros.departamento !== "Todos") {
    partes.push(`${columna("departamento")} = ${literal(filtros.departamento)}`);
  }
  if (filtros.municipio && filtros.municipio !== "Todos") {
    const [codDepartamento, codMunicipio] = filtros.municipio.split("|");
    partes.push(`${columna("cod_departamento")} = ${literal(codDepartamento)}`);
    partes.push(`${columna("cod_municipio")} = ${literal(codMunicipio)}`);
  }
  return partes.length ? partes.join(" AND ") : "TRUE";
}

export function whereCausas(filtros, opciones = {}) {
  const base = whereTerritorio(filtros, opciones);
  if (!filtros.causa || filtros.causa === "Todas") return base;
  return `${base} AND cod_causa = ${literal(filtros.causa)}`;
}

export async function cargarCatalogos(consultar) {
  const [anios, departamentos, municipios, causas] = await Promise.all([
    consultar("SELECT DISTINCT anio FROM panorama ORDER BY anio DESC"),
    consultar(
      "SELECT DISTINCT departamento FROM geografia WHERE departamento <> '' ORDER BY departamento",
    ),
    consultar(`
      SELECT cod_departamento, departamento, cod_municipio, municipio
      FROM geografia
    `),
    consultar(`
      SELECT cod_causa, MAX(causa) AS causa
      FROM causas
      GROUP BY cod_causa
      ORDER BY SUM(defunciones) DESC
    `),
  ]);

  return {
    anios: anios.map((fila) => fila.anio),
    departamentos: departamentos
      .map((fila) => fila.departamento)
      .sort((a, b) => a.localeCompare(b, "es")),
    municipios: municipios.sort((a, b) => a.municipio.localeCompare(b.municipio, "es")),
    causas,
  };
}

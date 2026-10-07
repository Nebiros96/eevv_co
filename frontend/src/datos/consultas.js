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

export const GRUPOS_MADRE = ["10-14", "15-19", "20-24", "25-29", "30-34", "35-39", "40-44", "45-49", "50-54"];
export const GRUPOS_TGF = ["15-19", "20-24", "25-29", "30-34", "35-39", "40-44", "45-49"];
export const CAUSAS_EXTERNAS = ["Homicidios", "Suicidios", "Accidentes de tránsito", "Otros accidentes", "Otras externas"];

export const MADRE_DESDE_POB = `
  CASE grupo_edad
    WHEN 'De 10-14 años' THEN '10-14'
    WHEN 'De 15-19 años' THEN '15-19'
    WHEN 'De 20-24 años' THEN '20-24'
    WHEN 'De 25-29 años' THEN '25-29'
    WHEN 'De 30-34 años' THEN '30-34'
    WHEN 'De 35-39 años' THEN '35-39'
    WHEN 'De 40-44 años' THEN '40-44'
    WHEN 'De 45-49 años' THEN '45-49'
    WHEN 'De 50-54 años' THEN '50-54'
  END
`;

export function nivelTerritorial(filtros, municipal = false) {
  if (filtros.municipio !== "Todos") return "municipio";
  if (filtros.departamento !== "Todos" || municipal) return "municipio";
  return "departamento";
}

export function anioComparacion(filtros, anios) {
  if (filtros.anio && filtros.anio !== "Todos") return Number(filtros.anio);
  return Number(anios[0]);
}

export function sqlTasasVitales(filtros) {
  return `
    WITH hechos AS (
      SELECT anio, cod_departamento, cod_municipio,
             SUM(nacimientos)::DOUBLE AS nacimientos,
             SUM(defunciones)::DOUBLE AS defunciones
      FROM panorama
      WHERE ${whereTerritorio(filtros)}
      GROUP BY 1, 2, 3
    ),
    pob AS (
      SELECT anio, cod_departamento, cod_municipio, SUM(poblacion)::DOUBLE AS poblacion
      FROM poblacion
      WHERE ${whereTerritorio(filtros)}
      GROUP BY 1, 2, 3
    )
    SELECT COALESCE(SUM(h.nacimientos), 0)::DOUBLE AS nacimientos,
           COALESCE(SUM(h.defunciones), 0)::DOUBLE AS defunciones,
           COALESCE(SUM(p.poblacion), 0)::DOUBLE AS poblacion
    FROM hechos h
    JOIN pob p USING (anio, cod_departamento, cod_municipio)
  `;
}

export function sqlSerieTasas(filtros) {
  const territorio = whereTerritorio(filtros, { anio: false });
  return `
    WITH hechos AS (
      SELECT anio, cod_departamento, cod_municipio,
             SUM(nacimientos)::DOUBLE AS nacimientos,
             SUM(defunciones)::DOUBLE AS defunciones
      FROM panorama
      WHERE ${territorio}
      GROUP BY 1, 2, 3
    ),
    pob AS (
      SELECT anio, cod_departamento, cod_municipio, SUM(poblacion)::DOUBLE AS poblacion
      FROM poblacion
      WHERE ${territorio}
      GROUP BY 1, 2, 3
    )
    SELECT h.anio,
           SUM(h.nacimientos)::DOUBLE AS nacimientos,
           SUM(h.defunciones)::DOUBLE AS defunciones,
           SUM(p.poblacion)::DOUBLE AS poblacion,
           1000 * SUM(h.nacimientos) / NULLIF(SUM(p.poblacion), 0) AS natalidad,
           1000 * SUM(h.defunciones) / NULLIF(SUM(p.poblacion), 0) AS mortalidad
    FROM hechos h
    JOIN pob p USING (anio, cod_departamento, cod_municipio)
    GROUP BY 1
    ORDER BY 1
  `;
}

export function sqlMapaTasa(filtros, { tabla, numerador, escala = 1000, municipal = false, extra = "TRUE" } = {}) {
  const nivel = nivelTerritorial(filtros, municipal);
  const codigo = nivel === "departamento" ? "h.cod_departamento" : "h.cod_municipio";
  const nombre = nivel === "departamento" ? "MAX(g.departamento)" : "MAX(g.municipio)";
  const detalle = nivel === "departamento" ? "''" : "MAX(g.departamento)";
  return `
    WITH hechos AS (
      SELECT anio, cod_departamento, cod_municipio, SUM(${numerador})::DOUBLE AS hechos
      FROM ${tabla}
      WHERE ${whereTerritorio(filtros)} AND ${extra}
      GROUP BY 1, 2, 3
    ),
    pob AS (
      SELECT anio, cod_departamento, cod_municipio, SUM(poblacion)::DOUBLE AS poblacion
      FROM poblacion
      WHERE ${whereTerritorio(filtros)}
      GROUP BY 1, 2, 3
    )
    SELECT ${codigo} AS codigo,
           ${nombre} AS nombre,
           ${detalle} AS detalle,
           SUM(h.hechos)::DOUBLE AS hechos,
           SUM(p.poblacion)::DOUBLE AS poblacion,
           ${escala} * SUM(h.hechos) / NULLIF(SUM(p.poblacion), 0) AS valor
    FROM hechos h
    JOIN pob p USING (anio, cod_departamento, cod_municipio)
    JOIN geografia g
      ON g.cod_departamento = h.cod_departamento
     AND g.cod_municipio = h.cod_municipio
    GROUP BY ${codigo}
  `;
}

export function sqlRankingTasa(
  filtros,
  { tabla, numerador, escala = 1000, extra = "TRUE", municipal = false } = {},
) {
  const municipalVista =
    municipal || filtros.departamento !== "Todos" || filtros.municipio !== "Todos";
  const etiqueta = municipalVista
    ? filtros.departamento === "Todos"
      ? "h.municipio || ' · ' || h.departamento"
      : "h.municipio"
    : "h.departamento";
  return `
    WITH hechos AS (
      SELECT anio, cod_departamento, departamento, cod_municipio, municipio,
             SUM(${numerador})::DOUBLE AS hechos
      FROM ${tabla}
      WHERE ${whereTerritorio(filtros)} AND ${extra}
      GROUP BY 1, 2, 3, 4, 5
    ),
    pob AS (
      SELECT anio, cod_departamento, departamento, cod_municipio, municipio,
             SUM(poblacion)::DOUBLE AS poblacion
      FROM poblacion
      WHERE ${whereTerritorio(filtros)}
      GROUP BY 1, 2, 3, 4, 5
    )
    SELECT ${etiqueta} AS etiqueta,
           SUM(h.hechos)::DOUBLE AS hechos,
           SUM(p.poblacion)::DOUBLE AS poblacion,
           ${escala} * SUM(h.hechos) / NULLIF(SUM(p.poblacion), 0) AS valor
    FROM hechos h
    JOIN pob p USING (anio, cod_departamento, cod_municipio)
    GROUP BY 1
    HAVING SUM(p.poblacion) >= 10000
    ORDER BY valor DESC NULLS LAST
    LIMIT 12
  `;
}

export function sqlFecundidadEdad(filtros) {
  const grupos = GRUPOS_MADRE.map(literal).join(", ");
  return `
    WITH nac AS (
      SELECT anio, grupo_edad_madre, SUM(nacimientos)::DOUBLE AS nacimientos
      FROM nac_edad
      WHERE ${whereTerritorio(filtros)}
        AND grupo_edad_madre IN (${grupos})
      GROUP BY 1, 2
    ),
    muj AS (
      SELECT anio, ${MADRE_DESDE_POB} AS grupo_edad_madre, SUM(poblacion)::DOUBLE AS mujeres
      FROM poblacion
      WHERE ${whereTerritorio(filtros)}
        AND sexo = 'Mujeres'
        AND ${MADRE_DESDE_POB} IS NOT NULL
      GROUP BY 1, 2
    )
    SELECT n.grupo_edad_madre,
           SUM(n.nacimientos)::DOUBLE AS nacimientos,
           SUM(m.mujeres)::DOUBLE AS mujeres,
           1000 * SUM(n.nacimientos) / NULLIF(SUM(m.mujeres), 0) AS tasa
    FROM nac n
    JOIN muj m USING (anio, grupo_edad_madre)
    GROUP BY 1
  `;
}

export function sqlSerieFecundidad(filtros) {
  const territorio = whereTerritorio(filtros, { anio: false });
  const tgf = GRUPOS_TGF.map(literal).join(", ");
  return `
    WITH nac AS (
      SELECT anio, grupo_edad_madre, SUM(nacimientos)::DOUBLE AS nacimientos
      FROM nac_edad
      WHERE ${territorio}
        AND grupo_edad_madre IN (${tgf})
      GROUP BY 1, 2
    ),
    muj AS (
      SELECT anio, ${MADRE_DESDE_POB} AS grupo_edad_madre, SUM(poblacion)::DOUBLE AS mujeres
      FROM poblacion
      WHERE ${territorio}
        AND sexo = 'Mujeres'
        AND ${MADRE_DESDE_POB} IN (${tgf})
      GROUP BY 1, 2
    ),
    fx AS (
      SELECT n.anio, n.grupo_edad_madre,
             SUM(n.nacimientos) / NULLIF(SUM(m.mujeres), 0) AS fx
      FROM nac n
      JOIN muj m USING (anio, grupo_edad_madre)
      GROUP BY 1, 2
    )
    SELECT anio, 5 * SUM(fx) AS tgf
    FROM fx
    GROUP BY 1
    ORDER BY 1
  `;
}

export function sqlMapaTgf(filtros) {
  const nivel = nivelTerritorial(filtros);
  const codigo = nivel === "departamento" ? "cod_departamento" : "cod_municipio";
  const nombre = nivel === "departamento" ? "departamento" : "municipio";
  const detalle = nivel === "departamento" ? "MAX(CAST(NULL AS VARCHAR))" : "MAX(departamento)";
  const tgf = GRUPOS_TGF.map(literal).join(", ");
  const territorio = whereTerritorio(filtros);
  return `
    WITH nac AS (
      SELECT anio,
             ${codigo} AS codigo,
             MAX(${nombre}) AS nombre,
             ${detalle} AS detalle,
             grupo_edad_madre,
             SUM(nacimientos)::DOUBLE AS nacimientos
      FROM nac_edad
      WHERE ${territorio} AND grupo_edad_madre IN (${tgf})
      GROUP BY anio, ${codigo}, grupo_edad_madre
    ),
    muj AS (
      SELECT anio,
             ${codigo} AS codigo,
             ${MADRE_DESDE_POB} AS grupo_edad_madre,
             SUM(poblacion)::DOUBLE AS mujeres
      FROM poblacion
      WHERE ${territorio} AND sexo = 'Mujeres' AND ${MADRE_DESDE_POB} IN (${tgf})
      GROUP BY 1, 2, 3
    ),
    fx AS (
      SELECT n.codigo, MAX(n.nombre) AS nombre, MAX(n.detalle) AS detalle, n.grupo_edad_madre,
             SUM(n.nacimientos)::DOUBLE AS nacimientos,
             SUM(n.nacimientos) / NULLIF(SUM(m.mujeres), 0) AS fx
      FROM nac n
      JOIN muj m USING (anio, codigo, grupo_edad_madre)
      GROUP BY n.codigo, n.grupo_edad_madre
    )
    SELECT codigo,
           MAX(nombre) AS nombre,
           MAX(detalle) AS detalle,
           SUM(nacimientos)::DOUBLE AS hechos,
           5 * SUM(fx) AS valor
    FROM fx
    GROUP BY codigo
  `;
}

export function sqlFecundidadAnualEdad(filtros) {
  const territorio = whereTerritorio(filtros, { anio: false });
  const grupos = GRUPOS_MADRE.map(literal).join(", ");
  return `
    WITH nac AS (
      SELECT anio, grupo_edad_madre, SUM(nacimientos)::DOUBLE AS nacimientos
      FROM nac_edad
      WHERE ${territorio} AND grupo_edad_madre IN (${grupos})
      GROUP BY 1, 2
    ),
    muj AS (
      SELECT anio, ${MADRE_DESDE_POB} AS grupo_edad_madre, SUM(poblacion)::DOUBLE AS mujeres
      FROM poblacion
      WHERE ${territorio} AND sexo = 'Mujeres' AND ${MADRE_DESDE_POB} IS NOT NULL
      GROUP BY 1, 2
    )
    SELECT n.anio, n.grupo_edad_madre,
           SUM(n.nacimientos)::DOUBLE AS nacimientos,
           SUM(m.mujeres)::DOUBLE AS mujeres
    FROM nac n
    JOIN muj m USING (anio, grupo_edad_madre)
    GROUP BY 1, 2
    ORDER BY 1, 2
  `;
}

export function sqlMortalidadEdad(filtros) {
  return `
    WITH def AS (
      SELECT anio, grupo_edad, sexo, SUM(defunciones)::DOUBLE AS defunciones
      FROM def_edad
      WHERE ${whereTerritorio(filtros)}
        AND sexo IN ('Hombres', 'Mujeres')
        AND grupo_edad <> 'Edad desconocida'
      GROUP BY 1, 2, 3
    ),
    pob AS (
      SELECT anio, grupo_edad, sexo, SUM(poblacion)::DOUBLE AS poblacion
      FROM poblacion
      WHERE ${whereTerritorio(filtros)}
      GROUP BY 1, 2, 3
    )
    SELECT d.grupo_edad, d.sexo,
           SUM(d.defunciones)::DOUBLE AS defunciones,
           SUM(p.poblacion)::DOUBLE AS poblacion,
           1000 * SUM(d.defunciones) / NULLIF(SUM(p.poblacion), 0) AS tasa
    FROM def d
    JOIN pob p USING (anio, grupo_edad, sexo)
    GROUP BY 1, 2
  `;
}

export function sqlMortalidadEstandar(filtros) {
  const territorio = whereTerritorio(filtros);
  return `
    WITH estandar AS (
      SELECT grupo_edad, SUM(poblacion)::DOUBLE AS peso
      FROM poblacion
      WHERE anio = 2019
      GROUP BY 1
    ),
    def AS (
      SELECT anio, grupo_edad, SUM(defunciones)::DOUBLE AS defunciones
      FROM def_edad
      WHERE ${territorio} AND grupo_edad <> 'Edad desconocida'
      GROUP BY 1, 2
    ),
    pob AS (
      SELECT anio, grupo_edad, SUM(poblacion)::DOUBLE AS poblacion
      FROM poblacion
      WHERE ${territorio}
      GROUP BY 1, 2
    ),
    mx AS (
      SELECT d.grupo_edad, SUM(d.defunciones) / NULLIF(SUM(p.poblacion), 0) AS mx
      FROM def d
      JOIN pob p USING (anio, grupo_edad)
      GROUP BY 1
    )
    SELECT 1000 * SUM(m.mx * e.peso) / NULLIF(SUM(e.peso), 0) AS tasa_estandar
    FROM mx m
    JOIN estandar e USING (grupo_edad)
  `;
}

export function sqlRankingTgf(filtros) {
  const columna =
    filtros.departamento === "Todos" && filtros.municipio === "Todos" ? "departamento" : "municipio";
  const tgf = GRUPOS_TGF.map(literal).join(", ");
  const territorio = whereTerritorio(filtros);
  return `
    WITH nac AS (
      SELECT anio, ${columna} AS etiqueta, grupo_edad_madre, SUM(nacimientos)::DOUBLE AS nacimientos
      FROM nac_edad
      WHERE ${territorio} AND grupo_edad_madre IN (${tgf})
      GROUP BY 1, 2, 3
    ),
    muj AS (
      SELECT anio, ${columna} AS etiqueta, ${MADRE_DESDE_POB} AS grupo_edad_madre,
             SUM(poblacion)::DOUBLE AS mujeres
      FROM poblacion
      WHERE ${territorio} AND sexo = 'Mujeres' AND ${MADRE_DESDE_POB} IN (${tgf})
      GROUP BY 1, 2, 3
    ),
    fx AS (
      SELECT n.etiqueta, n.grupo_edad_madre,
             SUM(n.nacimientos) / NULLIF(SUM(m.mujeres), 0) AS fx
      FROM nac n
      JOIN muj m USING (anio, etiqueta, grupo_edad_madre)
      GROUP BY 1, 2
    )
    SELECT etiqueta, 5 * SUM(fx) AS valor
    FROM fx
    GROUP BY 1
    ORDER BY valor DESC NULLS LAST
    LIMIT 12
  `;
}

export function sqlMapaEstandar(filtros, municipal = false) {
  const nivel = nivelTerritorial(filtros, municipal);
  const codigo = nivel === "departamento" ? "d.cod_departamento" : "d.cod_municipio";
  const nombre = nivel === "departamento" ? "MAX(d.departamento)" : "MAX(d.municipio)";
  const detalle = nivel === "departamento" ? "''" : "MAX(d.departamento)";
  const territorio = whereTerritorio(filtros);
  return `
    WITH estandar AS (
      SELECT grupo_edad, SUM(poblacion)::DOUBLE AS peso
      FROM poblacion
      WHERE anio = 2019
      GROUP BY 1
    ),
    def AS (
      SELECT anio, cod_departamento, departamento, cod_municipio, municipio, grupo_edad,
             SUM(defunciones)::DOUBLE AS defunciones
      FROM def_edad
      WHERE ${territorio} AND grupo_edad <> 'Edad desconocida'
      GROUP BY 1, 2, 3, 4, 5, 6
    ),
    pob AS (
      SELECT anio, cod_departamento, departamento, cod_municipio, municipio, grupo_edad,
             SUM(poblacion)::DOUBLE AS poblacion
      FROM poblacion
      WHERE ${territorio}
      GROUP BY 1, 2, 3, 4, 5, 6
    ),
    mx AS (
      SELECT d.cod_departamento, d.departamento, d.cod_municipio, d.municipio, d.grupo_edad,
             SUM(d.defunciones) / NULLIF(SUM(p.poblacion), 0) AS mx
      FROM def d
      JOIN pob p USING (anio, cod_departamento, cod_municipio, grupo_edad)
      GROUP BY 1, 2, 3, 4, 5
    )
    SELECT ${codigo} AS codigo,
           ${nombre} AS nombre,
           ${detalle} AS detalle,
           1000 * SUM(d.mx * e.peso) / NULLIF(SUM(e.peso), 0) AS valor
    FROM mx d
    JOIN estandar e USING (grupo_edad)
    GROUP BY ${codigo}
  `;
}

export function sqlRankingEstandar(filtros) {
  const columna =
    filtros.departamento === "Todos" && filtros.municipio === "Todos" ? "departamento" : "municipio";
  const territorio = whereTerritorio(filtros);
  return `
    WITH estandar AS (
      SELECT grupo_edad, SUM(poblacion)::DOUBLE AS peso
      FROM poblacion
      WHERE anio = 2019
      GROUP BY 1
    ),
    def AS (
      SELECT anio, departamento, municipio, grupo_edad, SUM(defunciones)::DOUBLE AS defunciones
      FROM def_edad
      WHERE ${territorio} AND grupo_edad <> 'Edad desconocida'
      GROUP BY 1, 2, 3, 4
    ),
    pob AS (
      SELECT anio, departamento, municipio, grupo_edad, SUM(poblacion)::DOUBLE AS poblacion
      FROM poblacion
      WHERE ${territorio}
      GROUP BY 1, 2, 3, 4
    ),
    mx AS (
      SELECT d.${columna} AS etiqueta, d.grupo_edad,
             SUM(d.defunciones) / NULLIF(SUM(p.poblacion), 0) AS mx
      FROM def d
      JOIN pob p USING (anio, departamento, municipio, grupo_edad)
      GROUP BY 1, 2
    )
    SELECT etiqueta, 1000 * SUM(m.mx * e.peso) / NULLIF(SUM(e.peso), 0) AS valor
    FROM mx m
    JOIN estandar e USING (grupo_edad)
    GROUP BY 1
    ORDER BY valor DESC NULLS LAST
    LIMIT 12
  `;
}

export function sqlPerfilNatalidad(filtros, dimension, anioBase, anioActual) {
  const territorio = whereTerritorio(filtros, { anio: false });
  return `
    SELECT categoria,
           COALESCE(SUM(CASE WHEN anio = ${anioBase} THEN nacimientos END), 0)::DOUBLE AS base,
           COALESCE(SUM(CASE WHEN anio = ${anioActual} THEN nacimientos END), 0)::DOUBLE AS actual
    FROM nac_perfil
    WHERE ${territorio} AND dimension = ${literal(dimension)}
    GROUP BY 1
  `;
}

export function sqlPerfilEdadMadre(filtros, anioBase, anioActual) {
  const territorio = whereTerritorio(filtros, { anio: false });
  return `
    SELECT grupo_edad_madre AS categoria,
           COALESCE(SUM(CASE WHEN anio = ${anioBase} THEN nacimientos END), 0)::DOUBLE AS base,
           COALESCE(SUM(CASE WHEN anio = ${anioActual} THEN nacimientos END), 0)::DOUBLE AS actual
    FROM nac_edad
    WHERE ${territorio} AND grupo_edad_madre <> 'Sin información'
    GROUP BY 1
  `;
}

export function sqlSerieExterna(filtros) {
  const extra =
    !filtros.externa || filtros.externa === "Todas" ? "TRUE" : `causa = ${literal(filtros.externa)}`;
  const territorio = whereTerritorio(filtros, { anio: false });
  return `
    WITH def AS (
      SELECT anio, causa, SUM(defunciones)::DOUBLE AS defunciones
      FROM externas
      WHERE ${territorio} AND ${extra}
      GROUP BY 1, 2
    ),
    pob AS (
      SELECT anio, SUM(poblacion)::DOUBLE AS poblacion
      FROM poblacion
      WHERE ${territorio}
      GROUP BY 1
    )
    SELECT d.anio, d.causa,
           SUM(d.defunciones)::DOUBLE AS defunciones,
           MAX(p.poblacion)::DOUBLE AS poblacion,
           100000 * SUM(d.defunciones) / NULLIF(MAX(p.poblacion), 0) AS tasa
    FROM def d
    JOIN pob p USING (anio)
    GROUP BY 1, 2
    ORDER BY 1
  `;
}

export async function cargarCatalogos(consultar) {
  const [anios, departamentos, municipios] = await Promise.all([
    consultar("SELECT DISTINCT anio FROM panorama ORDER BY anio DESC"),
    consultar(
      "SELECT DISTINCT departamento FROM geografia WHERE departamento <> '' ORDER BY departamento",
    ),
    consultar(`
      SELECT cod_departamento, departamento, cod_municipio, municipio
      FROM geografia
    `),
  ]);

  return {
    anios: anios.map((fila) => fila.anio),
    departamentos: departamentos
      .map((fila) => fila.departamento)
      .sort((a, b) => a.localeCompare(b, "es")),
    municipios: municipios.sort((a, b) => a.municipio.localeCompare(b.municipio, "es")),
  };
}

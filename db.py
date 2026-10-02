"""Conexión a PostgreSQL y consultas de los esquemas vitales."""

from __future__ import annotations

import os
from pathlib import Path

import pandas as pd
import psycopg2
import yaml
from psycopg2 import sql

ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "config.yml"

# Solo estos esquemas. proyecciones y el resto de la base quedan fuera.
ESQUEMAS_PERMITIDOS = ("defunciones", "nacimientos", "geografia")

COLUMNAS_ANIO = ("anio", "año", "ano", "year", "vigencia")
TODOS = "Todos"
TODAS = "Todas"
ORDEN_EDAD = (
    "Menor 1 año",
    "De 1-4 años",
    "De 5-14 años",
    "De 15-44 años",
    "De 45-64 años",
    "De 65-84 años",
    "De 85-99 años",
    "De 100 y más",
    "Edad desconocida",
)
ORDEN_SEXO = ("Hombres", "Mujeres", "Indeterminado")

_TABLERO: dict | None = None


def cargar_config() -> dict:
    if not CONFIG_PATH.exists():
        raise FileNotFoundError(f"No está {CONFIG_PATH.name} en la raíz del proyecto.")
    with CONFIG_PATH.open(encoding="utf-8") as handle:
        datos = yaml.safe_load(handle) or {}
    cfg = datos.get("postgres")
    if not isinstance(cfg, dict):
        raise ValueError("config.yml no tiene la sección postgres.")
    return cfg


def _mensaje_conexion(exc: BaseException) -> str:
    crudo = getattr(exc, "object", None)
    if isinstance(crudo, (bytes, bytearray)):
        return crudo.decode("latin1", errors="replace").strip()
    return str(exc).strip()


def conectar():
    """Abre una conexión usando config.yml. No imprime la contraseña."""
    cfg = cargar_config()
    os.environ.setdefault("PGCLIENTENCODING", "UTF8")
    try:
        conn = psycopg2.connect(
            host=cfg.get("host", "localhost"),
            port=int(cfg.get("port", 5432)),
            dbname=cfg.get("dbname"),
            user=cfg.get("user"),
            password=str(cfg.get("password", "")),
            sslmode=cfg.get("sslmode", "prefer"),
            connect_timeout=8,
        )
    except UnicodeDecodeError as exc:
        raise ConnectionError(_mensaje_conexion(exc)) from exc
    except psycopg2.Error as exc:
        raise ConnectionError(_mensaje_conexion(exc)) from exc
    conn.set_client_encoding("UTF8")
    return conn


def validar_conexion(conn) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT current_database(), current_user, split_part(version(), ',', 1)
            """
        )
        base, usuario, version = cur.fetchone()
    return {"base": base, "usuario": usuario, "version": version}


def esquemas_usuario(conn) -> list[str]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT nspname
            FROM pg_namespace
            WHERE nspname NOT LIKE 'pg\\_%' ESCAPE '\\'
              AND nspname <> 'information_schema'
            ORDER BY 1
            """
        )
        return [fila[0] for fila in cur.fetchall()]


def clasificar_esquemas(nombres: list[str]) -> tuple[list[str], list[str]]:
    permitidos = {nombre.lower() for nombre in ESQUEMAS_PERMITIDOS}
    en_uso = [nombre for nombre in nombres if nombre.lower() in permitidos]
    excluidos = [nombre for nombre in nombres if nombre.lower() not in permitidos]
    return en_uso, excluidos


def _consultar(conn, consulta: str, params: tuple) -> pd.DataFrame:
    with conn.cursor() as cur:
        cur.execute(consulta, params)
        columnas = [col[0] for col in cur.description]
        return pd.DataFrame(cur.fetchall(), columns=columnas)


def catalogo_tablas(conn, esquemas: list[str]) -> pd.DataFrame:
    vacio = pd.DataFrame(columns=["esquema", "tabla", "tipo", "filas_estimadas"])
    if not esquemas:
        return vacio
    consulta = """
        SELECT n.nspname AS esquema,
               c.relname AS tabla,
               CASE c.relkind
                   WHEN 'r' THEN 'tabla'
                   WHEN 'p' THEN 'particionada'
                   WHEN 'v' THEN 'vista'
                   WHEN 'm' THEN 'vista materializada'
                   ELSE c.relkind
               END AS tipo,
               GREATEST(c.reltuples, 0)::bigint AS filas_estimadas
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = ANY(%s)
          AND c.relkind IN ('r', 'p', 'v', 'm')
        ORDER BY 1, 2
    """
    return _consultar(conn, consulta, (esquemas,))


def catalogo_columnas(conn, esquemas: list[str]) -> pd.DataFrame:
    vacio = pd.DataFrame(columns=["esquema", "tabla", "columna", "tipo"])
    if not esquemas:
        return vacio
    consulta = """
        SELECT table_schema AS esquema,
               table_name AS tabla,
               column_name AS columna,
               data_type AS tipo
        FROM information_schema.columns
        WHERE table_schema = ANY(%s)
        ORDER BY 1, 2, ordinal_position
    """
    return _consultar(conn, consulta, (esquemas,))


def serie_por_anio(conn, columnas: pd.DataFrame) -> pd.DataFrame:
    """Cuenta registros por año en la primera tabla de cada esquema que tenga esa columna."""
    vacio = pd.DataFrame(columns=["esquema", "tabla", "anio", "registros"])
    if columnas.empty:
        return vacio

    candidatos = columnas[
        columnas["columna"].str.lower().isin(COLUMNAS_ANIO)
    ].drop_duplicates(["esquema", "tabla", "columna"])

    piezas = []
    vistos: set[str] = set()
    with conn.cursor() as cur:
        cur.execute("SET statement_timeout = '20s'")
        for _, fila in candidatos.iterrows():
            if fila["esquema"] in vistos:
                continue
            vistos.add(fila["esquema"])
            tipo = str(fila["tipo"]).lower()
            if "date" in tipo or "time" in tipo:
                expresion = sql.SQL("EXTRACT(YEAR FROM {anio})::int")
            else:
                expresion = sql.SQL("{anio}::int")
            consulta = sql.SQL(
                """
                SELECT %s AS esquema,
                       %s AS tabla,
                       {expr} AS anio,
                       COUNT(*)::bigint AS registros
                FROM {esquema}.{tabla}
                WHERE {anio} IS NOT NULL
                GROUP BY 3
                ORDER BY 3
                """
            ).format(
                expr=expresion.format(anio=sql.Identifier(fila["columna"])),
                anio=sql.Identifier(fila["columna"]),
                esquema=sql.Identifier(fila["esquema"]),
                tabla=sql.Identifier(fila["tabla"]),
            )
            cur.execute(consulta, (fila["esquema"], fila["tabla"]))
            piezas.extend(cur.fetchall())

    if not piezas:
        return vacio
    return pd.DataFrame(piezas, columns=["esquema", "tabla", "anio", "registros"])


def _clave_orden(texto: str) -> str:
    import unicodedata

    base = unicodedata.normalize("NFKD", str(texto))
    return "".join(ch for ch in base if not unicodedata.combining(ch)).lower()


def _enteros(df: pd.DataFrame, columnas: tuple[str, ...]) -> pd.DataFrame:
    for columna in columnas:
        if columna in df.columns:
            df[columna] = pd.to_numeric(df[columna], errors="coerce").fillna(0).astype(int)
    return df


def filtrar_territorio(df: pd.DataFrame, departamento: str | None, municipio: str | None) -> pd.DataFrame:
    """Filtra por residencia. Si el municipio no pertenece al departamento, conserva el departamento."""
    if df.empty:
        return df
    if departamento and departamento != TODOS:
        df = df[df["departamento"] == departamento]
    if municipio and municipio != TODOS and "|" in str(municipio):
        cod_depto, cod_muni = str(municipio).split("|", 1)
        coinciden = df[(df["cod_departamento"] == cod_depto) & (df["cod_municipio"] == cod_muni)]
        if not coinciden.empty:
            df = coinciden
    return df


def filtrar_anio(df: pd.DataFrame, anio: str | None) -> pd.DataFrame:
    if df.empty or not anio or anio == TODOS:
        return df
    return df[df["anio"] == int(anio)]


def opciones_municipio(municipios: pd.DataFrame, departamento: str | None) -> dict[str, str]:
    frame = municipios
    if departamento and departamento != TODOS:
        frame = frame[frame["departamento"] == departamento]
        etiquetas = frame["municipio"]
    else:
        etiquetas = frame["etiqueta"]
    pares = sorted(zip(frame["clave"], etiquetas), key=lambda par: _clave_orden(par[1]))
    return {TODOS: "Todos", **dict(pares)}


# La vista colapsa países en Extranjero y los residuos en Sin Información.
# El CASE lleva cada hecho a la fila visible de esa vista.
CRUCE_GEOGRAFIA = """
JOIN geografia.vw_dim_geografia g
  ON g.cod_departamento = CASE f.tipo_registro
       WHEN 'extranjero' THEN '75'
       WHEN 'sin_informacion' THEN '01'
       ELSE f.cod_departamento
     END
 AND g.cod_municipio = CASE f.tipo_registro
       WHEN 'extranjero' THEN '75000'
       WHEN 'sin_informacion' THEN '01999'
       ELSE f.cod_municipio
     END
"""


def cargar_tablero() -> dict:
    """Carga agregados de residencia, causas y coordenadas. Reutiliza la carga en el mismo proceso."""
    global _TABLERO
    if _TABLERO is not None:
        return _TABLERO

    conn = conectar()
    try:
        with conn.cursor() as cur:
            cur.execute("SET statement_timeout = '90s'")
        nacimientos = _consultar(
            conn,
            f"""
            SELECT f.anio,
                   g.cod_departamento,
                   g.departamento,
                   g.cod_municipio,
                   g.municipio,
                   COALESCE(NULLIF(f.sexo, ''), 'Indeterminado') AS sexo,
                   SUM(f.nacimientos)::bigint AS nacimientos
            FROM nacimientos.fact_nac_residencia f
            {CRUCE_GEOGRAFIA}
            GROUP BY 1, 2, 3, 4, 5, 6
            """,
            (),
        )
        defunciones = _consultar(
            conn,
            f"""
            SELECT f.anio,
                   g.cod_departamento,
                   g.departamento,
                   g.cod_municipio,
                   g.municipio,
                   COALESCE(NULLIF(f.sexo, ''), 'Indeterminado') AS sexo,
                   SUM(f.defunciones)::bigint AS defunciones
            FROM defunciones.fact_def_causa f
            {CRUCE_GEOGRAFIA}
            GROUP BY 1, 2, 3, 4, 5, 6
            """,
            (),
        )
        causas = _consultar(
            conn,
            f"""
            SELECT f.anio,
                   g.cod_departamento,
                   g.departamento,
                   g.cod_municipio,
                   g.municipio,
                   f.cod_causa,
                   f.causa,
                   COALESCE(NULLIF(f.grupo_edad, ''), 'Edad desconocida') AS grupo_edad,
                   COALESCE(NULLIF(f.sexo, ''), 'Indeterminado') AS sexo,
                   SUM(f.defunciones)::bigint AS defunciones
            FROM defunciones.fact_def_causa f
            {CRUCE_GEOGRAFIA}
            GROUP BY 1, 2, 3, 4, 5, 6, 7, 8, 9
            """,
            (),
        )
        catalogo_geo = _consultar(
            conn,
            """
            SELECT cod_departamento,
                   departamento,
                   cod_municipio,
                   municipio,
                   latitud::float AS latitud,
                   longitud::float AS longitud
            FROM geografia.vw_dim_geografia
            """,
            (),
        )
    finally:
        conn.close()

    for frame in (nacimientos, defunciones, causas):
        _enteros(frame, ("anio",))
        for columna in ("cod_departamento", "departamento", "cod_municipio", "municipio"):
            frame[columna] = frame[columna].fillna("").astype(str).str.strip()
    _enteros(nacimientos, ("nacimientos",))
    _enteros(defunciones, ("defunciones",))
    _enteros(causas, ("defunciones",))
    causas["cod_causa"] = causas["cod_causa"].fillna("").astype(str)
    causas["causa"] = causas["causa"].fillna("Sin causa").astype(str)
    causas["grupo_edad"] = causas["grupo_edad"].fillna("Edad desconocida").astype(str)
    causas["sexo"] = causas["sexo"].fillna("Indeterminado").astype(str)

    catalogo = (
        causas.groupby(["cod_causa", "causa"], as_index=False)["defunciones"]
        .sum()
        .sort_values("defunciones", ascending=False)
        .drop_duplicates("cod_causa")
    )
    causas = causas.drop(columns=["causa"]).merge(
        catalogo[["cod_causa", "causa"]], on="cod_causa", how="left"
    )

    for columna in ("cod_departamento", "departamento", "cod_municipio", "municipio"):
        catalogo_geo[columna] = catalogo_geo[columna].fillna("").astype(str).str.strip()
    coords = catalogo_geo.loc[
        catalogo_geo["latitud"].notna() & catalogo_geo["longitud"].notna(),
        ["cod_departamento", "cod_municipio", "latitud", "longitud"],
    ].copy()
    territorios = catalogo_geo[
        ["cod_departamento", "departamento", "cod_municipio", "municipio"]
    ].drop_duplicates()
    territorios["clave"] = territorios["cod_departamento"] + "|" + territorios["cod_municipio"]
    territorios["etiqueta"] = territorios["municipio"] + " · " + territorios["departamento"]
    territorios = territorios.sort_values("etiqueta", key=lambda s: s.map(_clave_orden))

    anios = sorted(
        set(nacimientos["anio"]).union(defunciones["anio"]),
        reverse=True,
    )
    departamentos = sorted(
        set(territorios["departamento"]) - {""},
        key=_clave_orden,
    )
    causas_opciones = {TODAS: "Todas las causas"}
    for _, fila in catalogo.sort_values("defunciones", ascending=False).iterrows():
        causas_opciones[fila["cod_causa"]] = fila["causa"]

    coords["cod_departamento"] = coords["cod_departamento"].astype(str).str.strip()
    coords["cod_municipio"] = coords["cod_municipio"].astype(str).str.strip()

    _TABLERO = {
        "nacimientos": nacimientos,
        "defunciones": defunciones,
        "causas": causas,
        "coords": coords,
        "municipios": territorios,
        "anios": [str(anio) for anio in anios],
        "departamentos": departamentos,
        "causas_opciones": causas_opciones,
    }
    return _TABLERO

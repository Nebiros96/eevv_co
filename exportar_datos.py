"""Exporta los cortes que va a filtrar el prototipo estático.

No parte de CSV. Lee los hechos ya agregados en PostgreSQL y escribe Parquet.
"""

from pathlib import Path

import pandas as pd

import db

SALIDA = Path(__file__).resolve().parent / "datos"
LLAVES = [
    "anio",
    "cod_departamento",
    "departamento",
    "cod_municipio",
    "municipio",
    "sexo",
]


def panorama(nacimientos: pd.DataFrame, defunciones: pd.DataFrame) -> pd.DataFrame:
    tabla = nacimientos.merge(defunciones, on=LLAVES, how="outer")
    tabla["nacimientos"] = tabla["nacimientos"].fillna(0).astype("int64")
    tabla["defunciones"] = tabla["defunciones"].fillna(0).astype("int64")
    tabla["anio"] = tabla["anio"].astype("int16")
    return tabla.sort_values(LLAVES).reset_index(drop=True)


def geografia(municipios: pd.DataFrame, coords: pd.DataFrame) -> pd.DataFrame:
    columnas = ["cod_departamento", "departamento", "cod_municipio", "municipio"]
    tabla = municipios[columnas].drop_duplicates().merge(
        coords, on=["cod_departamento", "cod_municipio"], how="left"
    )
    return tabla.sort_values(["cod_departamento", "cod_municipio"]).reset_index(drop=True)


def causas(tabla: pd.DataFrame) -> pd.DataFrame:
    columnas = [
        *LLAVES[:5],
        "cod_causa",
        "causa",
        "grupo_edad",
        "sexo",
        "defunciones",
    ]
    salida = tabla[columnas].copy()
    salida["anio"] = salida["anio"].astype("int16")
    salida["defunciones"] = salida["defunciones"].astype("int64")
    return salida.sort_values(
        ["anio", "cod_departamento", "cod_municipio", "cod_causa", "grupo_edad", "sexo"]
    ).reset_index(drop=True)


def escribir(tabla: pd.DataFrame, nombre: str) -> Path:
    destino = SALIDA / nombre
    tabla.to_parquet(destino, engine="pyarrow", compression="snappy", index=False)
    return destino


def main() -> None:
    SALIDA.mkdir(exist_ok=True)
    tablero = db.cargar_tablero()
    archivos = {
        "panorama.parquet": panorama(tablero["nacimientos"], tablero["defunciones"]),
        "causas.parquet": causas(tablero["causas"]),
        "geografia.parquet": geografia(tablero["municipios"], tablero["coords"]),
    }
    for nombre, tabla in archivos.items():
        ruta = escribir(tabla, nombre)
        print(f"{nombre}: {len(tabla):,} filas, {ruta.stat().st_size / 1_048_576:.1f} MB")


if __name__ == "__main__":
    main()

"""Figuras del mockup. Reciben tablas ya filtradas."""

from __future__ import annotations

import plotly.graph_objects as go

import db

COLOR_NAC = "#0F766E"
COLOR_DEF = "#9F1239"
COLOR_H = "#1D4ED8"
COLOR_M = "#BE185D"
COLOR_SUAVE = "#FECACA"
TINTA = "#0F172A"
GRIS = "#64748B"


def entero(valor) -> str:
    return f"{int(round(float(valor))):,}".replace(",", ".")


def figura_vacia(mensaje: str, alto: int = 360) -> go.Figure:
    fig = go.Figure()
    fig.update_layout(
        annotations=[
            dict(text=mensaje, showarrow=False, font=dict(size=15, color=GRIS))
        ],
        xaxis=dict(visible=False),
        yaxis=dict(visible=False),
        height=alto,
        margin=dict(l=16, r=16, t=16, b=16),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
    )
    return fig


def _estilo(fig: go.Figure, alto: int, titulo: str | None = None) -> go.Figure:
    fig.update_layout(
        template="plotly_white",
        height=alto,
        title=dict(text=titulo or "", font=dict(size=15, color=TINTA), x=0),
        margin=dict(l=8, r=8, t=64 if titulo else 16, b=8),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, x=0, title_text=""),
        font=dict(color=TINTA, size=12),
    )
    return fig


def evolucion(serie, anio_marca: str | None, alto: int = 380) -> go.Figure:
    if serie.empty or serie[["nacimientos", "defunciones"]].sum().sum() == 0:
        return figura_vacia("No hay hechos vitales para este territorio.", alto)
    fig = go.Figure()
    fig.add_scatter(
        x=serie["anio"],
        y=serie["nacimientos"],
        name="Nacimientos",
        mode="lines+markers",
        line=dict(color=COLOR_NAC, width=3),
        marker=dict(size=8),
    )
    fig.add_scatter(
        x=serie["anio"],
        y=serie["defunciones"],
        name="Defunciones",
        mode="lines+markers",
        line=dict(color=COLOR_DEF, width=3),
        marker=dict(size=8),
    )
    if anio_marca and anio_marca != db.TODOS:
        fig.add_vline(x=int(anio_marca), line_dash="dot", line_color="#94A3B8")
    fig.update_layout(
        hovermode="x unified",
        xaxis_title="Año",
        yaxis_title="Registros",
        yaxis_separatethousands=True,
    )
    return _estilo(fig, alto, "Evolución anual del territorio")


def ranking(tabla, alto: int = 420) -> go.Figure:
    if tabla.empty:
        return figura_vacia("No hay territorios para este filtro.", alto)
    tabla = tabla.sort_values("defunciones", ascending=True)
    fig = go.Figure()
    fig.add_bar(
        y=tabla["etiqueta"],
        x=tabla["defunciones"],
        name="Defunciones",
        orientation="h",
        marker_color=COLOR_DEF,
    )
    fig.add_bar(
        y=tabla["etiqueta"],
        x=tabla["nacimientos"],
        name="Nacimientos",
        orientation="h",
        marker_color=COLOR_NAC,
    )
    fig.update_layout(barmode="group", xaxis_title="Registros", yaxis_title="")
    return _estilo(fig, alto, "Territorios con más defunciones")


def comparacion_sexo(nac_sexo, def_sexo, alto: int = 380) -> go.Figure:
    etiquetas = set(getattr(nac_sexo, "index", [])) | set(getattr(def_sexo, "index", []))
    sexos = [sexo for sexo in db.ORDEN_SEXO if sexo in etiquetas]
    sexos.extend(sorted(etiquetas - set(sexos), key=str))
    if not sexos:
        return figura_vacia("No hay desagregación por sexo.", alto)

    def _leer(serie, sexo: str) -> int:
        if hasattr(serie, "index") and sexo in serie.index:
            return int(serie.loc[sexo])
        return 0

    fig = go.Figure()
    fig.add_bar(
        x=sexos,
        y=[_leer(nac_sexo, sexo) for sexo in sexos],
        name="Nacimientos",
        marker_color=COLOR_NAC,
    )
    fig.add_bar(
        x=sexos,
        y=[_leer(def_sexo, sexo) for sexo in sexos],
        name="Defunciones",
        marker_color=COLOR_DEF,
    )
    fig.update_layout(barmode="group", yaxis_separatethousands=True, yaxis_title="Registros")
    return _estilo(fig, alto, "Sexo en el año seleccionado")


def mapa(puntos, departamento: str | None, alto: int = 520) -> go.Figure:
    if puntos.empty:
        return figura_vacia("No hay coordenadas para este territorio.", alto)
    zoom = 4.4 if not departamento or departamento == db.TODOS else 6.4
    fig = go.Figure(
        go.Scattermap(
            lat=puntos["latitud"],
            lon=puntos["longitud"],
            mode="markers",
            text=puntos["municipio"],
            customdata=list(
                zip(
                    puntos["departamento"],
                    puntos["defunciones"].map(entero),
                    puntos["nacimientos"].map(entero),
                )
            ),
            hovertemplate=(
                "<b>%{text}</b><br>%{customdata[0]}"
                "<br>Defunciones: %{customdata[1]}"
                "<br>Nacimientos: %{customdata[2]}<extra></extra>"
            ),
            marker=dict(
                size=puntos["tamano"],
                sizemode="area",
                sizeref=max(float(puntos["tamano"].max()) / 38**2, 1e-6),
                color=puntos["defunciones"],
                colorscale="YlOrRd",
                showscale=True,
                colorbar=dict(title="Defunciones", thickness=12),
            ),
        )
    )
    fig.update_layout(
        map=dict(
            style="open-street-map",
            center=dict(lat=float(puntos["latitud"].mean()), lon=float(puntos["longitud"].mean())),
            zoom=zoom,
        ),
        margin=dict(l=0, r=0, t=48, b=0),
        height=alto,
        title=dict(text="Defunciones por municipio de residencia", font=dict(size=15, color=TINTA), x=0),
    )
    return fig


def barras_causas(tabla, causa: str | None, alto: int = 460) -> go.Figure:
    if tabla.empty:
        return figura_vacia("No hay causas para este filtro.", alto)
    tabla = tabla.sort_values("defunciones", ascending=True)
    if not causa or causa == db.TODAS:
        colores = COLOR_DEF
    else:
        colores = [COLOR_DEF if cod == causa else COLOR_SUAVE for cod in tabla["cod_causa"]]
    fig = go.Figure(
        go.Bar(
            y=tabla["causa"],
            x=tabla["defunciones"],
            orientation="h",
            marker_color=colores,
            hovertemplate="%{y}<br>%{x:,}<extra></extra>",
        )
    )
    fig.update_layout(xaxis_title="Defunciones", yaxis_title="")
    return _estilo(fig, alto, "Principales causas")


def piramide(tabla, alto: int = 460) -> go.Figure:
    if tabla.empty:
        return figura_vacia("No hay edad y sexo para este filtro.", alto)
    edades = [edad for edad in db.ORDEN_EDAD if edad in set(tabla["grupo_edad"])]
    edades.extend(sorted(set(tabla["grupo_edad"]) - set(edades)))
    hombres = (
        tabla[tabla["sexo"] == "Hombres"]
        .groupby("grupo_edad")["defunciones"]
        .sum()
        .reindex(edades, fill_value=0)
    )
    mujeres = (
        tabla[tabla["sexo"] == "Mujeres"]
        .groupby("grupo_edad")["defunciones"]
        .sum()
        .reindex(edades, fill_value=0)
    )
    fig = go.Figure()
    fig.add_bar(
        y=edades,
        x=-hombres.values,
        name="Hombres",
        orientation="h",
        marker_color=COLOR_H,
        customdata=hombres.values,
        hovertemplate="Hombres<br>%{y}: %{customdata:,}<extra></extra>",
    )
    fig.add_bar(
        y=edades,
        x=mujeres.values,
        name="Mujeres",
        orientation="h",
        marker_color=COLOR_M,
        customdata=mujeres.values,
        hovertemplate="Mujeres<br>%{y}: %{customdata:,}<extra></extra>",
    )
    extremo = max(int(hombres.max()), int(mujeres.max()), 1)
    marcas = [0, extremo // 2, extremo]
    fig.update_layout(
        barmode="overlay",
        xaxis=dict(
            title="Defunciones",
            tickvals=[-marca for marca in reversed(marcas) if marca] + marcas,
            ticktext=[entero(marca) for marca in reversed(marcas) if marca] + [entero(m) for m in marcas],
        ),
    )
    return _estilo(fig, alto, "Edad y sexo")


def tendencia_sexo(tabla, anio_marca: str | None, alto: int = 400) -> go.Figure:
    if tabla.empty:
        return figura_vacia("No hay serie por sexo para este filtro.", alto)
    fig = go.Figure()
    colores = {"Hombres": COLOR_H, "Mujeres": COLOR_M, "Indeterminado": GRIS}
    for sexo in [s for s in db.ORDEN_SEXO if s in set(tabla["sexo"])]:
        serie = tabla[tabla["sexo"] == sexo]
        fig.add_scatter(
            x=serie["anio"],
            y=serie["defunciones"],
            name=sexo,
            mode="lines+markers",
            line=dict(color=colores.get(sexo, GRIS), width=3),
        )
    if anio_marca and anio_marca != db.TODOS:
        fig.add_vline(x=int(anio_marca), line_dash="dot", line_color="#94A3B8")
    fig.update_layout(hovermode="x unified", xaxis_title="Año", yaxis_title="Defunciones")
    return _estilo(fig, alto, "Defunciones por sexo, todos los años")


def barras_territorio(tabla, alto: int = 400) -> go.Figure:
    if tabla.empty:
        return figura_vacia("No hay territorios para esta causa.", alto)
    tabla = tabla.sort_values("defunciones", ascending=True).tail(12)
    fig = go.Figure(
        go.Bar(
            y=tabla["etiqueta"],
            x=tabla["defunciones"],
            orientation="h",
            marker_color=COLOR_DEF,
            hovertemplate="%{y}<br>%{x:,}<extra></extra>",
        )
    )
    fig.update_layout(xaxis_title="Defunciones", yaxis_title="")
    return _estilo(fig, alto, "Dónde se concentra")

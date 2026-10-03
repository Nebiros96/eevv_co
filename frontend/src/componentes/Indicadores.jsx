export function Indicador({ titulo, valor, tono, clase = "", estilo, variacion = null }) {
  return (
    <article className={`indicador tono-${tono} ${clase}`.trim()} style={estilo}>
      <span>{titulo}</span>
      <strong>
        {variacion == null ? (
          valor
        ) : (
          <span className="valor-indicador">
            <span className="cifra">{valor}</span>
            <small className="variacion" title={variacion.detalle}>
              {variacion.texto}
            </small>
          </span>
        )}
      </strong>
    </article>
  );
}

export function FilaIndicadores({ children }) {
  return <section className="indicadores">{children}</section>;
}

export function Indicador({ titulo, valor, tono, clase = "", estilo }) {
  return (
    <article className={`indicador tono-${tono} ${clase}`.trim()} style={estilo}>
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </article>
  );
}

export function FilaIndicadores({ children }) {
  return <section className="indicadores">{children}</section>;
}

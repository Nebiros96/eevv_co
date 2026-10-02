export function Indicador({ titulo, valor, tono }) {
  return (
    <article className={`indicador tono-${tono}`}>
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </article>
  );
}

export function FilaIndicadores({ children }) {
  return <section className="indicadores">{children}</section>;
}

export function Tarjeta({ titulo, children, cargando, error }) {
  return (
    <section className="tarjeta">
      <h2>{titulo}</h2>
      <div className="tarjeta-cuerpo">
        {cargando ? <p className="aviso">Cargando…</p> : null}
        {!cargando && error ? <p className="aviso error">{error}</p> : null}
        {!cargando && !error ? children : null}
      </div>
    </section>
  );
}

export function Vacio({ children }) {
  return <p className="aviso">{children}</p>;
}

import { COLORES, entero } from "@/estilos/tema";

function anchoDe(contenido) {
  return String(contenido).length * 6.6;
}

function dibujar(x, y, contenido, ancla) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={ancla}
      dominantBaseline="middle"
      fontSize={11}
      fontWeight={650}
      fill={COLORES.tinta}
      stroke="#fff"
      strokeWidth={3}
      paintOrder="stroke"
      style={{ pointerEvents: "none" }}
    >
      {contenido}
    </text>
  );
}

export function crearEtiquetas() {
  const puestas = [];
  const decisiones = new Map();

  function libre(x, y, ancho) {
    return !puestas.some(
      (otra) => Math.abs(otra.x - x) < (otra.ancho + ancho) / 2 + 4 && Math.abs(otra.y - y) < 13,
    );
  }

  function tomar(x, y, ancho) {
    if (!libre(x, y, ancho)) return false;
    puestas.push({ x, y, ancho });
    return true;
  }

  function unaVez(clave, calcular) {
    if (decisiones.has(clave)) return decisiones.get(clave);
    const nodo = calcular();
    decisiones.set(clave, nodo);
    return nodo;
  }

  return {
    punto({ x, y, value, index }) {
      if (!Number.isFinite(Number(value))) return null;
      return unaVez(`p|${index}|${value}|${Math.round(x)}|${Math.round(y)}`, () => {
        const contenido = entero(value);
        const ancho = anchoDe(contenido);
        for (const py of [y - 12, y + 14, y - 26, y + 28, y - 40]) {
          if (tomar(x, py, ancho)) return dibujar(x, py, contenido, "middle");
        }
        return null;
      });
    },
    derecha({ x, y, width, height, value, index }) {
      if (!Number.isFinite(Number(value))) return null;
      return unaVez(`d|${index}|${value}|${Math.round(x)}|${Math.round(width)}`, () => {
        const contenido = entero(value);
        const ancho = anchoDe(contenido);
        const px = x + Math.max(width, 0) + 6 + ancho / 2;
        const py = y + height / 2;
        tomar(px, py, ancho);
        return dibujar(px, py, contenido, "middle");
      });
    },
    extremo({ x, y, width, height, value, index }) {
      if (!Number.isFinite(Number(value))) return null;
      return unaVez(`e|${index}|${value}|${Math.round(x)}|${Math.round(width)}`, () => {
        const contenido = entero(Math.abs(value));
        const ancho = anchoDe(contenido);
        const negativo = Number(value) < 0 || width < 0;
        const izquierda = width < 0 ? x + width : x;
        const derechaBarra = width < 0 ? x : x + width;
        const largo = Math.abs(width);
        const dentro = largo > ancho + 12;
        let px = dentro
          ? negativo
            ? derechaBarra - 8 - ancho / 2
            : izquierda + 8 + ancho / 2
          : negativo
            ? izquierda - 6 - ancho / 2
            : derechaBarra + 6 + ancho / 2;
        const py = y + height / 2;
        if (!libre(px, py, ancho)) px += negativo ? -ancho * 0.55 : ancho * 0.55;
        tomar(px, py, ancho);
        if (!dentro) return dibujar(px, py, contenido, "middle");
        return (
          <text
            x={px}
            y={py}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={650}
            fill="#fff"
            style={{ pointerEvents: "none" }}
          >
            {contenido}
          </text>
        );
      });
    },
    arriba({ x, y, width, value, index }) {
      if (!Number.isFinite(Number(value))) return null;
      return unaVez(`a|${index}|${value}|${Math.round(x)}|${Math.round(y)}`, () => {
        const contenido = entero(value);
        const ancho = anchoDe(contenido);
        const cx = x + width / 2;
        for (const py of [y - 10, y - 23, y - 36]) {
          if (tomar(cx, py, ancho)) return dibujar(cx, py, contenido, "middle");
        }
        return null;
      });
    },
  };
}

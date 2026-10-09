import { useEffect, useRef } from "react";
import { COLORES_TEMA, echarts, TEMA } from "@/graficos/echarts/motor";

export function Grafico({ opcion, alto = 320, llenar = false, cargando = false }) {
  const caja = useRef(null);
  const instancia = useRef(null);

  useEffect(() => {
    const grafico = echarts.init(caja.current, TEMA, { renderer: "canvas" });
    instancia.current = grafico;
    const observador = new ResizeObserver(() => grafico.resize());
    observador.observe(caja.current);
    return () => {
      observador.disconnect();
      grafico.dispose();
      instancia.current = null;
    };
  }, []);

  useEffect(() => {
    instancia.current?.setOption(opcion, { replaceMerge: ["series", "graphic"] });
  }, [opcion]);

  useEffect(() => {
    const grafico = instancia.current;
    if (!grafico) return;
    if (cargando) {
      grafico.showLoading("default", {
        text: "",
        color: COLORES_TEMA.nacimientos,
        maskColor: "rgba(255, 255, 255, 0.6)",
      });
    } else {
      grafico.hideLoading();
    }
  }, [cargando]);

  return (
    <div
      ref={caja}
      className={llenar ? "grafica-echarts grafica-echarts-llenar" : "grafica-echarts"}
      style={llenar ? { minHeight: alto } : { height: alto }}
    />
  );
}

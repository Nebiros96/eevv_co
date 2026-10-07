import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const raiz = fileURLToPath(new URL(".", import.meta.url));
const datos = path.resolve(raiz, "../datos");

function servirDatos() {
  const middleware = (req, res, next) => {
    const nombre = decodeURIComponent((req.url || "").split("?")[0].replace(/^\/+/, ""));
    if (!/^[\w.-]+\.parquet$/.test(nombre)) {
      next();
      return;
    }
    const archivo = path.join(datos, nombre);
    if (!fs.existsSync(archivo)) {
      next();
      return;
    }
    res.setHeader("Content-Type", "application/vnd.apache.parquet");
    fs.createReadStream(archivo).pipe(res);
  };

  return {
    name: "servir-datos",
    configureServer(server) {
      server.middlewares.use("/datos", middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/datos", middleware);
    },
    writeBundle() {
      const dist = path.resolve(raiz, "dist");
      fs.writeFileSync(path.join(dist, ".nojekyll"), "");
      const destino = path.join(dist, "datos");
      fs.mkdirSync(destino, { recursive: true });
      for (const nombre of fs.readdirSync(datos)) {
        if (nombre.endsWith(".parquet")) {
          fs.copyFileSync(path.join(datos, nombre), path.join(destino, nombre));
        }
      }
    },
  };
}

export default defineConfig({
  base: "/",
  plugins: [react(), servirDatos()],
  resolve: {
    alias: {
      "@": path.resolve(raiz, "src"),
    },
  },
  server: {
    port: 5173,
  },
  optimizeDeps: {
    exclude: ["@duckdb/duckdb-wasm"],
  },
  worker: {
    format: "es",
  },
});

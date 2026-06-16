import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // ⚙️ Añadimos esta sección para domar los puertos de Docker:
  server: {
    host: true,      // Permite que se pueda acceder desde fuera del contenedor
    port: 3000,      // Forzamos a Vite a escuchar en el puerto 3000 (el de la Intra)
    watch: {
      usePolling: true, // Asegura que los cambios de código se actualicen al momento en Docker
    },
  },
});
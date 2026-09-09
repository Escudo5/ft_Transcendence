import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl"; // 👈 1. Importamos el plugin

export default defineConfig({
  plugins: [
    react(),
    basicSsl(), // 👈 2. Añadimos el plugin aquí
  ],
  build: {
    target: ['es2020', 'firefox90', 'safari15'],
  },
  // ⚙️ Añadimos esta sección para domar los puertos de Docker:
  server: {
    https: true,     // 👈 3. Activamos HTTPS
    host: true,      // Permite que se pueda acceder desde fuera del contenedor
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://backend:8000/',
        secure: false,
      },
    },      // Forzamos a Vite a escuchar en el puerto 3000 (el de la Intra)
    watch: {
      usePolling: true, // Asegura que los cambios de código se actualicen al momento en Docker
    },
  },
});
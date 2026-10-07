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
    // 🔀 Que las peticiones OPTIONS lleguen al backend: el CORS de Vite va
    // antes del proxy y las contestaba él con un 204 vacío, y el botón
    // OPTIONS de la documentación de la API fallaba.
    cors: { preflightContinue: true },
    // hmr: {
    //   host: 'transcendence.42.fr',
    //   port: 3000,
    //   protocol: 'wss',
    // },
    proxy: {
      '/api': {
        target: 'https://backend:8000/',
        secure: false,
      },
      // 🎨 Las páginas que pinta Django (documentación de la API, /admin/)
      // piden sus CSS y JS a /static/. Sin esto los contesta Vite con el
      // index.html de React: salen sin estilos y con errores en la consola.
      '/static': {
        target: 'https://backend:8000/',
        secure: false,
      },
    },      // Forzamos a Vite a escuchar en el puerto 3000 (el de la Intra)
    watch: {
      usePolling: true, // Asegura que los cambios de código se actualicen al momento en Docker
    },
  },

  /* 📱 SERVIDOR DE LA PWA (`make pwa`): sirve la compilación ya hecha, porque
   * el service worker solo se registra en producción (main.jsx mira
   * import.meta.env.PROD).
   *
   * ⚠️ SIN HTTPS A PROPÓSITO: Chrome no registra un service worker con un
   * certificado autofirmado, y http://localhost es contexto seguro siempre.
   * Por eso se abre como http://localhost:4173 en la propia máquina: por la
   * IP no es contexto seguro y no arranca.
   */
  preview: {
    https: false,
    host: true,
    port: 4173,
    proxy: {
      '/api': {
        target: 'https://backend:8000/',
        secure: false,
      },
      // El mismo motivo que arriba: ver el comentario del proxy de `server`.
      '/static': {
        target: 'https://backend:8000/',
        secure: false,
      },
    },
  },
});
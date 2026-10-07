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
    // 🔀 Que las peticiones OPTIONS lleguen al backend.
    //
    // Vite trae un middleware de CORS que va ANTES del proxy y que contesta
    // él mismo a cualquier OPTIONS con un 204 vacío, sin reenviarlo. Por eso
    // el botón OPTIONS de la documentación de la API daba un error de
    // JavaScript: recibía un 204 sin cuerpo donde esperaba la respuesta de
    // Django. Con `preflightContinue` el middleware deja pasar y el OPTIONS
    // sigue su camino hasta el backend. (Nacho, 7/10)
    cors: { preflightContinue: true },
    hmr: {
      host: 'transcendence.42.fr',
      port: 3000,
      protocol: 'wss',
    },
    proxy: {
      '/api': {
        target: 'https://backend:8000/',
        secure: false,
      },
      // 🎨 Las páginas que pinta Django (la documentación de la API pública en
      // /api/publica/, y el /admin/) piden sus CSS y JS a /static/. Sin esta
      // línea esas peticiones no llegan al backend: las contesta Vite con el
      // index.html de React, y el navegador rechaza el HTML donde esperaba
      // CSS ("su tipo MIME, text/html, no es text/css"). La página sale sin
      // estilos y la consola se llena de errores. (Nacho, 7/10)
      '/static': {
        target: 'https://backend:8000/',
        secure: false,
      },
    },      // Forzamos a Vite a escuchar en el puerto 3000 (el de la Intra)
    watch: {
      usePolling: true, // Asegura que los cambios de código se actualicen al momento en Docker
    },
  },

  /* 📱 EL SERVIDOR DE LA PWA (Nacho, 24/09)
   *
   * `npm run dev` NO sirve para enseñar la PWA: el service worker solo se
   * registra en la compilación de producción (main.jsx mira
   * import.meta.env.PROD, que en el modo dev es false). Sin él no hay ni
   * instalación ni modo sin conexión, que es justo lo que pide el módulo.
   *
   * Esto sirve la compilación ya hecha, que es donde la PWA existe de verdad.
   * Se lanza con `make pwa`.
   *
   * ⚠️ AQUÍ VA SIN HTTPS A PROPÓSITO, y no es un descuido.
   * Un service worker solo arranca en un "contexto seguro", y Chrome se
   * NIEGA a registrarlo si el certificado da error. El nuestro es
   * autofirmado (el plugin basic-ssl), así que por https daría error y no
   * habría PWA que enseñar. En cambio `http://localhost` es contexto seguro
   * SIEMPRE, por definición del navegador, y no hay certificado de por medio.
   *
   * ⚠️ POR ESO HAY QUE ABRIRLO COMO http://localhost:4173, en la propia
   * máquina que lo lanza. Por la IP (http://10.19.x.x:4173) NO es contexto
   * seguro y el service worker no arrancaría.
   *
   * El proxy es el mismo que el de arriba: sin él la compilación no sabría a
   * dónde mandar las peticiones de /api y la web saldría vacía.
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
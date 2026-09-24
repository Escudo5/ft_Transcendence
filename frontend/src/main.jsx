import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

/* 📱 EL SERVICE WORKER DE LA PWA
 *
 * Solo se registra en la compilacion de produccion, y es A PROPOSITO: en el
 * modo dev un service worker que guarda copias pelea con el recargado en
 * caliente de Vite y acabas viendo codigo viejo sin enterarte.
 *
 * ⚠️ LO QUE ESO SIGNIFICA: con `npm run dev` (o sea, como levantamos el
 * proyecto a diario) la PWA NO existe. No hay instalacion ni modo sin
 * conexion, que son las dos cosas que pide el modulo.
 *
 * Para verla y para poder ENSENARLA en la evaluacion:  make pwa
 * Eso compila y la sirve en http://localhost:4173. El porque de ese puerto y
 * de que sea http y no https esta explicado en frontend/vite.config.js.
 */
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("No se pudo registrar la PWA:", error);
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

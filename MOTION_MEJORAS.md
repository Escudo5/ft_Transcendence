# Mejoras de animacion con Motion

Este documento explica que se ha cambiado en la interfaz y los conceptos basicos para entenderlo aunque no se conozca frontend.

## 1. Que es Motion

Motion es una libreria de JavaScript para animar interfaces de React. En este proyecto ya estaba instalada bajo el nombre anterior **Framer Motion**:

```js
import { motion } from 'framer-motion';
```

Una animacion puede cambiar, por ejemplo, la opacidad, la posicion o el tamano de un elemento durante un tiempo. Motion permite describir ese cambio directamente en JSX, que es la sintaxis que usamos para escribir la interfaz.

No hemos cambiado de libreria ni hemos sustituido la arquitectura del proyecto. Esto reduce el riesgo de romper el album, el inventario, el perfil o el chat.

## 2. Conceptos basicos

### Componente

Un componente es una pieza reutilizable de la pantalla. Por ejemplo:

- `Home.jsx`: portada.
- `Catalogo.jsx`: album.
- `ChatSocial.jsx`: chat.
- `TiendaSobres.jsx`: apertura de sobres.

Un componente recibe datos, muestra HTML y puede reaccionar a acciones del usuario.

### Estado

El estado es un dato que puede cambiar y hace que React vuelva a pintar una parte de la pantalla. Por ejemplo, `chatSeleccionado` indica si estamos viendo la lista o una conversacion.

Las animaciones no cambian esos datos. Solo suavizan visualmente el cambio que ya estaba ocurriendo.

### Propiedad o prop

Una prop es una opcion que se pasa a un componente. En Motion usamos props especiales:

```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
/>
```

- `initial`: estado inicial.
- `animate`: estado final.
- `transition`: duracion y forma del movimiento.
- `whileHover`: estado mientras el raton esta encima.
- `whileTap`: estado mientras se pulsa.
- `whileFocus`: estado mientras el elemento tiene el foco del teclado.
- `exit`: estado de salida antes de desaparecer.

### Modal

Un modal es una ventana que aparece encima de la pagina y obliga a prestar atencion a su contenido. En Home, al pulsar una carta del equipo, se abre un modal con la carta ampliada.

El modal existente ya tenia accesibilidad: se puede cerrar haciendo clic fuera o pulsando `Escape`. Ahora ademas aparece y desaparece con una transicion suave.

### `AnimatePresence`

Normalmente React elimina un elemento inmediatamente cuando una condicion deja de cumplirse. `AnimatePresence` permite mantenerlo un instante para ejecutar su animacion de salida:

```jsx
<AnimatePresence>
  {elementoVisible && (
    <motion.div exit={{ opacity: 0 }} />
  )}
</AnimatePresence>
```

En este proyecto se utiliza para:

- El modal de las cartas del equipo.
- El cambio entre estado vacio y conversacion del chat.

La `key` identifica de forma estable el elemento que entra o sale. Por eso el modal usa el login de la persona y el chat usa las claves `conversation` y `empty-chat`.

## 3. Cambios realizados

### Movimiento reducido global

En `frontend/src/App.jsx` se ha añadido:

```jsx
<MotionConfig reducedMotion="user">
  ...
</MotionConfig>
```

Esto respeta la preferencia de accesibilidad del sistema operativo. Si una persona activa "Reducir movimiento", Motion desactiva desplazamientos, escalados y otras transformaciones físicas, conservando cambios menos agresivos como la opacidad.

Esto protege a personas sensibles a animaciones y evita cargar de trabajo innecesario un movil.

### Home

En `frontend/src/components/Home.jsx`, las cinco tarjetas del equipo ahora:

- Aparecen con una opacidad que pasa de 0 a 1.
- Suben unos pocos pixeles al entrar.
- Se elevan ligeramente al pasar el raton.
- Se encogen un poco al pulsarlas.
- Responden suavemente al foco del teclado.

Estas animaciones son cortas y no cambian el ancho, el alto ni la posicion estructural de la cuadricula.

El modal de la carta ampliada usa `AnimatePresence` para aparecer y desaparecer con un fundido.

### Album

En `frontend/src/components/Catalogo.jsx`, cada carta real del album:

- Entra con un pequeno desplazamiento vertical, al mismo tiempo que las demas cartas para que todas respondan igual al hover.
- Aparece gradualmente.
- Tiene una pequena respuesta al pulsarla.
- Tiene una respuesta visual al recibir foco de teclado.

No se ha modificado la busqueda, los filtros, la paginacion ni las peticiones al backend.

### Chat

En `frontend/src/components/ChatSocial.jsx`, el cambio entre el estado sin conversacion y una conversacion usa `AnimatePresence`.

En movil, la lista y la conversacion siguen mostrandose una a una, como ya exigia el diseño responsive. Motion solo suaviza el cambio; no modifica:

- Los mensajes.
- El envio.
- La lista de amigos.
- Las solicitudes.
- El bloqueo de usuarios.
- La comunicacion con Django.

### Sobres

La apertura del sobre ya utilizaba Motion. Se conserva su animacion de:

- Entrada del sobre.
- Toques de apertura.
- Salida de las cinco cartas.
- Giro de cada carta.
- Aparicion del boton final.

Ademas, el boton `SALIR DE ESTA APERTURA` tiene ahora contraste suficiente para movil y escritorio.

## 4. Por que se usan `opacity` y `transform`

`opacity` cambia la transparencia. `transform` cambia visualmente posicion, escala o rotacion sin tener que recalcular toda la pagina en cada fotograma.

Por eso son preferibles para animaciones pequenas:

```jsx
animate={{ opacity: 1, y: 0 }}
```

Se han evitado animaciones continuas de `width`, `height`, `top` o `left`, porque pueden obligar al navegador a recalcular el layout. En un telefono eso puede producir tirones y gastar mas bateria.

## 5. Compatibilidad

Se mantiene `framer-motion`, que ya formaba parte del proyecto. No se ha hecho una migracion a `motion/react` para evitar cambios innecesarios de dependencias e imports.

Las animaciones usan APIs estables:

- Opacidad.
- Transformaciones.
- Eventos de foco, hover y pulsacion.
- `AnimatePresence`.
- `MotionConfig`.

Se deben probar en:

- Chrome.
- Firefox.
- Safari.
- Android.
- iPhone o Safari de macOS.

El build de Vite se valida con:

```bash
cd frontend
npm run build
```

## 6. Como probarlo manualmente

### Home

1. Abre Home.
2. Observa como aparecen las cinco tarjetas.
3. Pasa el raton por encima de una tarjeta en escritorio.
4. En movil, pulsa una tarjeta.
5. Cierra el modal con `Escape` o pulsando fuera.
6. Usa `Tab` para llegar a una tarjeta y pulsa `Enter`.

### Album

1. Entra en `Ver Album`.
2. Observa la entrada de las cartas.
3. Comprueba que buscar, filtrar y paginar siguen funcionando.
4. Usa `Tab` para comprobar el foco.

### Chat

1. Entra en ChatSocial.
2. Selecciona un amigo.
3. Comprueba el cambio suave a la conversacion.
4. En movil, pulsa la flecha de volver.
5. Comprueba que vuelves a la lista.
6. Envia un mensaje para verificar que la animacion no ha cambiado la logica.

### Reducir movimiento

En el sistema operativo activa la opcion de reducir movimiento y repite las pruebas. Las animaciones de desplazamiento y escala deben reducirse o desaparecer, sin perder la informacion ni la navegacion.

## 7. Decisiones que no se han aplicado

No se ha añadido un cursor personalizado, parallax, drag en el chat ni animaciones pesadas en los fondos WebGL. Esas funciones pueden ser llamativas, pero no mejoran las tareas principales y pueden perjudicar:

- El uso tactil.
- La accesibilidad.
- El rendimiento en moviles.
- La bateria.

Tampoco se ha aplicado `LazyMotion` porque exigiria sustituir los componentes `motion` por `m` y reorganizar la carga de la libreria. El bundle actual compila correctamente y la prioridad era no romper una aplicación que ya funciona.

## Resumen

El resultado es una interfaz mas cuidada sin cambiar la logica:

```text
MotionConfig
  -> respeta reducir movimiento
Home
  -> entrada de tarjetas y modal animado
Album
  -> entrada suave de cartas
Chat
  -> transicion entre lista y conversacion
Sobres
  -> conserva sus animaciones existentes
```

La regla principal es que una animacion debe ayudar a entender un cambio. Si solo decora, aumenta el coste y dificulta la accesibilidad, no merece la pena anadirla.

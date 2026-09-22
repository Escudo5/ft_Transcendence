# Internacionalización del frontend

La aplicación tiene ahora tres idiomas:

- `es`: Español, dirección izquierda a derecha (`ltr`).
- `en`: English, dirección izquierda a derecha (`ltr`).
- `ar`: العربية, dirección derecha a izquierda (`rtl`).

El selector está disponible en la esquina superior derecha y la elección se guarda en `localStorage` con la clave `ft-transcendence-language`.

## Qué se ha añadido

- `frontend/src/i18n.jsx`: diccionario, contexto React, selector y cambio global de `lang`/`dir`.
- `frontend/src/App.jsx`: `I18nProvider` envuelve toda la aplicación.
- `frontend/src/styles.css`: selector accesible y estilos compatibles con RTL.
 `Acceso.jsx`, `Home.jsx`, `Catalogo.jsx`, `Contratos.jsx`, `Ranking.jsx`,
  búsquedas, solicitudes y avisos globales: textos de interfaz conectados a
  traducciones, incluidos filtros, paginación, estados vacíos y etiquetas
  accesibles.

## Cómo probarlo

La infraestructura ya está lista. Todavía conviene migrar las pantallas de
perfil, chat, intercambios, tienda y contenido legal siguiendo el mismo patrón;
son módulos independientes y sus textos deben añadirse al diccionario sin
mezclarlos con los del catálogo.
```bash
cd frontend
npm run dev
```

Abre la URL que muestre Vite, cambia el selector a `AR` y comprueba que:

1. El texto se traduce en acceso y portada.
2. La dirección del contenido cambia automáticamente.
3. El selector se mueve al lado opuesto.
4. Al recargar, el idioma elegido se conserva.

Para validar una compilación de producción:

```bash
cd frontend
npm run build
```

## Cómo traducir otro componente

1. Importa el hook:

```jsx
import { useI18n } from '../i18n';
```

2. Obtén la función `t` dentro del componente:

```jsx
const { t } = useI18n();
```

3. Sustituye texto fijo por una clave:

```jsx
<h2>{t('myNewTitle')}</h2>
```

4. Añade esa misma clave a `es`, `en` y `ar` en `frontend/src/i18n.jsx`:

```jsx
myNewTitle: 'Título en español',
```

```jsx
myNewTitle: 'Title in English',
```

```jsx
myNewTitle: 'العنوان بالعربية',
```

Si falta una traducción, el sistema usa primero el español y, si tampoco existe, muestra el nombre de la clave. Esto evita que una pantalla quede vacía durante una migración parcial.

## Fechas, números y ordenación

No fijes `es-ES` en un componente. Usa la configuración activa:

```jsx
const { languageInfo } = useI18n();
const fecha = new Intl.DateTimeFormat(languageInfo.locale, {
  dateStyle: 'medium',
}).format(new Date(valor));
```

Para números:

```jsx
const { languageInfo } = useI18n();
const puntos = new Intl.NumberFormat(languageInfo.locale).format(valor);
```

Para ordenar nombres, usa el locale activo:

```jsx
const { languageInfo } = useI18n();
lista.sort((a, b) => a.nombre.localeCompare(b.nombre, languageInfo.locale));
```

## Reglas importantes para RTL

- Usa `margin-inline-start/end`, `padding-inline-start/end`, `inset-inline-start/end` y `text-align: start/end` en código nuevo.
- No inviertas manualmente iconos direccionales que representen una acción física, como el botón de reproducir.
- Revisa especialmente flexbox, paginación, chat y formularios en una ventana estrecha.
- Evita texto concatenado. Usa variables en una clave cuando el orden pueda cambiar:

```jsx
t('welcomeUser', { name: usuario.nombre })
```

- Todo texto nuevo debe tener entrada en los tres diccionarios.

## Orden recomendado para completar la migración

1. Navegación y botones compartidos.
2. Catálogo, ranking y perfil.
3. Chat, intercambios y tienda.
4. Mensajes de error, avisos y textos legales.
5. Fechas, números, `aria-label`, `title` y placeholders.

La infraestructura ya está lista; la migración restante consiste en reemplazar textos fijos por claves siguiendo el patrón anterior.

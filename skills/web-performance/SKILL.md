---
name: web-performance
description: Performance, accessibility, SEO, and library selection skill. Applies Core Web Vitals targets, hardware acceleration rules, DOM cost awareness, Z-index discipline, WCAG requirements, and Emil Kowalski's pick-ui-library recommendations. Runs alongside layout and animation to ensure the final product is fast, accessible, and uses the right tools.
---

# Web Performance, Accessibility, and Tech Selection

> A professional website must be fast, accessible, discoverable, and built with the right tools.

---

## 1. CORE WEB VITALS TARGETS

Every project must target these baseline metrics:

### 1.A LCP (Largest Contentful Paint) < 2.5s
- The hero image MUST be `priority` loaded or preloaded.
- Use `loading="eager"` or `fetchpriority="high"` for above-the-fold images.
- Use `loading="lazy"` for all images below the fold.
- Avoid large CSS/JS blocking the initial render.
- Do not rely on JS to render the critical text in the hero.

### 1.B INP (Interaction to Next Paint) < 200ms
- Offload heavy work from the main thread.
- Break up long tasks (>50ms) using `setTimeout` or `requestIdleCallback`.
- CSS animations > JS animations for simple state changes.
- Ensure event listeners are passive where possible (e.g., `{ passive: true }` on touch/scroll).

### 1.C CLS (Cumulative Layout Shift) < 0.1
- **Always reserve space** for images, fonts, and embeds by specifying `width` and `height` attributes or aspect ratios.
- Never insert dynamic content above existing content without user interaction.
- Preload web fonts or use `font-display: swap` to minimize FOIT (Flash of Invisible Text), and provide tight fallback font stacks to minimize layout shift when the font swaps.

---

## 2. DOM COST AND RENDERING

### 2.A Hardware Acceleration
- Apply grain/noise filters EXCLUSIVELY to fixed, `pointer-events-none` pseudo-elements.
  - Example: `fixed inset-0 z-[60] pointer-events-none`.
- **NEVER** apply expensive filters (blur, grain, mix-blend-mode) on scrolling containers or elements that move continuously. GPU repaints destroy mobile FPS.
- Only animate `transform` and `opacity`. Animating layout properties (`width`, `height`, `margin`, `top`, `left`) causes layout thrashing.

### 2.B Z-Index Discipline
- **NEVER spam arbitrary `z-50` or `z-9999`.**
- Use z-index strictly for systemic layer contexts.
- Example scale:
  - 10: sticky headers
  - 20: dropdowns/popovers
  - 30: fixed overlays/backdrops
  - 40: modals/dialogs
  - 50: toasts/notifications
  - 60: global grain/pointer-events-none effects

---

## 3. ACCESSIBILITY (A11Y) BASELINE

### 3.A Contrast & Visuals
- Body text must meet WCAG AA minimum contrast (4.5:1).
- Large text (bold >18px or regular >24px) must meet 3:1.
- Honor `prefers-reduced-motion` at all times.
- Honor `prefers-color-scheme` unless explicitly overridden by the brand.

### 3.B Interaction & Semantics
- Use semantic HTML: `<nav>`, `<main>`, `<footer>`, `<article>`, `<section>`, `<header>`.
- Use `<button>` for actions, `<a>` for navigation. NEVER use `<div onclick="...">`.
- Focus states MUST be visible for keyboard navigation. Never use `outline: none` without a custom focus ring replacement.
- Touch targets must be at least 44x44px.
- Use `cursor: pointer` on all interactive elements.
- Include `alt` text for all informative images, and `alt=""` for decorative ones.

---

## 4. SEO BEST PRACTICES

Automatically implement these on every page:
- **Title Tags**: Descriptive, unique title tags for every page. Format: `Page Name - Brand Name`.
- **Meta Descriptions**: Compelling summary of the page content (120-150 chars).
- **Heading Hierarchy**: Exactly one `<h1>` per page. Do not skip heading levels (e.g., `<h2>` to `<h4>`).
- **Canonical URLs**: Use canonical tags to prevent duplicate content issues.
- **Open Graph / Twitter Cards**: Include standard `og:title`, `og:description`, `og:image`, `twitter:card` meta tags.
- **Semantic Structure**: Use proper HTML5 elements so screen readers and crawlers understand the document structure.

---

## 5. UI LIBRARY SELECTION (Emil Kowalski's Picks)

Use the right tool for the job. Do not reinvent complex primitives.

### 5.A UI Primitives & Components
| Task | Recommended Library |
|---|---|
| Unstyled, accessible UI components (dialogs, menus, selects) | Base UI (base-ui.com) |
| Command menus (Cmd+K) | cmdk |
| Toasts / notifications | Sonner |
| OTP / verification inputs | input-otp |

### 5.B Motion & Visuals
| Task | Recommended Library |
|---|---|
| General-purpose animation (springs, layout) | Motion (formerly Framer Motion) |
| Animating numbers (counters, prices) | NumberFlow |
| Syntax highlighting | Shiki |
| 3D globes | Cobe |

### 5.C Interaction & State
| Task | Recommended Library |
|---|---|
| Drag and drop | dnd kit |
| Virtualization (long lists, large tables) | Virtuoso |
| Global state (React) | Zustand |
| Data fetching (React) | TanStack Query |

### 5.D Styling
| Task | Recommended Approach |
|---|---|
| Utility classes / Rapid prototyping | Tailwind CSS |
| Component-scoped styles (React) | CSS Modules or Tailwind |
| Class merging (with Tailwind) | tailwind-merge + clsx |

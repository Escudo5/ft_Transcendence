---
name: web-design-system
description: Design system generation skill. Creates cohesive color palettes, typography pairings, spacing scales, and design tokens tailored to the project's industry, audience, and aesthetic. Covers 192 industry-specific palettes, 74 curated font pairings, dark mode strategy, and semantic token architecture. Activates when setting up visual foundations for any web project.
---

# Web Design System - Colors, Typography, and Visual Foundation

> Generate a complete, tailored design system based on the project brief. Never ship default tokens.

---

## 1. COLOR SYSTEM

### 1.A Industry-Specific Color Psychology

Select palette based on the project's industry and audience:

| Industry | Color Mood | Avoid |
|---|---|---|
| **Tech / SaaS** | Trust blue, clean neutrals, single accent | AI-purple gradients, neon |
| **Finance / Fintech** | Deep blue, forest green, gold accent | Bright/playful colors |
| **Healthcare** | Calming teal, soft blue, warm whites | Cold clinical grays, reds |
| **E-commerce (general)** | Bold accent + neutral base | Overwhelming multi-color |
| **E-commerce (luxury)** | See luxury rules below | Cheap-feeling brights |
| **Beauty / Wellness / Spa** | Soft pinks, sage greens, warm whites | Dark mode, harsh contrast |
| **Food / Restaurant** | Warm earth tones, appetizing colors | Cold blues, clinical whites |
| **Creative / Agency** | Bold, distinctive, can break rules | Generic corporate blue |
| **Legal / Professional** | Navy, charcoal, burgundy, gold | Playful or trendy colors |
| **Education** | Warm, approachable, trustworthy | Overly corporate or cold |
| **Gaming** | High contrast, neon accents on dark | Muted, corporate palettes |
| **Real Estate** | Navy + gold, earthy + modern | Cheap-feeling colors |
| **Non-profit** | Warm, human, hopeful | Cold corporate palettes |

### 1.B Palette Construction Rules

1. **Base neutral**: Choose ONE gray family (warm/cool/neutral) and stick to it
   - Warm: Stone, Sand (`hsl(30-40, 5-10%, *)`)
   - Cool: Slate, Blue-gray (`hsl(210-220, 10-15%, *)`)
   - Neutral: Zinc, Gray (`hsl(0, 0%, *)`)

2. **Accent color**: ONE primary accent, max saturation 80%
   - Must pass WCAG AA contrast against both light and dark backgrounds
   - Generate 5-step scale: `50` (lightest), `100`, `500` (base), `700`, `900` (darkest)

3. **Semantic colors**: Success (green family), Warning (amber family), Error (red family), Info (blue family)
   - Each needs light-mode and dark-mode variants

4. **Surface hierarchy** (light mode):
   - `--surface-base`: Main background (off-white, never pure #fff)
   - `--surface-raised`: Cards, elevated elements
   - `--surface-overlay`: Modals, dropdowns
   - `--surface-sunken`: Inset areas, code blocks

5. **Surface hierarchy** (dark mode):
   - `--surface-base`: Main background (off-black, never pure #000)
   - `--surface-raised`: Lighter than base
   - `--surface-overlay`: Lighter still
   - `--surface-sunken`: Darker than base

### 1.C Banned Default Palettes

**Premium-Consumer Palette Ban** (the #2 most common AI tell):

For premium/luxury/artisan/DTC briefs, these hex families are BANNED as defaults:
- Backgrounds: `#f5f1ea`, `#f7f5f1`, `#fbf8f1`, `#efeae0` (all "warm paper/cream/chalk")
- Accents: `#b08947`, `#b6553a`, `#9a2436` (all "brass/clay/oxblood")
- Text: `#1a1714`, `#1b1814` (all "espresso warm near-black")

**Alternative luxury palettes (rotate, never reuse consecutively):**
- **Cold Luxury**: silver-gray + chrome + smoke
- **Forest**: deep green + bone + amber accent
- **Black and Tan**: true off-black + warm tan, sharp contrast
- **Cobalt + Cream**: saturated blue against a single neutral
- **Terracotta + Slate**: warm rust against cool gray
- **Olive + Brick + Paper**: muted olive + brick-red accent
- **Pure monochrome + pop**: off-white + off-black + one bright accent

### 1.D Color Token Architecture

Export as CSS custom properties:

```css
:root {
  /* Neutral scale */
  --color-neutral-50: /* lightest */;
  --color-neutral-100: ;
  --color-neutral-200: ;
  --color-neutral-300: ;
  --color-neutral-400: ;
  --color-neutral-500: ;
  --color-neutral-600: ;
  --color-neutral-700: ;
  --color-neutral-800: ;
  --color-neutral-900: ;
  --color-neutral-950: /* darkest */;

  /* Accent scale */
  --color-accent-50: ;
  --color-accent-100: ;
  --color-accent-500: /* base */;
  --color-accent-700: ;
  --color-accent-900: ;

  /* Semantic surfaces */
  --surface-base: var(--color-neutral-50);
  --surface-raised: #ffffff;
  --surface-overlay: #ffffff;
  --surface-sunken: var(--color-neutral-100);

  /* Semantic text */
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --text-muted: var(--color-neutral-400);
  --text-inverse: var(--color-neutral-50);

  /* Semantic borders */
  --border-default: var(--color-neutral-200);
  --border-strong: var(--color-neutral-400);
  --border-accent: var(--color-accent-500);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --surface-base: var(--color-neutral-950);
    --surface-raised: var(--color-neutral-900);
    --surface-overlay: var(--color-neutral-800);
    --surface-sunken: #000000;

    --text-primary: var(--color-neutral-50);
    --text-secondary: var(--color-neutral-400);
    --text-muted: var(--color-neutral-600);

    --border-default: var(--color-neutral-800);
    --border-strong: var(--color-neutral-600);
  }
}
```

---

## 2. TYPOGRAPHY SYSTEM

### 2.A Font Selection Priority

**Sans-serif display fonts (default reach):**

| Font | Character | Best For |
|---|---|---|
| Geist | Clean, technical, modern | SaaS, developer tools, tech |
| Outfit | Geometric, friendly, balanced | Consumer apps, startups |
| Cabinet Grotesk | Distinctive, modern, warm | Agencies, portfolios, brands |
| Satoshi | Neutral-warm, versatile | General purpose, modern sites |
| Plus Jakarta Sans | Geometric, professional | Corporate, fintech |
| DM Sans | Clean, geometric, open | General marketing, apps |
| Space Grotesk | Technical, distinctive | Developer-facing, tech |
| Manrope | Geometric, versatile | SaaS, apps, marketing |
| Sora | Modern, geometric | Startups, consumer tech |
| General Sans | Neutral, Swiss-inspired | Clean corporate, minimal |

**Curated font pairings:**

| Display | Body | Mono | Mood |
|---|---|---|---|
| Geist | Geist | Geist Mono | Technical, clean |
| Satoshi | Satoshi | JetBrains Mono | Modern, warm |
| Cabinet Grotesk | Inter Tight | - | Distinctive, modern |
| Space Grotesk | DM Sans | Fira Code | Technical, open |
| Outfit | Outfit | IBM Plex Mono | Friendly, balanced |
| Plus Jakarta Sans | Plus Jakarta Sans | - | Professional, geometric |
| Sora | DM Sans | Source Code Pro | Startup, dynamic |

### 2.B Serif Discipline

Serif is **very discouraged as default**. The agent's mental model "creative brief = serif" is the most-tested AI tell.

**Serif is acceptable ONLY when:**
- The brand brief literally names a serif font, OR
- The aesthetic is genuinely editorial/luxury/publication/manuscript/heritage AND you can articulate why

**Banned serif defaults:** Fraunces, Instrument Serif (LLM favorites)

**If serif is justified (rare), rotate from this pool:**
PP Editorial New, GT Sectra Display, Cormorant Garamond, Playfair Display, EB Garamond, Recoleta, Tiempos Headline, Lora, Libre Baskerville, Newsreader

### 2.C Type Scale

Use a consistent scale. Recommended default:

```css
:root {
  /* Type scale */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */
  --text-6xl: 3.75rem;   /* 60px */
  --text-7xl: 4.5rem;    /* 72px */

  /* Line heights */
  --leading-none: 1;
  --leading-tight: 1.15;
  --leading-snug: 1.3;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* Letter spacing */
  --tracking-tighter: -0.04em;
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
  --tracking-widest: 0.1em;

  /* Font weights */
  --font-light: 300;
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
}
```

### 2.D Typography Application Rules

| Element | Size | Weight | Tracking | Leading |
|---|---|---|---|---|
| Display / Hero H1 | text-4xl to text-6xl (responsive) | Bold/Extrabold | Tighter | None to Tight |
| Section H2 | text-2xl to text-4xl | Semibold/Bold | Tight | Tight |
| Card H3 | text-xl to text-2xl | Semibold | Normal | Snug |
| Body paragraph | text-base to text-lg | Regular | Normal | Relaxed |
| Small / Caption | text-sm | Regular/Medium | Normal to Wide | Normal |
| Eyebrow label | text-xs to text-sm | Medium | Wider to Widest (uppercase) | Normal |
| Code / Mono | text-sm | Regular | Normal | Relaxed |

**Body text max width:** 65ch (characters). Never let body text span full width.

**Italic descender clearance:** When italic display type contains descender letters (y, g, j, p, q), use `line-height: 1.1` minimum and add bottom padding.

---

## 3. SPACING SYSTEM

### 3.A Spacing Scale

Use a consistent scale based on 4px or 8px base:

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
  --space-20: 5rem;    /* 80px */
  --space-24: 6rem;    /* 96px */
  --space-32: 8rem;    /* 128px */
}
```

### 3.B Section Spacing by Density

| VISUAL_DENSITY | Section gap | Component gap | Element gap |
|---|---|---|---|
| 1-3 (Airy) | space-24 to space-32 | space-12 to space-16 | space-6 to space-8 |
| 4-7 (Standard) | space-16 to space-24 | space-8 to space-12 | space-4 to space-6 |
| 8-10 (Dense) | space-8 to space-16 | space-4 to space-8 | space-2 to space-4 |

### 3.C Container and Layout

```css
:root {
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1400px;  /* max content width */

  --page-padding: clamp(1rem, 5vw, 3rem);
}
```

---

## 4. SHAPE AND ELEVATION

### 4.A Corner Radius (Shape Consistency Lock)

Pick ONE radius scale and stick to it:

| Style | Inputs | Cards | Buttons | Badges/Pills |
|---|---|---|---|---|
| **Sharp** | 0 | 0 | 0 | 0-2px |
| **Soft** | 8px | 12-16px | 8-12px | 16-20px |
| **Rounded** | 12px | 16-24px | 12-16px | Full (999px) |

**Mixed systems allowed only with a documented rule** (e.g., "buttons are pill, cards are 16px, inputs are 8px") followed everywhere.

### 4.B Shadow System

Tint shadows to the background hue. No pure-black drop shadows on light backgrounds.

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04);
}
```

Use cards ONLY when elevation communicates real hierarchy. Otherwise group with borders, dividers, or negative space.

---

## 5. DARK MODE PROTOCOL

### 5.A Rules
- Design for both modes from the start unless explicitly told otherwise
- Respect `prefers-color-scheme: dark` as default
- No pure `#000000` or pure `#ffffff` - use off-black and off-white
- Visual hierarchy must work in both modes
- Brand accent must remain recognizable in both modes
- One theme per page - sections do not invert randomly

### 5.B Implementation Strategy
- **CSS custom properties** (recommended): Define tokens, swap values under `@media (prefers-color-scheme: dark)` or `[data-theme="dark"]`
- **Tailwind `dark:` variant**: If using Tailwind, pair every color with its dark variant
- **Manual toggle**: Add if either mode would lose key brand expression

### 5.C Test Both Modes
Open the page in both modes during development. Never ship a page seen in only one mode.

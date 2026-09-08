---
name: web-layout-patterns
description: Layout patterns and component architecture skill for web interfaces. Contains hero paradigms, navigation patterns, grid systems, card styles, scroll animations, gallery types, and section composition rules. Provides a vocabulary of 50+ named patterns with implementation guidance. Activates when building page structure, choosing layouts, or composing sections.
---

# Web Layout Patterns - Page Architecture and Component Library

> Every section needs a reason to exist and a layout that serves its content. No two sections on the same page should look identical.

---

## 1. HERO PARADIGMS

Choose based on the design read and content:

### 1.A Available Hero Patterns

| Pattern | Description | Best For | VARIANCE |
|---|---|---|---|
| **Asymmetric Split** | Text on one side, asset on the other, generous whitespace | SaaS, products, apps | 6-8 |
| **Full-Width Image** | Large hero image/video with overlaid text | Brand, lifestyle, real estate | 5-7 |
| **Editorial Manifesto** | Large type only, no asset, almost-poster | Statements, agencies, launches | 7-9 |
| **Video/Media Mask** | Type cut out as mask over video background | Creative, entertainment | 8-10 |
| **Kinetic-Type** | Animated typography as primary visual | Agencies, portfolios, experimental | 9-10 |
| **Curtain-Reveal** | Hero parts on scroll like a curtain | Storytelling, product reveals | 8-10 |
| **Scroll-Pinned** | Hero stays pinned while content scrolls behind | Immersive experiences | 8-10 |
| **Centered Minimal** | Centered headline + subtitle + CTA | Editorial, announcements | 4-6 |
| **Product Showcase** | Large product image/3D with minimal text | E-commerce, hardware | 6-8 |
| **Dashboard Preview** | Real or generated screenshot of the product | SaaS, tools | 5-7 |

### 1.B Hero Rules (Hard Requirements)

- **Must fit initial viewport**: Headline max 2 lines desktop, subtext max 20 words AND max 3-4 lines, CTAs visible without scroll
- **Max 4 text elements**: Eyebrow (optional), Headline, Subtext, CTAs (1 primary + max 1 secondary)
- **Top padding cap**: max `padding-top: 6rem` at desktop
- **Font-scale discipline**: Plan font size and image size together. >6 words headline? Don't start at text-7xl
- **BANNED in hero**: Tiny taglines below CTAs, trust micro-strips, pricing teasers, feature bullet lists, social-proof avatar rows (all move to sections below)
- **"Used by" logo wall**: Goes UNDER the hero, never inside it
- **Anti-center bias**: When VARIANCE > 4, avoid centered hero. Use split, left-aligned, or asymmetric instead
- **Hero needs a real visual**: Text + gradient blob is a placeholder, not a hero

### 1.C Hero Font Scale Guide

| Headline Length | Desktop Size | Mobile Size |
|---|---|---|
| 1-3 words | text-6xl to text-7xl | text-4xl to text-5xl |
| 4-6 words | text-5xl to text-6xl | text-3xl to text-4xl |
| 7-10 words | text-4xl to text-5xl | text-2xl to text-3xl |
| 11+ words | text-3xl to text-4xl | text-xl to text-2xl |

---

## 2. NAVIGATION PATTERNS

### 2.A Nav Types

| Pattern | Description | Best For |
|---|---|---|
| **Sticky Top Bar** | Fixed top navigation, standard | Most sites, SaaS, corporate |
| **Transparent Overlay** | Nav over hero image, becomes solid on scroll | Brand sites, portfolios |
| **Hamburger (Mobile)** | Collapsed menu for mobile viewports | All responsive sites |
| **Full-Screen Menu** | Hamburger opens full-screen overlay | Creative, agency, minimal nav |
| **Side Navigation** | Vertical nav on left side | Dashboards, documentation, apps |
| **Floating Pill** | Centered floating nav with rounded container | Modern landing pages |
| **Mega Menu** | Full-width dropdown with columns | E-commerce, enterprise |
| **Dynamic Island** | Morphing pill for status/alerts | Modern consumer apps |
| **Contextual Radial** | Circular menu at click point | Creative, experimental |

### 2.B Nav Rules

- Single line at desktop (1024px+). If items don't fit: condense labels, drop secondary items, or hamburger
- Height max 80px desktop, default 64-72px
- **No huge "agency" nav bars** eating 15% of viewport
- Logo on left, primary actions on right (convention)
- Mobile: hamburger or bottom tab bar
- Active state clearly visible
- Accessible: keyboard navigable, focus indicators

---

## 3. SECTION LAYOUT FAMILIES

Use at least 4 different families on a page with 8+ sections:

### 3.A Available Layout Families

| Family | Description | Usage Notes |
|---|---|---|
| **Full-Width Statement** | Large text, minimal elements, edge-to-edge | Manifesto, key message, CTA |
| **Split Screen (50/50)** | Two equal columns, text + media | Features, about, testimonials |
| **Asymmetric Split** | Unequal columns (60/40, 70/30) | Feature details, case studies |
| **Three-Column Grid** | NOT three equal cards. Use varied sizes | Features, benefits (with variety) |
| **Bento Grid** | Asymmetric tile grouping (mixed cell sizes) | Features, dashboard preview |
| **Masonry** | Staggered grid, no fixed row height | Portfolios, galleries, testimonials |
| **Horizontal Scroll** | Scroll-snapping horizontal cards | Testimonials, projects, categories |
| **Vertical Stack** | Simple stacked elements, centered | Pricing, FAQ, content |
| **Sticky Sidebar** | Content scrolls, sidebar pins | Documentation, long-form, articles |
| **Full-Width Image Break** | Image or video spanning full width | Visual storytelling, portfolio |
| **Testimonial Carousel** | Rotating quotes with attribution | Social proof |
| **Logo Wall** | Grid or marquee of brand logos | Trust/social proof |
| **Stats/Metrics Row** | Large numbers with labels | Results, impact, proof |
| **Timeline/Process** | Vertical or horizontal steps | How it works, history |
| **Accordion/FAQ** | Collapsible content sections | FAQ, documentation |
| **Comparison Table** | Feature comparison grid | Pricing, vs. competitors |
| **CTA Banner** | Full-width call to action | Conversion, newsletter |

### 3.B Section Composition Rules

1. **Section-Layout-Repetition Ban**: Once you use a layout family, it appears at most ONCE on the page
2. **Zigzag Alternation Cap**: Max 2 consecutive image+text split sections. 3rd is a Pre-Flight Fail
3. **Bento Cell Count**: Exactly as many cells as content items. No empty filler cells
4. **Bento Background Diversity**: At least 2-3 cells need real visual variation (images, gradients, tinted backgrounds)
5. **Split-Header Ban**: "Left big headline + right small explainer" as section header is banned. Stack vertically instead
6. **Mobile collapse explicit**: For every multi-column layout, declare the mobile fallback

### 3.C Content Density Rules

- **Default content per section**: Short headline (8 words max) + sub-paragraph (25 words max) + one visual OR one CTA
- **No data-dump sections**: 20-row tables, 30-row award lists - use top 3-5 highlights + "View full list"
- **Long lists (>5 items) need different UI**: 2-column split, card grid, tabs/accordion, scroll-snap pills, carousel, marquee
- **Spec sheet alternative**: Instead of hairlines under every row, use 2-col card grid, scroll-snap pills, grouped chunks, or featured-vs-rest

---

## 4. CARDS AND CONTAINERS

### 4.A Card Patterns

| Pattern | Description | Best For |
|---|---|---|
| **Minimal Card** | Border or subtle shadow, clean | Product listings, features |
| **Elevated Card** | Noticeable shadow, raised | Pricing tiers, key features |
| **Image Top Card** | Image header + text content | Blog posts, portfolio items |
| **Horizontal Card** | Side-by-side image + text | News, article lists |
| **Glassmorphism Panel** | Frosted glass with inner refraction | Premium consumer, media overlay |
| **Spotlight Border** | Borders illuminate under cursor | Interactive, tech products |
| **Parallax Tilt** | 3D tilt tracking mouse | Portfolios, product showcases |
| **Holographic Foil** | Iridescent rainbow shift on hover | Premium, collectibles |

### 4.B Card Rules

- Use cards ONLY when elevation communicates real hierarchy
- Otherwise group with `border-top`, `divide-y`, or negative space
- **Never nest cards inside cards**
- **Shape Consistency Lock**: One corner-radius scale for all cards
- For DENSITY > 7: card containers are banned, use plain layout with 1px dividers

---

## 5. GALLERIES AND MEDIA

| Pattern | Description | Best For |
|---|---|---|
| **Responsive Grid** | CSS Grid with auto-fit/auto-fill | Standard image galleries |
| **Masonry** | Staggered heights, packed layout | Varied-aspect photos, portfolios |
| **Lightbox** | Click-to-expand with overlay | Photo galleries, product images |
| **Carousel/Slider** | Horizontal scroll with indicators | Product images, testimonials |
| **Accordion Slider** | Narrow strips expanding on hover | Creative portfolios |
| **Hover Image Trail** | Mouse leaves popping image trail | Agency portfolios, experimental |
| **Before/After Slider** | Comparison with draggable divider | Product demos, design transformations |
| **Coverflow** | 3D carousel with angled edges | Media-heavy, premium |

---

## 6. TYPOGRAPHY AND TEXT PATTERNS

| Pattern | Description | Best For |
|---|---|---|
| **Kinetic Marquee** | Horizontal scrolling text band | Brand statements, categories |
| **Text Mask Reveal** | Large type as window to video | Creative, editorial |
| **Text Scramble** | Matrix-style decoding on load/hover | Tech, developer |
| **Gradient Stroke** | Outlined text with running gradient | Headlines, creative |
| **Circular Text Path** | Text along a spinning circle | Decorative, experimental |

**Marquee rule**: Maximum ONE per page. Two = lazy filler.

---

## 7. MICRO-INTERACTIONS

| Pattern | Description | Best For |
|---|---|---|
| **Magnetic Button** | Pulls toward cursor | CTAs, nav items |
| **Directional Hover** | Fill enters from cursor's exact side | Buttons, links |
| **Ripple Click** | Wave from click coordinates | Touch-like feedback |
| **Skeleton Shimmer** | Shifting light across placeholders | Loading states |
| **Morphing Modal** | Button expands into dialog | Actions, forms |
| **Scale Press** | Element scales down on active | All clickable elements |
| **Underline Reveal** | Animated underline on hover | Navigation links |
| **Color Shift** | Background tint on hover | Cards, list items |

### Micro-Interaction Rules

- Scale press (0.97) on ALL buttons/pressable elements
- **Motion must be motivated**: Each interaction needs a reason
- No infinite loops on informational sections
- Apply spring physics (`type: "spring", stiffness: 100, damping: 20`) - no linear easing

---

## 8. RESPONSIVE BREAKPOINTS

### 8.A Standard Breakpoints

| Name | Width | Target |
|---|---|---|
| Mobile (sm) | >= 640px | Small phones (below is default mobile) |
| Tablet (md) | >= 768px | Tablets, large phones landscape |
| Desktop (lg) | >= 1024px | Laptops, small desktops |
| Wide (xl) | >= 1280px | Standard desktops |
| Ultra-wide (2xl) | >= 1536px | Large monitors |

### 8.B Container Strategy

```css
.container {
  width: 100%;
  max-width: 1400px;  /* or var(--container-2xl) */
  margin: 0 auto;
  padding: 0 clamp(1rem, 5vw, 3rem);
}
```

### 8.C Mobile Collapse Rules

For VARIANCE 4-10: asymmetric layouts MUST collapse to single-column on mobile:
- `width: 100%` on all elements below 768px
- Horizontal padding: 1rem minimum
- Vertical padding: 2rem between sections
- Stack images above their text
- Navigation: hamburger or bottom tabs
- Horizontal scroll for card rows
- Touch targets: 44x44px minimum

---

## 9. FOOTER PATTERNS

| Pattern | Description |
|---|---|
| **Multi-Column Links** | Standard sitemap-style footer with columns |
| **Minimal** | Logo + copyright + essential links |
| **CTA Footer** | Large CTA section + minimal links |
| **Full-Width Dark** | Dark background contrasting with page |
| **Newsletter + Links** | Email signup integrated with footer |

### Footer Rules
- Always include: copyright, privacy policy link, terms link
- Logo or brand name present
- Contact information if applicable
- Social media links if applicable
- **No version numbers** on marketing pages
- **No weather/locale decorations** unless relevant

---

## 10. INTERACTIVE STATES (Required for All Elements)

| State | Implementation |
|---|---|
| **Default** | Base appearance |
| **Hover** | Subtle visual change (gate behind `@media (hover: hover)`) |
| **Active/Pressed** | `transform: scale(0.97)` or `-translateY(1px)` |
| **Focus** | Visible ring/outline for keyboard (never `outline: none` alone) |
| **Disabled** | Reduced opacity, `cursor: not-allowed`, `pointer-events: none` |
| **Loading** | Skeleton loaders matching final layout shape, not generic spinners |
| **Empty** | Beautifully composed, indicates how to populate |
| **Error** | Clear, inline for forms, toast for transient |

### State Rules

- **Loading states**: Use skeletal loaders matching final layout shape. Avoid generic circular spinners
- **Empty states**: Should be beautifully composed and indicate how to populate
- **Error states**: Clear, inline for forms, contextual toasts for transient errors
- **No placeholder-as-label**: Label ABOVE input, placeholder is supplementary
- **Helper text**: Optional but present in markup. Error text BELOW input

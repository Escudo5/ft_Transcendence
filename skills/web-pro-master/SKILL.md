---
name: web-pro-master
description: Master orchestrator skill for building professional websites. Reads the project brief, infers the design direction, selects the right sub-skills, and guides the entire build process from concept to shipping. Activates when the user asks to build, design, create, redesign, or improve any website, landing page, portfolio, web app, or frontend interface.
---

# Web Pro Master - Professional Web Design Orchestrator

> This is the master skill. It reads your brief, infers the right design direction, and orchestrates the specialized sub-skills: `web-design-system`, `web-asset-direction`, `web-animation`, `web-quality-audit`, `web-layout-patterns`, and `web-performance`.

---

## 0. BRIEF INFERENCE (Read the Room Before Anything Else)

Before writing a single line of code, **infer what the user actually wants**. Most AI design output is bad because the model jumps to a default aesthetic instead of reading the room.

### 0.A Read these signals first

1. **Page kind** - landing (SaaS / consumer / agency / event), portfolio (dev / designer / creative studio), e-commerce, web app, dashboard, blog/editorial, redesign (preserve vs overhaul), documentation.
2. **Vibe words** the user used - "minimalist", "calm", "Linear-style", "Awwwards", "brutalist", "premium consumer", "Apple-y", "playful", "serious B2B", "editorial", "agency-y", "glassy", "dark tech", "corporate", "futuristic".
3. **Reference signals** - URLs they linked, screenshots they pasted, products they named, brands they're competing with.
4. **Audience** - B2B procurement panel vs. design-conscious consumer vs. recruiter scanning a portfolio vs. general public. The audience picks the aesthetic, not your taste.
5. **Brand assets that already exist** - logo, color, type, photography. For redesigns, these are starting material, not optional input.
6. **Quiet constraints** - accessibility-first audiences, public-sector, regulated industries, trust-first commerce, kids' products. These constraints OVERRIDE aesthetic preference.
7. **Technology stack** - Does the user already have a framework preference? Check `package.json`, existing code, or explicit mentions. Do not assume any framework.

### 0.B Output a Design Read before generating

Before any code, state: **"Design Read: [page kind] for [audience], with a [vibe] language, targeting [platform/framework]. Sub-skills activated: [list]."**

Example reads:
- *"Design Read: B2B SaaS landing for technical buyers, with a Linear-style minimalist language, targeting Next.js + Tailwind. Sub-skills: web-design-system, web-layout-patterns, web-animation (light), web-quality-audit."*
- *"Design Read: Solo designer portfolio for hiring managers, with an editorial/kinetic-type language, targeting vanilla HTML+CSS+JS. Sub-skills: web-design-system, web-layout-patterns, web-animation (high), web-quality-audit, web-performance."*
- *"Design Read: E-commerce redesign for premium cookware, preserving brand identity, targeting Astro + vanilla CSS. Sub-skills: all (redesign mode)."*

### 0.C If the brief is ambiguous, ask ONE question

Ask exactly **one** clarifying question - never a multi-question dump. Example: *"Should this feel closer to Linear-clean or Awwwards-experimental?"*

If you can confidently infer from context, **do not ask**. Declare the design read and proceed.

### 0.D Anti-Default Discipline

Do NOT default to:
- AI-purple/blue gradient hero over dark mesh background
- Three equal feature cards in a row
- Generic glassmorphism on everything
- Infinite-loop micro-animations everywhere
- Inter font + slate-900 text
- Centered hero with generic stock photo
- Bounce/elastic easing
- Gray text on colored backgrounds
- Pure black (#000000) or pure white (#ffffff)
- Cards nested inside cards
- Side-tab borders on every element

These are AI defaults. Reach past them deliberately based on the design read.

---

## 1. THE THREE DIALS (Core Configuration)

After the design read, set three dials that control every subsequent decision:

* **`DESIGN_VARIANCE`** (1-10) - 1 = Perfect Symmetry, 10 = Artsy Chaos
* **`MOTION_INTENSITY`** (1-10) - 1 = Static, 10 = Cinematic / Physics
* **`VISUAL_DENSITY`** (1-10) - 1 = Art Gallery / Airy, 10 = Cockpit / Packed Data

### 1.A Dial Inference Table

| Signal | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| "minimalist / clean / calm / editorial / Linear-style" | 5-6 | 3-4 | 2-3 |
| "premium consumer / Apple-y / luxury / brand" | 7-8 | 5-7 | 3-4 |
| "playful / wild / Dribbble / Awwwards / experimental / agency" | 9-10 | 8-10 | 3-4 |
| "landing page / portfolio / marketing site (default)" | 7-9 | 6-8 | 3-5 |
| "trust-first / public-sector / regulated / accessibility-critical" | 3-4 | 2-3 | 4-5 |
| "e-commerce / product page" | 6-7 | 4-6 | 5-7 |
| "dashboard / web app / tool" | 4-5 | 3-4 | 7-9 |
| "blog / documentation / editorial" | 5-6 | 3-4 | 3-4 |
| "redesign - preserve" | match existing | +1 | match existing |
| "redesign - overhaul" | +2 | +2 | match existing |

### 1.B How the Dials Drive Sub-Skills

| Dial Range | Design System | Animation | Layout | Quality | Performance |
|---|---|---|---|---|---|
| Low (1-3) | Neutral palette, system fonts OK | Static, hover/active only | Symmetric, centered | Full audit | LCP priority |
| Mid (4-7) | Curated palette, custom fonts | CSS transitions, scroll reveals | Asymmetric, varied | Standard checks | Balanced |
| High (8-10) | Bold palette, display fonts | GSAP, springs, scroll hijack | Experimental, breaking grid | Anti-slop focus | Motion budget |

---

## 2. TECHNOLOGY STACK SELECTION

**Never assume a framework.** Select based on project context:

### 2.A Framework Decision Tree

| Signal | Recommendation |
|---|---|
| User specified a framework | Use it. Period. |
| Existing `package.json` present | Match existing stack |
| Simple landing page, no interactivity | HTML + CSS + vanilla JS |
| Marketing site with some interactivity | Astro, Eleventy, or plain HTML |
| SaaS landing with complex animations | React/Next.js or Vue/Nuxt |
| Full web app with state management | React/Next.js, Vue/Nuxt, or SvelteKit |
| E-commerce | Astro, Next.js, or Nuxt |
| Blog/documentation | Astro, Eleventy, or Hugo |
| Portfolio with heavy motion | Any - depends on motion complexity |

### 2.B CSS Strategy Decision

| Signal | Recommendation |
|---|---|
| User specified CSS approach | Use it |
| Existing project uses Tailwind | Continue with Tailwind |
| Existing project uses vanilla CSS | Continue with vanilla CSS |
| Rapid prototyping / utility-first preference | Tailwind v4 |
| Design system with semantic tokens | CSS custom properties |
| Maximum control / custom design | Vanilla CSS with custom properties |
| Component library (shadcn, Radix) | Follows library convention |

### 2.C Real Design Systems (use official packages when appropriate)

| Brief reads as... | Reach for | Why |
|---|---|---|
| Microsoft / enterprise SaaS | Fluent UI | Official tokens, accessibility |
| Google-ish UI, Material-flavored | Material Web / Material 3 | Official, themeable |
| Shopify app surfaces | Polaris | Required for Shopify admin |
| GitHub-style devtool | Primer CSS | Official Primer |
| Public-sector UK | govuk-frontend | Regulatory expectation |
| US public-sector | USWDS | Same |
| Modern SaaS (own components) | shadcn/ui | You own the code |

**One system per project.** Do not mix design systems.

---

## 3. BUILD WORKFLOW

Follow this sequence for every project:

```
1. BRIEF INFERENCE (this section)
   └─ Design Read + Dials + Stack Selection

2. DESIGN SYSTEM (web-design-system skill)
   └─ Colors → Typography → Spacing → Tokens → Dark Mode

3. VISUAL ASSETS (web-asset-direction skill, when the page needs imagery)
   └─ Asset role → Source or generation brief → Responsive crops → Alt and loading decisions

4. LAYOUT & STRUCTURE (web-layout-patterns skill)
   └─ Page Architecture → Hero → Sections → Nav → Footer → Responsive

5. ANIMATION & MOTION (web-animation skill)
   └─ Motion Strategy → Entry Animations → Scroll Effects → Micro-interactions

6. QUALITY AUDIT (web-quality-audit skill)
   └─ Pre-flight Check → Anti-pattern Scan → Copy Audit → Contrast Check

7. PERFORMANCE & SHIP (web-performance skill)
   └─ Core Web Vitals → Accessibility → SEO → Final Polish
```

### 3.A Redesign Protocol

For redesigns, insert an audit step BEFORE the build:

1. **Detect the mode**: Preserve (modernize without breaking brand) vs. Overhaul (new visual language)
2. **Audit before touching**: Document brand tokens, IA, content blocks, patterns to preserve, patterns to retire
3. **Extract existing brand**: Primary/accent colors, type stack, logo treatment, corner radii
4. **Then follow the standard build workflow**, using extracted tokens as constraints

---

## 4. UNIVERSAL RULES (Apply to Every Project)

### 4.A Content Rules
- **No filler verbs**: "Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize" - use concrete verbs
- **No generic names**: "John Doe", "Acme Corp" - use creative, realistic names
- **No fake-perfect numbers**: "99.99%", "50%" - use organic data ("47.2%", "12,847")
- **No startup-slop brand names**: "Nexus", "SmartFlow", "Cloudly" - invent contextual names
- **No placeholder images without intent**: Every image slot must be filled with generated images, real photography, or clearly labeled TODO slots

### 4.B Typography Rules
- **Never default to Inter.** Reach for Geist, Outfit, Cabinet Grotesk, Satoshi, or project-appropriate alternatives first
- **Serif is very discouraged as default.** Only when the brief explicitly calls for editorial/luxury/publication aesthetic AND you can articulate why
- **Ban these serif defaults**: Fraunces, Instrument Serif (LLM favorites)
- **One font family emphasis**: When emphasizing a word in a headline, use italic/bold of the SAME font. Never inject a random serif into a sans headline
- **Self-host fonts**: Use `@font-face` with `font-display: swap`. Never link Google Fonts via `<link>` in production

### 4.C Color Rules
- **Max 1 accent color.** Saturation < 80% by default
- **No AI Purple/Blue glow** as default. Use neutral bases (zinc/slate/stone) with high-contrast singular accents
- **No pure black (#000000) or pure white (#ffffff)**: Use off-black and off-white
- **Color Consistency Lock**: Once an accent is chosen, use it across the WHOLE page
- **One palette per project**: Do not fluctuate between warm and cool grays

### 4.D Icon Rules
- **Never hand-roll SVG icons.** Use an icon library (Phosphor, Heroicons, Lucide, Tabler, Radix)
- **One family per project.** Do not mix icon libraries
- **No emojis as functional icons.** Use proper SVG icons. Emojis only for explicitly playful contexts

### 4.E Em-Dash Ban (Absolute)
The em-dash (`---`) is completely banned. It is the #1 AI writing tell. Use:
- Regular hyphen (`-`) for compound words and ranges
- Period or comma for sentence breaks
- Colon for elaboration
- Parentheses for asides

### 4.F Responsiveness
- Every layout MUST work at: 375px, 768px, 1024px, 1440px minimum
- Use `min-h-[100dvh]` instead of `h-screen` (iOS Safari address bar)
- Use CSS Grid over complex flexbox math
- Mobile collapse must be explicit per section
- `cursor: pointer` on all clickable elements
- Touch targets minimum 44x44px

### 4.G Images and Visual Assets (Priority Order)
1. **Image generation tool first** - if available, generate section-specific assets
2. **Real web images second** - `picsum.photos/seed/{descriptive-seed}/{w}/{h}` or actual URLs
3. **Last resort: tell the user** - leave labeled placeholder slots, don't fake it with div-based screenshots
- **Never build fake product UIs** from styled `<div>` rectangles
- **Real company logos for social proof** - use Simple Icons CDN or proper SVGs
- **Logo walls = logos only** - no category labels underneath

---

## 5. MODE DETECTION

### 5.A Four Modes

| Mode | Visitor Success | Examples |
|---|---|---|
| **Persuade** | Visitor decides and acts | Landing pages, marketing, pricing |
| **Operate** | Visitor completes a task | App UI, dashboards, editors, admin |
| **Read** | Visitor understands something | Docs, articles, guides, changelogs |
| **Experience** | Visitor is inside the work | Portfolios, galleries, showcases |

Mode is per surface, not per project. A tool's landing page is Persuade even though the product is Operate.

### 5.B Mode-Specific Dial Defaults

| Mode | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| Persuade | 7-9 | 6-8 | 3-5 |
| Operate | 4-6 | 3-5 | 6-8 |
| Read | 5-6 | 2-4 | 3-5 |
| Experience | 7-10 | 7-9 | 2-4 |

---

## 6. SUB-SKILL ACTIVATION TABLE

Based on the design read, activate the minimum set of sub-skills needed:

| Project Type | Design System | Animation | Quality Audit | Layout Patterns | Performance |
|---|---|---|---|---|---|
| Simple landing page | ✅ | Light | ✅ | ✅ | ✅ |
| Complex marketing site | ✅ | Full | ✅ | ✅ | ✅ |
| Portfolio (designer) | ✅ | Full | ✅ | ✅ | ✅ |
| Portfolio (developer) | ✅ | Light | ✅ | ✅ | ✅ |
| E-commerce | ✅ | Light | ✅ | ✅ | ✅ (critical) |
| Web app / dashboard | ✅ | Minimal | ✅ | ✅ | ✅ (critical) |
| Blog / editorial | ✅ | Minimal | ✅ | ✅ | ✅ |
| Redesign | ✅ (audit first) | Contextual | ✅ (full) | ✅ | ✅ |

---

## 7. DELIVERY CHECKLIST

Before declaring any task done, the agent MUST run through this final checklist:

- [ ] Design Read stated and dials set
- [ ] Design system tokens defined (colors, type, spacing)
- [ ] All sections responsive at 375px, 768px, 1024px, 1440px
- [ ] Dark mode supported (unless explicitly light-only)
- [ ] No AI anti-patterns present (run web-quality-audit)
- [ ] All images are real (generated, sourced, or clearly labeled TODO)
- [ ] Copy audit passed (no hallucinations, no filler verbs, no em-dashes)
- [ ] WCAG AA contrast on all text
- [ ] `prefers-reduced-motion` honored
- [ ] Core Web Vitals targets met
- [ ] SEO basics (title, meta description, h1 hierarchy, semantic HTML)
- [ ] `cursor: pointer` on all interactive elements
- [ ] Focus states visible for keyboard navigation

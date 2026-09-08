---
name: web-quality-audit
description: Quality audit and anti-pattern detection skill for web interfaces. Contains 80+ deterministic rules to catch AI-generated design cliches (AI slop), production tells, content issues, and accessibility failures. Runs a pre-flight checklist before any deliverable is shipped. Activates during review, audit, polish, or final delivery of any web project.
---

# Web Quality Audit - Anti-Pattern Detection and Pre-Flight Check

> Ship nothing until this checklist passes. Every rule here exists because it caught a real defect in production.

---

## 1. AI SLOP DETECTION (Visual Anti-Patterns)

These are the signatures AI models default to. Avoid them unless the brief explicitly asks for them.

### 1.A Visual and CSS Tells

| Tell | Why It's Bad | Fix |
|---|---|---|
| Purple-to-blue gradient hero | Every AI site uses this exact palette | Choose industry-appropriate colors |
| Neon / outer glows on cards | Screams "AI generated" | Use inner borders or tinted shadows |
| Pure black `#000000` backgrounds | Kills depth, looks flat | Off-black: `#0a0a0a`, `#111`, zinc-950 |
| Pure white `#ffffff` backgrounds | Same issue | Off-white: `#fafafa`, `#f8f8f8` |
| Oversaturated accent colors | Looks cheap, poor a11y | Desaturate to blend with neutrals |
| Excessive gradient text on large headers | Hard to read, overdone | Use solid color or very subtle gradient |
| Custom mouse cursors | Outdated, accessibility-hostile | Keep default cursors |
| Gray text on colored backgrounds | Poor contrast, illegible | Check WCAG contrast ratios |
| Cards nested inside cards | Visual noise, hierarchy confusion | Flatten hierarchy |
| Side-tab borders on every element | Generic, repetitive pattern | Use borders purposefully |
| Bounce/elastic easing on UI | Feels dated, unprofessional | Use custom ease-out curves |
| `border-radius: 9999px` on everything | Inconsistent, chaotic | Pick ONE radius scale |

### 1.B Typography Tells

| Tell | Fix |
|---|---|
| Inter as the only font choice | Use Geist, Outfit, Cabinet Grotesk, Satoshi, etc. |
| Oversized H1 that just screams (text-8xl+) | Control hierarchy with weight + color, not raw scale |
| Random serif word injected into sans headline | Use italic/bold of the SAME font for emphasis |
| Fraunces or Instrument Serif as display | Banned as defaults (LLM favorites) |
| `letter-spacing: 0.1em` on everything | Wide tracking is for eyebrows only |
| Three identical font sizes on a page | Create visual hierarchy with varied sizes |

### 1.C Layout Tells

| Tell | Fix |
|---|---|
| Three equal feature cards in a row | Use 2-col zigzag, asymmetric grid, or scroll layout |
| Centered hero with gradient blob (no real image) | Use real photography or generated images |
| Every section has the same layout | Use at least 4 different layout families per page |
| Zigzag (left-image/right-text alternating) > 2 sections | Break pattern with full-width, bento, or different layout |
| Navigation wrapping to two lines on desktop | Condense labels or use hamburger |
| Hero content not fitting in initial viewport | Reduce font scale or cut copy |

---

## 2. PRODUCTION TELLS (Patterns from Real AI-Generated Sites)

### 2.A Hero and Top-of-Page

- **NO version labels in hero**: "V0.6", "BETA", "EARLY ACCESS" - banned as default eyebrows
- **NO "Brand - No. 01"-style sub-eyebrows**: Skip micro-meta lines
- **NO decoration text strip at hero bottom**: "BRAND. MOTION. SPATIAL.", "TYPE / FORM / MOTION" - banned
- **NO floating top-right sub-text in section headings**: Small explainer floating in corner with no alignment

### 2.B Section Numbering and Labels

- **NO section-number eyebrows**: "00 / INDEX", "001 - Capabilities", "06 - how it works" - banned
- **NO `01/4`-style pagination on tiles**: If the user can count, they don't need the label
- **NO "Scroll - 001 Capabilities"-style scroll cues**: Simple arrow or nothing
- **NO "Index of Work, 2018-2026"-style range labels**: Just say what the section is
- **NO generic step labels**: "Stage 1 / Stage 2" - use verb-noun directly ("Install", "Configure", "Ship")

### 2.C Eyebrow Restraint (The #1 Violated Rule)

An "eyebrow" is the small uppercase label above a section headline (`text-xs uppercase tracking-wide`).

**Maximum 1 eyebrow per 3 sections.** A page with 9 sections may use at most 3 eyebrows total.

- If section A has an eyebrow, the next 2 sections CANNOT have one
- **Pre-flight mechanical check**: Count instances of `uppercase tracking` or similar patterns. If count > ceil(sectionCount / 3), FAIL
- **What to do instead**: Drop it. The headline alone is enough

### 2.D Separators and Dots

- **Middle-dot (`-`) rationed**: Maximum 1 per line. Don't use as universal separator
- **NO decorative colored status dots on every list item**: Acceptable only for real semantic state (server status, availability)

### 2.E Marketing Copy Tells

- **NO "Quietly trusted by"** social-proof headers
- **NO "From the field" / "Field notes"** poetic section labels
- **NO weather/locale strips** ("LIS 14:23 - 18C") unless brief is about a place
- **NO micro-meta-sentences under eyebrows** (clutter sentences explaining the section)
- **NO em-dash anywhere** (see Section 4)
- **NO filler verbs**: "Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize"
- **NO "We respect the French ones"**-style mock-humble industry references

### 2.F Pills, Labels, and Stamps

- **NO pills/tags overlaid on images**: Let images speak alone or add caption below
- **NO fake photo-credit captions**: "Field study no. 12 - Ines Caetano" under stock images
- **NO version footers on marketing pages**: "v1.4.2", "Build 0048" - banned on landing pages
- **NO "Reservation 412 of 800"-style live counters** as decoration

### 2.G Fake Product Previews

- **NO div-based fake product UIs**: Fake task lists, fake terminals, fake dashboards built from styled divs
- **NO fake version footers inside screenshots**: "v0.6.2-rc.1", "last sync 4s ago"
- Use: real screenshots, generated images, actual component previews, or nothing

### 2.H Scroll Cues

- **Scroll cues are banned**: "Scroll", "arrow down scroll", animated mouse-wheel icons. Users know what scroll is

---

## 3. CONTENT QUALITY AUDIT

### 3.A Copy Self-Audit (Mandatory Before Ship)

Re-read every visible string. Flag any that is:

- **Grammatically broken** ("free on its past", unclear constructions)
- **Has unclear referents** ("we plan to stay that way" without prior context)
- **Sounds like AI hallucination** (forced metaphors, clever-but-wrong wordplay)
- **Reads like LLM trying to sound thoughtful** (passive-aggressive humility, fake-craftsman labels)

Rewrite every flagged string. Boring copy is better than AI-cute copy.

### 3.B Number Accuracy

Fake-precise numbers must either:
- Come from real data (brief, brand guidelines) - fine
- Be explicitly labeled as mock (`<!-- mock -->`) - fine
- Be AI-invented - **banned**

Don't fake engineering precision the brand doesn't claim.

### 3.C Content Register

One copy register per page. Don't mix:
- Technical mono ("47 tasks - 0.6 ctx-switches/day")
- Editorial prose
- Marketing punch

...in the same composition unless the brand voice explicitly calls for it.

### 3.D Fake Data Patterns

| Bad | Good |
|---|---|
| "John Doe", "Jane Smith" | Creative, realistic, locale-appropriate names |
| SVG "egg" generic avatars | Photo placeholders or styled avatars |
| "99.99%", "50%", "1234567" | Organic data: "47.2%", "+1 (312) 847-1928" |
| "Acme Corp", "Nexus", "SmartFlow" | Contextual, premium-sounding names |
| "$9.99/mo", "$29.99/mo", "$99.99/mo" | Realistic pricing with odd numbers |

---

## 4. EM-DASH BAN (Absolute, Non-Negotiable)

The em-dash (`---`) is COMPLETELY BANNED. It is the #1 AI writing tell.

- **Banned in headlines.** Use period or comma
- **Banned in eyebrows/labels/pills/buttons/captions.** Use line breaks or columns
- **Banned in body copy.** Restructure: two sentences, comma, parentheses, or colon
- **Banned in quote attribution.** Use hyphen with spaces (` - `) or line break
- **En-dash (`--`) banned as separator too.** Date ranges use hyphen (`2018-2026`)

The ONLY permitted dash is:
- Regular hyphen `-` for compound words, ranges, line dividers
- Minus sign in math (`-5C`)

If output contains a single `---` or `--` visible to the user, it FAILS this audit.

---

## 5. ACCESSIBILITY CHECKLIST

### 5.A Contrast (WCAG AA Minimum)

| Element | Minimum Ratio |
|---|---|
| Body text (< 18px) | 4.5:1 |
| Large text (>= 18px bold, >= 24px regular) | 3:1 |
| UI components and graphics | 3:1 |
| Hero headline | 4.5:1 (target AAA: 7:1) |
| Placeholder text | 4.5:1 (if it conveys information) |
| Disabled elements | No minimum (but should be visibly disabled) |

**Button Contrast Check**: White button + white text = FAIL. Audit every CTA.
**Form Contrast Check**: Light placeholders on near-white forms = FAIL. Audit every form.
**Ghost buttons over photos**: Must have backdrop, scrim, or stroke.

### 5.B Interactive Elements

- [ ] `cursor: pointer` on ALL clickable elements
- [ ] Focus states visible for keyboard navigation (never `outline: none` without replacement)
- [ ] Touch targets minimum 44x44px
- [ ] `prefers-reduced-motion` honored on all animations
- [ ] No `tabindex` greater than 0
- [ ] All images have meaningful `alt` text (or `alt=""` for decorative)
- [ ] Form inputs have associated `<label>` elements
- [ ] Error messages are associated with inputs via `aria-describedby`

### 5.C Semantic HTML

- [ ] Single `<h1>` per page
- [ ] Heading hierarchy (h1 > h2 > h3, no skipping levels)
- [ ] `<nav>`, `<main>`, `<header>`, `<footer>`, `<section>`, `<article>` used appropriately
- [ ] Lists use `<ul>`/`<ol>` + `<li>`, not styled `<div>`s
- [ ] Buttons are `<button>`, not `<div onclick>`
- [ ] Links are `<a>`, not `<span onclick>`

---

## 6. LAYOUT QUALITY CHECKS

### 6.A Hero Checks

- [ ] Hero fits in initial viewport (headline max 2 lines, subtext max 20 words, CTAs visible)
- [ ] Hero top padding max 6rem at desktop
- [ ] Hero has max 4 text elements (eyebrow OR brand strip, headline, subtext, CTAs)
- [ ] No trust logos/feature lists stuffed inside the hero (they go in a section below)
- [ ] Hero has a real visual (not just text + gradient blob)
- [ ] Hero font scale matches headline word count (long headline = smaller font)

### 6.B Navigation Checks

- [ ] Nav renders on single line at desktop (1024px+)
- [ ] Nav height max 80px desktop, default 64-72px
- [ ] No two-line nav at desktop

### 6.C Section Checks

- [ ] Section-layout-repetition: same layout family appears max ONCE per page
- [ ] At least 4 different layout families on a page with 8+ sections
- [ ] Zigzag alternation: max 2 consecutive image+text splits
- [ ] Bento cells = exactly the number of content items (no empty cells)
- [ ] Bento grids have visual diversity (not all white-on-white text cards)
- [ ] Mobile collapse is explicit per section

### 6.D CTA Checks

- [ ] Button text fits one line at desktop (no wrapping)
- [ ] Button labels max 3 words for primary CTAs
- [ ] No duplicate CTA intent on same page ("Get in touch" + "Contact us" = same intent)
- [ ] CTA contrast passes (text readable against button background)

### 6.E Theme Consistency

- [ ] One theme per page (no random section inversions)
- [ ] Page locked to light, dark, or auto
- [ ] Background tints within same family are OK (zinc-950 next to zinc-900)

---

## 7. PRE-FLIGHT CHECKLIST (Run Before Every Delivery)

```
PRE-FLIGHT CHECK
================

[ ] Design Read stated, dials set
[ ] No AI-purple gradient defaults
[ ] No Inter as sole font choice
[ ] No em-dashes anywhere visible
[ ] No generic placeholder names/data
[ ] No fake product UI screenshots (div-based)
[ ] Eyebrow count <= ceil(sections / 3)
[ ] No more than 2 zigzag sections in a row
[ ] Hero fits viewport (headline <=2 lines, sub <=20 words)
[ ] Nav on single line at desktop
[ ] No duplicate CTA intent
[ ] All text passes WCAG AA contrast
[ ] cursor:pointer on all clickable elements
[ ] prefers-reduced-motion honored
[ ] Focus states visible for keyboard nav
[ ] Responsive at 375px, 768px, 1024px, 1440px
[ ] Both light and dark mode checked
[ ] Real images (generated, sourced, or labeled TODO)
[ ] Copy audit passed (no hallucinations, no filler verbs)
[ ] One color register per page
[ ] Shape consistency (one radius scale)
[ ] No scroll cues
```

If ANY item fails, fix it before delivery.

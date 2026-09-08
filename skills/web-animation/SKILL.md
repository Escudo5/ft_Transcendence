---
name: web-animation
description: Animation and motion design skill for web interfaces. Provides a decision framework for when and how to animate, curated easing curves, spring configurations, duration tables, scroll-driven animation skeletons, and accessibility rules. Based on Emil Kowalski's design engineering philosophy and Apple's fluid interface principles. Activates when implementing motion, transitions, or interactive animations.
---

# Web Animation - Motion Design Framework

> Every animation must answer "why does this animate?" before "how does this animate?"

---

## 1. THE ANIMATION DECISION GATE

Before writing any animation code, answer these questions in order:

### 1.A Should this animate at all?

| Frequency | Decision |
|---|---|
| 100+ times/day (keyboard shortcuts, command palette toggle) | **No animation. Ever.** Stop here. |
| Tens of times/day (hover effects, list navigation) | Near-imperceptible only (fast, subtle, or nothing) |
| Occasional (modals, drawers, toasts) | Standard animation |
| Rare / first-time (onboarding, success, celebration) | The delight budget lives here |

**Keyboard-initiated actions are a disqualifier.** Raycast has no open/close animation. That is correct for something opened hundreds of times a day.

### 1.B What is the purpose?

Name it before continuing:
- **Feedback** - confirming the interface heard the user
- **Spatial consistency** - showing where something came from or went
- **State indication** - making a state change legible
- **Explanation** - showing how a feature works (marketing)
- **Preventing jarring changes** - elements appearing/disappearing without transition feel broken
- **Delight** - rare moments of joy (celebrations, onboarding)

If the purpose is just "it looks cool" and the user will see it often, **don't animate**.

### 1.C Motion Must Be Motivated

Before adding any animation, ask: "what does this animation communicate?" Valid answers: hierarchy (drawing attention), storytelling (revealing in sequence), feedback (acknowledging action), state transition (showing change). Invalid answer: "it looked cool."

---

## 2. EASING CURVES

### 2.A The Easing Decision

| Context | Easing | Why |
|---|---|---|
| Element entering | ease-out | Starts fast, feels responsive |
| Element exiting | ease-out (faster) | Quick departure |
| Moving/morphing on screen | ease-in-out | Natural acceleration/deceleration |
| Hover / color change | ease | Subtle, natural |
| Constant motion (marquee, progress) | linear | Steady, predictable |
| Default / unsure | ease-out | Safe default |

**NEVER use ease-in for UI animations.** It starts slow, making the interface feel sluggish. A dropdown with `ease-in` at 300ms FEELS slower than `ease-out` at 300ms.

### 2.B Curated Custom Curves

Built-in CSS easings are too weak. Use these:

```css
:root {
  /* Strong ease-out for UI interactions (recommended default) */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);

  /* Strong ease-in-out for on-screen movement */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);

  /* iOS-like drawer curve */
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);

  /* Smooth entrance for scroll reveals */
  --ease-reveal: cubic-bezier(0.16, 1, 0.3, 1);

  /* Subtle ease for hover states */
  --ease-hover: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 2.C Duration Table

| Element | Duration |
|---|---|
| Button press feedback | 100-160ms |
| Tooltips, small popovers | 125-200ms |
| Dropdowns, selects | 150-250ms |
| Modals, drawers | 200-500ms |
| Page transitions | 300-600ms |
| Marketing / explanatory | Can be longer |
| Scroll-driven animations | Tied to scroll, no fixed duration |

**Rule: UI animations should stay under 300ms.** Faster feels more responsive.

### 2.D Asymmetric Enter/Exit

Exit should always be faster than enter:
- Enter: deliberate (200-400ms)
- Exit: snappy (100-200ms)
- Press: slow when deliberate (hold-to-delete: 2s linear)
- Release: always fast (200ms ease-out)

---

## 3. SPRING ANIMATIONS

### 3.A When to Use Springs

- Drag interactions with momentum
- Elements that should feel "alive" (Dynamic Island-style)
- Gestures that can be interrupted mid-animation
- Mouse-tracking decorative interactions
- Any interaction the user can grab and reverse mid-flight

### 3.B Spring Configuration

**Apple's approach (recommended, easier to reason about):**
```js
{ type: "spring", duration: 0.5, bounce: 0.2 }
```

**Traditional physics (more control):**
```js
{ type: "spring", mass: 1, stiffness: 100, damping: 10 }
```

**Guidelines:**
- Keep bounce subtle (0.1-0.3) when used
- Use bounce ONLY when the gesture carried momentum (flick, throw, drag release)
- Default to critically damped (bounce: 0, or damping ratio 1.0) for most UI
- Overshoot on a menu fade = wrong. Overshoot on a flicked card = right

### 3.C Interruptibility (Critical Principle)

Every animation must be interruptible and redirectable at any moment:
- **Never lock out input during a transition**
- **Animate from the current (presentation) value, not the target value**
- **CSS transitions can be interrupted; keyframes restart from zero** - prefer transitions for dynamic UI
- **Springs maintain velocity when interrupted** - ideal for gestures

---

## 4. COMPONENT ANIMATION PATTERNS

### 4.A Buttons

```css
.button {
  transition: transform 160ms var(--ease-out);
}
.button:active {
  transform: scale(0.97);
}
```

Scale should be subtle: 0.95-0.98. This applies to any pressable element.

### 4.B Never Animate from scale(0)

Nothing in the real world disappears completely. Start from `scale(0.95)` or higher with opacity:

```css
/* Bad */
.entering { transform: scale(0); }

/* Good */
.entering { transform: scale(0.95); opacity: 0; }
```

### 4.C Popovers - Origin Aware

Popovers should scale from their trigger, not from center. **Exception: modals keep center origin.**

```css
.popover { transform-origin: var(--trigger-origin, center); }
```

### 4.D Tooltips - Skip Delay on Subsequent Hovers

First tooltip: delay before appearing. Subsequent tooltips while group is active: instant, no animation.

### 4.E Stagger Animations

When multiple elements enter together, stagger their appearance:

```css
.item {
  opacity: 0;
  transform: translateY(8px);
  animation: fadeIn 300ms var(--ease-reveal) forwards;
}
.item:nth-child(1) { animation-delay: 0ms; }
.item:nth-child(2) { animation-delay: 50ms; }
.item:nth-child(3) { animation-delay: 100ms; }
.item:nth-child(4) { animation-delay: 150ms; }

@keyframes fadeIn {
  to { opacity: 1; transform: translateY(0); }
}
```

Keep stagger delays short: 30-80ms between items. Never block interaction during stagger.

### 4.F Entry with @starting-style (Modern CSS)

```css
.toast {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 400ms ease, transform 400ms ease;

  @starting-style {
    opacity: 0;
    transform: translateY(100%);
  }
}
```

### 4.G Blur to Mask Imperfect Transitions

When a crossfade feels off, add subtle `filter: blur(2px)` during the transition. Keep under 20px (expensive in Safari).

---

## 5. SCROLL-DRIVEN ANIMATIONS

### 5.A Simple Scroll Reveal (Lightweight)

Use IntersectionObserver or CSS `animation-timeline: view()`:

```css
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s var(--ease-reveal), transform 0.6s var(--ease-reveal);
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

```js
const observer = new IntersectionObserver(
  (entries) => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  }),
  { threshold: 0.15, rootMargin: '-50px' }
);
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
```

### 5.B Sticky-Stack Sections (GSAP Pattern)

Cards that pin at viewport top and stack as user scrolls:

```js
// Critical: start: "top top" (pin at viewport top)
// Each card except last is pinned
// Previous card shrinks as next arrives
ScrollTrigger.create({
  trigger: card,
  start: "top top",
  pin: true,
  pinSpacing: false,
});
gsap.to(card, {
  scale: 0.92, opacity: 0.55, ease: "none",
  scrollTrigger: {
    trigger: nextCard,
    start: "top bottom",
    end: "top top",
    scrub: true,
  },
});
```

### 5.C Horizontal Scroll Hijack (GSAP Pattern)

Vertical scroll mapped to horizontal panning:

```js
const distance = track.scrollWidth - window.innerWidth;
gsap.to(track, {
  x: -distance, ease: "none",
  scrollTrigger: {
    trigger: wrapper,
    start: "top top",        // pin starts at viewport top
    end: () => `+=${distance}`,
    pin: true,
    scrub: 1,
    invalidateOnRefresh: true,
  },
});
```

### 5.D clip-path Animations

```css
/* Reveal from left to right */
.hidden { clip-path: inset(0 100% 0 0); }
.visible { clip-path: inset(0 0 0 0); }

/* Image reveal on scroll (from bottom) */
.image-reveal {
  clip-path: inset(0 0 100% 0);
  transition: clip-path 1s var(--ease-in-out);
}
.image-reveal.visible {
  clip-path: inset(0 0 0 0);
}
```

---

## 6. FORBIDDEN ANIMATION PATTERNS

- **`window.addEventListener("scroll", ...)`** - Banned. Runs every frame, jank-prone. Use IntersectionObserver, GSAP ScrollTrigger, or CSS scroll-driven animations
- **`requestAnimationFrame` loops that touch framework state** - Causes re-renders every frame
- **Custom scroll progress via `window.scrollY` in state** - Same problem
- **Bounce/elastic easing** - Feels dated. Use subtle spring bounce only on gesture-driven interactions
- **`ease-in` on any UI entrance** - Feels sluggish
- **Keyframes on rapidly-triggered elements** - Use transitions (interruptible)
- **Duration > 300ms on standard UI** - Feels slow
- **Same speed for enter and exit** - Exit should be faster
- **Everything appearing at once** - Use stagger
- **`transition: all`** - Specify exact properties
- **Hover animations without `@media (hover: hover) and (pointer: fine)`** - Touch devices trigger hover on tap

---

## 7. PERFORMANCE RULES

### 7.A Only Animate transform and opacity
These skip layout and paint. Never animate `padding`, `margin`, `height`, `width`, `top`, `left`.

### 7.B CSS Animations Beat JS Under Load
CSS animations run off the main thread. Use CSS for predetermined animations; JS for dynamic, interruptible ones.

### 7.C Use WAAPI for Programmatic CSS Animations
```js
element.animate(
  [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }],
  { duration: 1000, fill: 'forwards', easing: 'cubic-bezier(0.77, 0, 0.175, 1)' }
);
```

### 7.D will-change Sparingly
Only on elements that will actually animate. Remove after animation completes.

### 7.E Marquee Limit
Maximum ONE horizontal scrolling marquee per page. Two or more = lazy filler.

---

## 8. ACCESSIBILITY (Non-Negotiable)

### 8.A prefers-reduced-motion

Any motion above MOTION_INTENSITY > 3 MUST honor this:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Reduced motion = fewer and gentler animations, NOT zero. Keep opacity and color transitions for comprehension. Remove movement and position animations.

### 8.B Touch Device Hover States

```css
@media (hover: hover) and (pointer: fine) {
  .element:hover { transform: scale(1.02); }
}
```

Touch devices trigger hover on tap. Gate hover animations behind this media query.

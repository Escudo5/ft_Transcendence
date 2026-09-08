---
name: web-asset-direction
description: Plan, source, and produce purposeful visual assets for websites, including image-generation briefs, responsive crops, and handoff requirements. Use when a web interface needs photography, illustration, product imagery, or other visual assets; do not use for icons or CSS-only decoration.
---

# Web Asset Direction

Use visual assets to carry meaning that layout and type cannot. An asset is part of the content, not a decorative substitute for a weak composition.

## Decide whether an asset is needed

Before sourcing or generating anything, name the asset's job: product proof, atmosphere, explanation, editorial context, or a focal visual. If it has no job, remove it. Do not add stock imagery, gradients, or abstract 3D blobs just to fill a panel.

Use real supplied assets first. If none exist, generate or source an asset only when it improves the page's meaning. Build interface chrome, text, buttons, cards, and diagrams in code rather than baking them into raster images.

## Produce an asset brief

For every generated or sourced asset, define:

- Subject and the specific story it tells.
- Intended page region and responsive aspect ratios.
- Camera angle, crop, lighting, palette, and material that fit the selected design system.
- Required negative space for overlaid UI, only if text will actually overlay it.
- Whether it is decorative (`alt=""`) or needs concise alternative text.

Avoid text, logos, watermarks, fake UI screenshots, unreadable interfaces, and invented factual claims inside generated imagery. Preserve the supplied product, person, or brand faithfully when a reference is provided.

## Generation and delivery

Generate at least at the largest rendered size, preferably 1.5x to 2x. Keep the source master separate from delivery derivatives. Create only the crops that the layout actually uses and name them by role, not by vague sequence numbers.

For each asset, provide the parent with its path, dimensions, intended component or section, crop behavior (`cover`, `contain`, or fixed), loading priority, and alt-text decision. Convert or optimize delivery files as appropriate for the project, but do not defer visible hero imagery behind a lazy load.

## Web constraints

- Use `width` and `height` or a stable `aspect-ratio` to prevent layout shift.
- Use responsive images (`srcset`/`sizes` or the framework equivalent) when the image has materially different display sizes.
- Keep the LCP image discoverable in initial HTML and load it with high priority when it is the hero visual.
- Use lazy loading for below-the-fold imagery only.
- Check the final crop at desktop and mobile. A face, product, or focal detail must not be unintentionally cropped out.
- If the asset communicates information, provide equivalent nearby text or useful `alt`; do not rely on an image alone for essential content.

## Handoff checklist

Before handoff, confirm that every asset is real, intentionally placed, usable at its rendered size, consistent with the design direction, and has a clear accessibility and loading decision. Return unresolved asset needs as explicit placeholders, never as fabricated imagery.

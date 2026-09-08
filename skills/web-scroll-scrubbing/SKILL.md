---
name: web-scroll-scrubbing
description: Cinematic scroll-scrubbed sequence skill (Apple-style product rotation, pinned hero reveals, video or image-sequence driven by scroll position). Covers technique selection between image-sequence canvas, native video scrubbing, and WebCodecs frame extraction; source asset preparation from a turntable video or 3D render; pinning/rail mechanics; mobile lock patterns; performance budgets; and reduced-motion fallbacks. Activates when a brief references Apple product pages, "rotates/opens on scroll", scrollytelling heroes, or references like landonorris.com, and complements web-animation for anything beyond simple enter/exit reveals.
---

# Web Scroll Scrubbing - Cinematic Scroll-Linked Sequences

> The scrollbar becomes a timeline. The visitor's hand controls playback position and direction. Nothing plays on its own.

---

## 1. WHAT THIS PATTERN IS (AND ISN'T)

This is **not** a scroll-reveal (fade/slide-in on entry - see `web-animation` section 5.A, which is enter-once and non-reversible). This is a **rail**: a section pins in the viewport while scroll input is converted into a playback progress value (0 to 1) that drives either a frame sequence, a video's `currentTime`, or a 3D object's rotation. When the sequence completes, the section unpins and normal document scroll resumes.

Recognizable examples: Apple product pages (MacBook opening, AirPods case rotating), landonorris.com's locked helmet/car turntable hero, most Awwwards "Site of the Day" product reveals.

**Do not reach for this by default.** It only earns its place when the content genuinely benefits from a controlled, frame-by-frame reveal (a product's construction, a 360 view, a transformation). For a generic "make it feel premium" brief, `web-animation`'s scroll reveals and sticky-stack are enough.

---

## 2. TECHNIQUE SELECTION

| Technique | Frame accuracy | Author effort | Payload | Browser risk | Best for |
|---|---|---|---|---|---|
| **Image sequence + canvas** | Perfect (you control every frame) | High (needs frame export/render) | Highest (N images) | Lowest | Apple-style product spins, precise reveals |
| **Native `<video>` scrubbing** | Approximate (seek snaps to nearest keyframe) | Low (upload one video) | Lowest | Medium (Safari lag) | Simple turntables, B-roll style reveals, quick client uploads |
| **WebCodecs frame decode** | Perfect, from a single compressed file | High (newer API, needs fallback) | Low | High (partial support, verify at build time) | Long/high-res sequences where image-sequence payload is too heavy |
| **3D model (Three.js) + scroll-driven rotation** | Perfect, and interactive | Highest (needs a real 3D asset) | Medium (one .glb) | Medium (WebGL required) | Products with a real 3D model, free-camera exploration |

**Default recommendation when the user just has a video file and wants it "spread across the scroll":** start with native video scrubbing (Section 5). Upgrade to an image sequence only if the scrubbing feels laggy or imprecise after testing on real devices.

---

## 3. SOURCE ASSET PREPARATION

### 3.A From a 3D render or turntable rig
- Render or shoot a full rotation (or the transformation arc you need) at a fixed frame rate.
- Frame count guide: 60-150 frames covers most single-object turntables. More frames = smoother scrub but heavier payload.
- Keep the subject centered and the background transparent or matte, so the sequence composites cleanly over page content.

### 3.B Extracting frames from an existing video (for the image-sequence route)
```bash
# Extract at a fixed rate, resize, and compress to WebP
ffmpeg -i input.mp4 -vf "fps=30,scale=1600:-1" -q:v 80 frame_%03d.webp
```
Target 60-150 output frames total, not 30fps for the full clip duration. Trim the source video to just the useful motion first.

### 3.C Preparing a video for native scrubbing
Seeking a compressed video snaps to the nearest keyframe unless keyframes are dense. Two options:

```bash
# Option A: small GOP (compromise between smoothness and file size)
ffmpeg -i input.mp4 -c:v libx264 -g 8 -keyint_min 8 -crf 20 -an -movflags +faststart output.mp4

# Option B: all-intra (frame-perfect seek, much larger file)
ffmpeg -i input.mp4 -c:v libx264 -g 1 -keyint_min 1 -crf 23 -an -movflags +faststart output.mp4
```
Always strip audio (`-an`), the video is muted and silent. Keep it under ~15-20MB and under 8-10 seconds of source motion; longer sequences belong in the image-sequence route instead.

---

## 4. IMPLEMENTATION A: IMAGE SEQUENCE + CANVAS (frame-perfect, the Apple method)

```js
const frameCount = 120;
const images = [];
const canvas = document.querySelector('#sequence-canvas');
const ctx = canvas.getContext('2d');

function frameSrc(i) {
  return `/sequence/frame_${String(i + 1).padStart(3, '0')}.webp`;
}

// Preload progressively: first frame blocks, rest load in background
for (let i = 0; i < frameCount; i++) {
  const img = new Image();
  img.src = frameSrc(i);
  images.push(img);
}

function render(frameIndex) {
  const img = images[Math.min(frameCount - 1, Math.max(0, frameIndex))];
  if (img.complete) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

gsap.to({}, {
  scrollTrigger: {
    trigger: '#sequence-wrapper',
    start: 'top top',
    end: '+=2500',   // rail length, see Section 7
    scrub: 0.5,
    pin: true,
    onUpdate: (self) => render(Math.floor(self.progress * (frameCount - 1))),
  },
});
```

---

## 5. IMPLEMENTATION B: NATIVE VIDEO SCRUBBING (answer to "can I just upload a video")

Yes, this works, and it's the fastest path from "I have one video file" to a working effect. The video never plays on its own; scroll position writes directly to `currentTime`.

```html
<video id="scrub-video" muted playsinline preload="auto" src="/hero-turntable.mp4"></video>
```

```js
const video = document.querySelector('#scrub-video');
let ready = false;
video.addEventListener('loadedmetadata', () => { ready = true; });

gsap.to({}, {
  scrollTrigger: {
    trigger: '#scrub-wrapper',
    start: 'top top',
    end: '+=2500',
    scrub: 0.5,
    pin: true,
    onUpdate: (self) => {
      if (!ready || !video.duration) return;
      video.currentTime = self.progress * video.duration;
    },
  },
});
```

### 5.A Caveats (why this is "approximate" not "perfect")
- **Keyframe snapping**: without a small GOP (Section 3.C) the browser rounds to the nearest keyframe, producing visible stutter on scrub. This is the single biggest quality issue with this technique.
- **Safari lag**: `currentTime` assignment is asynchronous in Safari; rapid scroll can visibly lag behind the scrollbar. Debounce with `scrub: 0.5-1` in GSAP (adds smoothing) rather than `scrub: true` (instant, exposes the lag).
- **Autoplay policy**: `muted` and `playsinline` are required attributes, not optional, or iOS Safari will refuse to load frames at all.
- **No native scroll-driven video API exists.** CSS scroll-driven animations (`animation-timeline: scroll()`) can drive CSS/transform properties natively, but cannot set `video.currentTime`; a JS scroll listener (via GSAP ScrollTrigger, not a raw `scroll` listener, see `web-animation` Section 6) is required either way.

---

## 6. IMPLEMENTATION C: WEBCODECS FRAME DECODE (advanced, use only if A and B both fail your quality bar)

`VideoDecoder` can decode arbitrary frames from a single compressed file with more control than `<video>.currentTime`, avoiding the full-frame-sequence payload. This is meaningfully more complex to implement and browser support is still uneven; check current support before committing a project to it, and always ship a `<video>`-scrubbing fallback for unsupported browsers rather than a hard dependency.

---

## 7. PINNING MECHANICS (the rail)

The "rail" is the scroll distance over which the sequence plays out, before the page unpins and continues normally.

- **Rail length** = desired px-per-frame x frame count. 15-20px per frame feels controlled; under 8px per frame feels twitchy and hard to land on a specific frame.
- Use `pin: true` with an explicit `end` (`+=2500`), never an unbounded pin.
- `scrub: 0.5-1` (a short lag) reads as more premium than `scrub: true` (raw 1:1), which can feel mechanical on trackpads with inertial scroll.
- The rail must have a clear exit: once `progress >= 1`, unpin immediately. Don't let visitors get stuck scrolling through "dead" rail with no visible change.

---

## 8. MOBILE AND TOUCH PATTERN

Scroll-scrubbing on touch devices is unreliable: momentum scroll makes fine-grained control much harder than on a mouse wheel or trackpad. The landonorris.com pattern is a good reference:

- Show a **"tap to lock" / "tap to engage"** affordance before the rail starts, so an accidental swipe doesn't trigger it mid-scroll.
- Provide a visible **"back to scroll"** exit once the visitor is inside the locked rail, so they never feel trapped.
- If the source content is inherently landscape (a car, a wide product), consider the "please rotate your device" pattern rather than cramming a bad portrait crop.
- On low-end devices, consider dropping to a shorter, looping autoplay video instead of scroll-locking entirely. A worse-but-smooth experience beats a janky "premium" one.

---

## 9. PERFORMANCE BUDGET

- **Image sequence total payload**: keep under ~8-12MB for a hero sequence (WebP or AVIF, not JPEG/PNG). Preload only the first 10-15 frames before revealing the section; stream the rest in the background while the visitor reads the preceding content.
- **Video file**: under ~15-20MB, `faststart` flag mandatory (moves metadata to the front so playback/seeking can begin before full download).
- Never block LCP on this section's assets. The rail should be below the fold or lazy-initialized; see `web-performance` Section 1.A.
- One scroll-scrubbed rail per page, maybe two on a long "Experience" mode page. This pattern is expensive in dev time and attention; spamming it dilutes the effect it's meant to have.

---

## 10. ACCESSIBILITY / REDUCED MOTION

- Under `prefers-reduced-motion: reduce`, do not scrub at all: show a single static frame (or the video's poster image) and let the page scroll normally with no pin. Do not simply speed up or shorten the sequence, remove it.
- Never trap keyboard or screen-reader navigation inside the pinned rail; the section must remain fully skippable by keyboard (Tab/Page Down should not get stuck).
- If the visual content in the sequence is informative (not purely decorative), provide the equivalent information as real text nearby, since the sequence itself has no accessible text alternative.

---

## 11. INTEGRATION WITH `web-pro-master` DIALS

This pattern is appropriate at **MOTION_INTENSITY 7+** and **Mode: Experience** or **Mode: Persuade** (per `web-pro-master` Section 5). It is generally inappropriate for **Mode: Operate** or **Mode: Read** surfaces (dashboards, docs) regardless of dial settings; a rail interrupts task completion and reading flow. When the brief names Apple, product-reveal, or references a locked scrollytelling hero, add `web-scroll-scrubbing` to the activated sub-skill list alongside `web-animation`.

---

## 12. PRE-FLIGHT CHECKLIST

```
[ ] Technique chosen deliberately (Section 2), not defaulted to video because it was easiest
[ ] Source video re-encoded with small/all-intra GOP if using native scrubbing (Section 3.C)
[ ] Rail has an explicit, bounded `end` - never an unbounded pin
[ ] scrub value is 0.5-1, not raw `true`, unless a mechanical feel is intentional
[ ] Mobile has a tap-to-lock affordance and a visible exit
[ ] First frames preload before reveal; remaining frames stream in background
[ ] Total sequence payload under budget (Section 9)
[ ] prefers-reduced-motion shows a static frame, not a faster scrub
[ ] Section remains keyboard-skippable
[ ] Only one (max two) scroll-scrubbed rail on the page
```
# Header Typography and Dune Identity Redesign Plan

## Goal

1. **Remove the standalone `D U N E` Eclipse Logo (`#starman-logo`)** below the
   banner so the site does not rely on a literal movie logo graphic, while
   opening up the view of the Arrakis sky, twin moons, and desert dunes.
2. **Transfer the *Dune* visual signature directly into the
   `M^2 ( MARK | MCFADDEN )` Header** so the name and `M^2` carry the
   unmistakable *Dune* film title aesthetic, working in harmony with the
   *"I must not fear. Fear is the mind-killer..."* banner chant.

---

## Why the Current Header Does Not Feel Like *Dune* Yet

Currently, `.brand-title` uses `Cinzel`, which is a **classical Roman serif**
font (sharp triangular serifs and thick/thin strokes).

Denis Villeneuve's *Dune* title design is the exact opposite:

- **Monolinear and Geometric:** Every stroke has a uniform, razor-clean weight
  with zero serifs.
- **Crescent and Arch Letterforms:** Letters like `C`, `D`, `E`, and `A` are
  built from smooth circular arcs and desert-horizon curves rather than boxy
  corners.
- **The Solar Horizon Flare:** The signature pinpoint star-flare with a
  horizontal light streak piercing through the lettering.

---

## 3 Design Approaches for `M^2 ( MARK | MCFADDEN )`

### Option 1 (Recommended): Custom SVG *Dune* Crescent Typography in the Header

Render `M^2 ( MARK | MCFADDEN )` using custom monolinear SVG letterforms styled
directly after the *Dune* title treatment:

- **`M^2`:** Geometric double-arch `M` in glowing Spice Amber (`#f5a65b`) with
  a crescent-styled superscript `2`.
- **`MARK` and `MCFADDEN`:** Wide-tracked monolinear geometric letterforms
  where `A` (arch), `C` (left crescent), `D` (right crescent), and `E`
  (crescent with the **iconic glowing solar star-flare**) use the movie's
  signature geometry.
- **Center Divider (`|`):** Replaced with a subtle **miniature Solar Eclipse
  ring and Eyes-of-Ibad blue/gold horizon flare** separating `MARK` and
  `MCFADDEN`.
- **Accessibility and SEO:** Keep the semantic
  `<h1 id="main-title" class="brand-title" aria-label="M2 (Mark | McFadden)">`
  text intact for screen readers and search engines.

### Option 2: Ultra-Wide Geometric Sans-Serif Font and Solar Eclipse Centerpiece

Use a pure CSS webfont approach (switching from serif `Cinzel` to a monolinear
geometric sans-serif like Google Fonts **`Syne`**, **`Syncopate`**, or
**`Julius Sans One`** with `font-weight: 300`, wide tracking
`letter-spacing: 0.32em`, and rounded caps):

- Style the parentheses `(` and `)` as thin crescent arcs.
- Turn the center pipe `|` between `MARK` and `MCFADDEN` into the **glowing
  *Dune* solar star-flare / eclipse**.
- Add the subtle horizontal desert-horizon hairline running behind the text
  across the header.

### Option 3: CSS Geometric Font and Crescent Ligatures on Key Letters

Use a clean geometric font for the base letters (`M`, `R`, `K`, `F`, `N`) while
styling `C`, `D`, `A`, and `E` with the *Dune* crescent curves and the glowing
solar star-flare inside the `E` of `MCFADDEN`.

---

## Additional Layout Refinement When Removing the `D U N E` Logo

When removing `<div class="starman-logo" id="starman-logo">` from
[index.html](../index.html):

- Add a subtle top margin (`margin-top: 4.5rem`) on the first `.section-2112`
  card (`#status`) so there is still a clean window of Arrakis sky below the
  *"Fear is the mind-killer"* banner, keeping the **twin moons of Arrakis**
  clearly visible above the first card.
- Switch `--font-heading` in [css/dune-theme.css](../css/dune-theme.css) from
  serif `Cinzel` to a clean, wide-tracked geometric sans-serif across all
  section headings (`AI SYSTEMS DIAGNOSTICS [STATUS]`, nav buttons, etc.) so
  the entire UI matches the modern *Dune* film typography.

---

## Files to Update When Executing This Plan

- [index.html](../index.html) -- Remove `#starman-logo`, update `#main-title`
  header markup and fonts.
- [css/dune-theme.css](../css/dune-theme.css) -- Update `.brand-title`,
  `.m2-sq`, `.brand-wrap`, and `--font-heading` to the *Dune* geometric
  aesthetic; adjust top section spacing.
- [functions/api/worker.js](../functions/api/worker.js) -- Remove reference to
  the standalone hero eclipse logo from the system prompt.

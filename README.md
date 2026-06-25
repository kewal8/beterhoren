# Beter Horen — Audicien Traineeship Landing Page

A single-file, conversion-focused recruitment landing page (sales funnel) for the
**Audicien (Traineeship) Maarssen** vacancy. Built from the client briefing + mockup,
with branding derived from [beterhoren.nl](https://www.beterhoren.nl/).

- **Stack:** plain HTML + CSS + vanilla JS (no build step, no dependencies)
- **Fonts:** Figtree (headings) + Mulish (body), loaded from Google Fonts
- **Entry file:** `BeterHoren-Landingpage.html` (rename to `index.html` if you prefer)
- **Language:** Dutch (`<html lang="nl">`)

---

## Quick start

```bash
# just open it
open BeterHoren-Landingpage.html        # macOS
xdg-open BeterHoren-Landingpage.html    # Linux

# or serve it locally
npx serve .
# then visit http://localhost:3000
```

Everything (CSS + JS) is inlined in the one HTML file, so it works offline except for
the Google Fonts request and any real photos you add later.

---

## Design system (CSS custom properties)

All tokens live in `:root` at the top of the `<style>` block. Change them once and the
whole page updates.

| Token | Value | Used for |
|-------|-------|----------|
| `--brand` | `#CE1430` | Primary crimson — logo, CTAs, panels |
| `--brand-700` | `#A50F26` | Hover / depth |
| `--brand-bright` | `#E2001A` | Logo accent / icon highlights |
| `--brand-050` | `#FCEBEE` | Light tint (tags, focus rings) |
| `--ink` | `#2F2F33` | Dark funnel section + footer |
| `--mist` | `#F5F5F6` | Light section backgrounds |
| `--line` | `#E6E6E9` | Borders |
| `--text` / `--muted` | `#22222A` / `#6B6B73` | Body / secondary text |
| `--accent-amber` | `#F39200` | "Erkend leerbedrijf" badge |
| `--radius-card` / `--radius-lg` | `26px` / `34px` | Card rounding |

**Typography:** headings use `Figtree` (700–900), body uses `Mulish` (400–800).
Swap the `<link>` in `<head>` + the `font-family` rules to change them.

---

## Page structure (section map)

Sections appear in this order in the HTML. Anchor IDs are used by the CTAs.

1. `header.nav` — sticky top bar (logo, phone, **Kennismaken?** CTA). Gains a shadow on scroll.
2. `section.hero` — job title card, dual CTAs (`Lees verder`, `Solliciteren`), location/level chips, floating salary highlight (`€2.650 → €3.100`).
3. `section.kort` `#in-het-kort` — the five USP bullets + video card.
4. `section.funnel` `#kennismaken` — **the conversion core**: 4-step process (Intake → Gesprek → Meeloopdag → Welkom) next to the lead form.
5. `section.stories` — three colleague testimonials (Caroline, Hans, Pieter).
6. `section.gallery` — auto-playing image carousel.
7. `section.over` — crimson "Over Beter Horen" panel with three stats (`+200 / +10.000 / +100`).
8. `footer.foot` — socials, "Erkend leerbedrijf" badge, legal links.
9. `.mobile-cta` — sticky bottom CTA bar that slides in after 600px of scroll (mobile only).

All `Kennismaken?` / `Solliciteren` buttons link to `#kennismaken` (the form).

---

## TODO — two things to finish before launch

### 1. Add the real photos

Every photo slot is an `<img data-photo>` with an empty `src`, sitting on top of a
designed on-brand fallback. Set the `src` and it fades in automatically — no other
changes needed. If a URL fails, it gracefully falls back to the designed art.

| Slot | Where | Suggested image |
|------|-------|-----------------|
| Hero | `.hero-photo` | Audicien welcoming someone in a Beter Horen store |
| Video poster | `.video-card .v-photo` | Friendly still / video thumbnail |
| Testimonials ×3 | `.story-photo img` | Portraits of Caroline, Hans, Pieter |
| Carousel ×4 | `.slide img` | Workplace / consultation / store scenes |

```html
<!-- before -->
<img class="hero-photo" data-photo alt="" src="">
<!-- after -->
<img class="hero-photo" data-photo alt="Audicien verwelkomt klant" src="images/hero.jpg">
```

The loader in the `<script>` block (`img[data-photo]`) handles the fade-in and the
`error` fallback for you.

### 2. Wire up the form

The form (`#kForm`) currently validates client-side and shows a "Bedankt" success
state, but does **not** send anywhere. To connect it, edit the `submit` handler near
the bottom of the `<script>`:

```js
form.addEventListener('submit', async e => {
  e.preventDefault();
  // ...existing validation stays...
  if (!valid) { /* focus first error */ return; }

  // ── add your backend call here ──
  const data = new FormData(form);
  await fetch('/api/sollicitatie', { method: 'POST', body: data });
  // ───────────────────────────────

  form.style.display = 'none';
  success.classList.add('show');
  success.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
```

Fields submitted: `naam`, `email`, `tel`, `plaats`, `extra`, `cv` (file),
`loondienst` (checkbox). Required: naam, email, tel, plaats.

> **Note:** `<form>` posts and `FormData` work fine in a real browser/server. (If you
> ever paste this into a Claude.ai *artifact* preview, native form posting is blocked
> there — but that's irrelevant for the real deployed page.)

---

## Content notes / decisions

- **"Molenaar" → "Beter Horen":** the mockup's Meeloopdag step said *"…hoe het is om bij Molenaar te werken"* (leftover from another template). Corrected to Beter Horen.
- **Testimonials:** the mockup used lorem ipsum. Replaced with realistic Dutch copy for Caroline (Officemanager), Hans (Sales) and Pieter (Audicien). Edit freely — they're plain text in the `.story` blocks.
- **Salary** is surfaced prominently (hero chip + bullet) as the primary conversion driver.
- **Phone number / social links** point at the real Beter Horen / Amplifon URLs found on the live site; double-check they're the ones the recruitment team wants.

---

## Conversion / funnel features baked in

- Single primary action repeated throughout (every CTA → the form).
- Friction-reducers: visible 4-step process, salary up front, social proof (testimonials + stats).
- Sticky desktop nav CTA + sticky mobile bottom CTA.
- Inline form validation + reassuring success state + privacy reassurance line.
- Staggered scroll-reveal animations and hover micro-interactions (respects `prefers-reduced-motion`).

---

## Responsive behaviour

| Breakpoint | What changes |
|-----------|--------------|
| `≤ 900px` | Floating salary chip hidden |
| `≤ 860px` | Funnel grid → single column |
| `≤ 820px` | "In het kort" + testimonials + carousel → single column |
| `≤ 620px` | Mobile sticky CTA enabled, phone in nav hidden |
| `≤ 420px` | Form tel/woonplaats row → single column |

---

## Suggested file layout (if splitting up in Claude Code)

The page is intentionally one file for easy handoff. If you want to break it apart:

```
beterhoren/
├─ index.html          # markup
├─ css/styles.css      # move the <style> block here
├─ js/main.js          # move the <script> block here
├─ images/             # hero, portraits, carousel, video poster
└─ README.md
```

Then replace the inline `<style>`/`<script>` with `<link>` / `<script src>` tags.

---

*Built for Beter Horen (onderdeel van de Amplifon-groep). Brand colours and assets are
property of Beter Horen / Amplifon.*
# beterhoren

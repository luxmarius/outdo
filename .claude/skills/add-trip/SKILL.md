---
name: add-trip
description: Add a new bikepacking trip to the Outdo site from photos, a GPX file and notes the owner provides. Use when the owner says "add the <place> trip", "new trip", "put <year> trip on the site".
---

# Add a trip

## Inputs to collect (ask for anything missing)

- Trip title (e.g. "Porto to Lisbon") and a one-line tagline in the owners' voice
- Start and end date
- Countries ridden through, and who rode
- Photos (folder or upload) — which one is the cover
- GPX file of the whole route (optional but strongly preferred)
- Per-day: from → to, km, ascent, descent, one or two sentence summary.
  If the owner gives only the GPX plus overnight stops, compute km/ascent/descent per day from the GPX
  (split at the stops, sum elevation gain with a 5 m smoothing threshold) and show the numbers for approval.
- Optional: YouTube film link, Spotify track/playlist, a quote from a guest rider

## Steps

1. Choose the slug: `<yyyy>-<from>-<to>` in lowercase, hyphens only. Example `2026-porto-lisbon`.
2. Copy `src/content/trips/2023-munich-garda/index.md` to `src/content/trips/<slug>/index.md` and replace every field.
   Keep the markdown body short: a paragraph or two of story, optional "What we'd do differently".
3. Images:
   - Create `public/images/trips/<slug>/`.
   - Save the cover as `cover.jpg`, the rest as `01.jpg`, `02.jpg`, … in the order the owner wants.
   - Resize so the longest side is ≤ 2000 px, JPEG quality 80. Strip EXIF. Use `sharp` via npx or Python Pillow — do not commit originals.
   - Write a short, real `alt` for each gallery image.
4. GPX: save to `public/gpx/<slug>.gpx`. If it is larger than ~2 MB, simplify it (e.g. `gpsbabel` or a Douglas-Peucker pass) to under 1 MB.
5. Featured: set `featured: true` on this trip and `featured: false` on whichever trip had it. Exactly one trip is featured.
6. Run `npm run build`. Open `npm run dev` and check `/`, `/trips`, `/trips/<slug>` at desktop and ~380 px width.
7. Report back with: the URL path, the totals (days / km / m up), and anything you had to guess.

## Do not

- Change components or layouts to make one trip fit. If the schema really can't express something, propose a schema change and stop.
- Invent numbers or summaries. Placeholders are fine if clearly marked `TODO`.

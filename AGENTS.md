# Outdo — site guide for Claude Code

This is the website of Outdo, a group of friends who do one or two bikepacking trips a year.
The site has two kinds of content: **trips** (one page per trip) and **notes** (a blog about
travelling with a bike). It is a static Astro site deployed to GitHub Pages.

The owners do not write code. They give you content (photos, GPX files, text, links) and
ask for changes in plain language. Keep the site simple enough that this stays true.

## Golden rules

1. **Content changes never touch code.** A new trip or post is a new file under `src/content/`.
   Layouts, components and pages change only when the owners ask for a design or feature change.
2. **Schema is the contract.** `src/content.config.ts` defines what a trip and a post contain.
   If content is missing a required field, ask the owner for it rather than inventing it.
   If a new kind of content keeps coming up, propose a schema change; don't hack around it.
3. **Every internal link and asset path goes through `url()`** from `src/lib/url.ts`
   so the site works under a GitHub Pages base path.
4. **Design tokens live in `src/styles/global.css`.** Change colours/fonts there, not inline.
5. **Run `npm run build` before finishing any task.** A broken build means a broken deploy.
6. Keep dependencies boring. Prefer plain Astro + CSS. Leaflet is loaded from a CDN. No React/Tailwind.

## Layout of the repo

```
src/content/trips/<yyyy-slug>/index.md   one trip (frontmatter + optional story in markdown)
src/content/blog/<slug>.md               one note/blog post
src/data/site.json                       site-wide text: name, tagline, team, FAQ, contact
src/content.config.ts                    schemas for trips and blog (zod)
src/layouts/Base.astro                   html shell, head, header, footer
src/components/                          TripHero, TripCard, DayList, TripTotals, RouteMap, Gallery, Quote, Faq
src/pages/                               index, trips/, trips/[slug], blog/, blog/[slug], about
src/styles/global.css                    design tokens + base styles
src/lib/                                 url(), date/number formatting
public/images/trips/<yyyy-slug>/         photos for that trip (cover.jpg, 01.jpg, 02.jpg …)
public/images/team/                      team portraits
public/gpx/<yyyy-slug>.gpx               route file for that trip
.github/workflows/deploy.yml             builds and deploys on push to main
.claude/skills/                          add-trip, add-blog-post — follow these for content tasks
```

## Design language

Keep the feel of the original Outdo site: big confident headline over a full-bleed photo/video,
then calm, well-spaced sections. The signature element is the day-by-day list with the
distance figure and the ascent bar. Don't add decoration; add information.

- Background `--stone` (#edefea), text `--ink` (#16211c), accent `--lake` (#1e7f8e), ascent bars `--ochre`.
- Display type: Bricolage Grotesque 800. Body: Instrument Sans.
- Headlines in sentence case. No all-caps labels, no numbered "01/02/03" markers, no gradient washes.
- One hero per page. Sections separated by a hairline. Cards only for trip previews.
- Motion: none on load. Hover states only.
- Mobile first: check every layout at ~380px wide.

## Adding a trip (summary — full steps in .claude/skills/add-trip)

1. Create `src/content/trips/<yyyy-slug>/index.md` from an existing one.
2. Put photos in `public/images/trips/<yyyy-slug>/` — resize to max 2000px wide, JPEG quality ~80.
3. Put the GPX in `public/gpx/<yyyy-slug>.gpx`. Extract per-day km/ascent/descent from it if the owner hasn't given numbers.
4. Set `featured: true` on the new trip and `featured: false` on the previous one (only one featured trip).
5. `npm run build`, fix anything, done. The homepage, trip index and navigation update automatically.

## Adding a note (blog post)

Create `src/content/blog/<slug>.md` with frontmatter `title, description, date, author, tags`.
Optional `cover` image goes in `public/images/blog/`.

## Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`. In the GitHub repo settings,
Pages → Source must be set to **GitHub Actions** once.

`astro.config.mjs` needs `site` (and `base` if this is a project repo, e.g. `/outdo`) set
correctly. See the comment at the top of that file.

## Local preview

```
npm install
npm run dev        # http://localhost:4321
npm run build      # must pass before committing
npm run preview    # serves the built site
```

## Things to ask the owner instead of guessing

- The trip's dates, riders, and one-line tagline
- Which photo is the cover
- Whether the trip should replace the current featured trip on the homepage
- Per-day summaries (one or two sentences each) — these are the voice of the site

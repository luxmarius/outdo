# Outdo

The website of Outdo — a group of friends who do one or two bikepacking trips a year.
Built with [Astro](https://astro.build), hosted on GitHub Pages.

- Trips live in `src/content/trips/`, one folder each.
- Notes (blog) live in `src/content/blog/`, one file each.
- The homepage carousel is curated in `src/content/journal/`, one JSON file per slide, sorted by `order`. A `kind: "trip"` entry references a full trip and uses its existing details; a `kind: "preview"` entry needs only its title, place and image. This keeps dates and trip stories out of design placeholders. When a full trip is added, change its preview to a trip reference. The schema lives in `src/content.config.ts`.
- Read `CLAUDE.md` for how the site is organised and how to add content.

## Setting it up on GitHub (one time)

1. Create a new repository on GitHub and push this folder to it (branch `main`).
2. In the repo: **Settings → Pages → Source → GitHub Actions**.
3. Edit `astro.config.mjs`:
   - `site`: `https://<your-user>.github.io`
   - `base`: `/<repo-name>` if the repo is not `<your-user>.github.io`, otherwise `/`.
4. Push. The workflow in `.github/workflows/deploy.yml` builds and publishes the site.

Custom domain later: add a `CNAME` file in `public/` with the domain, set it in Pages settings, and change `site`/`base` accordingly.

## Working on it

```
npm install
npm run dev
```

## Replacing placeholders

The first trip ships with generated placeholder images and a coarse GPX so the site builds.
Drop the real files in:

- `public/images/trips/2023-munich-garda/cover.jpg`, `01.jpg` … `05.jpg`
- `public/images/team/marc.jpg`, `daniel.jpg`, `marius.jpg`
- `public/gpx/2023-munich-garda.gpx`
- `public/images/og-default.jpg` (1200×630, used for link previews)

# Outdo globe

A spinnable globe with routes drawn on it. Click a dot and the globe flies down to that
route and opens a card with a photo, a line of info and a link. "Whole globe" takes you back up.
It turns slowly until touched, and not at all for people who prefer reduced motion.

Built on [MapLibre GL JS](https://maplibre.org) (open source, loaded from a CDN) and
[OpenFreeMap](https://openfreemap.org) tiles (free, no API key). No build step.

## Try it

Open `index.html` in a browser. It works straight from the file system because the demo
routes are inlined in `routes.js`. If your routes come from GPX files, serve the folder
instead (`npx serve .` or `python3 -m http.server`) — browsers refuse `fetch` on `file://`.

## Use it in a project

```html
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css">
<link rel="stylesheet" href="globe.css">

<div id="globe"></div>

<script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js"></script>
<script src="globe.js"></script>
<script>
  OutdoGlobe.create(document.getElementById('globe'), {
    routes: [
      {
        title: 'Munich to Lake Garda',
        subtitle: '20–27 September 2023 · Germany, Austria, Switzerland, Italy',
        image: '/images/garda/cover.jpg',
        href: '/trips/2023-munich-garda',
        gpx: '/gpx/2023-munich-garda.gpx',       // or points: [[lng, lat], ...]
      },
      { title: 'Osaka to Fukuoka', subtitle: 'Japan', sketch: true, points: [[135.5, 34.69], [130.4, 33.59]] },
    ],
  });
</script>
```

### Route fields

| field      | what it is |
|------------|------------|
| `title`    | shown in the card and as the dot's accessible name |
| `subtitle` | one line under the title (dates, countries) — optional |
| `image`    | photo at the top of the card — optional |
| `href`     | where "See the trip →" goes; without it the card says "Page coming soon" |
| `points`   | `[[lng, lat], ...]` — note longitude first |
| `gpx`      | URL of a GPX file, used when `points` is absent; simplified to ~600 points |
| `sketch`   | `true` for a rough, dashed line with a hollow dot |

### Options (all optional)

| option          | default | notes |
|-----------------|---------|-------|
| `style`         | OpenFreeMap positron | any MapLibre style URL |
| `home`          | `{ center: [14, 40], zoom: 1.3 }` | resting view |
| `background`    | `#eef1ea` | colour around the sphere — match your page |
| `spin`          | `true`  | ambient rotation until touched |
| `spinSpeed`     | `0.035` | degrees per frame |
| `labelsFromZoom`| `5`     | map labels hidden below this zoom |
| `lineColor`, `sketchColor` | moss greens | route line colours |
| `fitPadding`, `fitMaxZoom` | `90`, `9` | how close the fly-in gets |
| `linkLabel`, `soonLabel`, `resetLabel` | English strings | copy |
| `onSelect`      | `null`  | `(route) => {}` when a dot is clicked |

`create()` returns `{ map, reset }` — `map` is the MapLibre instance if you want to go further.

### Colours

Everything visual is a CSS custom property on `.og-globe-wrap` in `globe.css`
(`--og-bg`, `--og-ink`, `--og-dot`, `--og-line`, fonts, radius). Override them on your own
selector to match another site.

## Astro version

`astro/Globe.astro` is the component as it lives on the Outdo site: it takes the trips
collection as a prop and reads routes from each trip's GPX. `astro/route-sketches.json`
is the temporary sketch data it also draws. It's the same JavaScript as `globe.js`, inlined.

## Credits

MapLibre GL JS (BSD-3). Tiles © OpenFreeMap, © OpenMapTiles, data © OpenStreetMap
contributors — keep the attribution control visible.

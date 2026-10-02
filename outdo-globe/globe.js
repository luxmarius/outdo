/**
 * Outdo globe — a spinnable globe with routes on it.
 *
 * Requires MapLibre GL JS (v5+) on the page before this script:
 *   <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css">
 *   <script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js"></script>
 *
 * Usage:
 *   OutdoGlobe.create(document.getElementById('my-globe'), {
 *     routes: [ { title, subtitle, image, href, points: [[lng, lat], ...] }, ... ],
 *   });
 *
 * A route can give `points` directly, or `gpx: 'path/to/file.gpx'` (fetched and simplified).
 * Set `sketch: true` for a rough, dashed route without a page yet.
 *
 * Basemap: OpenFreeMap "positron" (free, no API key). Swap `style` in options for another.
 */
(function (global) {
  const DEFAULTS = {
    routes: [],
    style: 'https://tiles.openfreemap.org/styles/positron',
    home: { center: [14, 40], zoom: 1.3 },   // where the globe rests
    background: '#eef1ea',                   // colour around the sphere; match your page
    spin: true,                              // slow turn until touched (off under reduced motion)
    spinSpeed: 0.035,                        // degrees per frame
    labelsFromZoom: 5,                       // hide map labels until zoomed in this far
    lineColor: '#37583b',
    sketchColor: '#6f9a6a',
    fitPadding: 90,
    fitMaxZoom: 9,
    linkLabel: 'See the trip →',
    soonLabel: 'Page coming soon',
    resetLabel: 'Whole globe',
    onSelect: null,                          // (route) => void, called when a dot is clicked
  };

  function escape(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function cardHtml(r, o) {
    const img = r.image ? `<img src="${escape(r.image)}" alt="">` : '';
    const sub = r.subtitle ? `<span class="og-meta">${escape(r.subtitle)}</span>` : '';
    if (r.href) return `<a class="og-card" href="${escape(r.href)}">${img}<strong>${escape(r.title)}</strong>${sub}<span class="og-go">${escape(o.linkLabel)}</span></a>`;
    return `<div class="og-card">${img}<strong>${escape(r.title)}</strong>${sub}<span class="og-meta">${escape(o.soonLabel)}</span></div>`;
  }

  async function loadGpx(src) {
    const r = await fetch(src);
    if (!r.ok) return null;
    const xml = new DOMParser().parseFromString(await r.text(), 'application/xml');
    const pts = [...xml.querySelectorAll('trkpt, rtept')].map((p) => [+p.getAttribute('lon'), +p.getAttribute('lat')]);
    if (!pts.length) return null;
    const step = Math.max(1, Math.ceil(pts.length / 600));
    return pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
  }

  function create(container, options) {
    if (!global.maplibregl) throw new Error('OutdoGlobe: load maplibre-gl before globe.js');
    const o = Object.assign({}, DEFAULTS, options);
    const reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // DOM: wrapper > [globe, reset button]
    container.classList.add('og-globe-wrap');
    const box = document.createElement('div');
    box.className = 'og-globe';
    box.setAttribute('aria-label', 'Globe showing every route');
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'og-reset';
    reset.textContent = o.resetLabel;
    reset.hidden = true;
    container.append(box, reset);

    const map = new maplibregl.Map({
      container: box,
      style: o.style,
      center: o.home.center,
      zoom: o.home.zoom,
      minZoom: 0.7,
      dragRotate: false,
      pitchWithRotate: false,
      cooperativeGestures: true,            // page scroll stays page scroll; ctrl/⌘+wheel zooms
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('style.load', () => {
      map.setProjection({ type: 'globe' });
      map.setSky({ 'atmosphere-blend': 0 });   // no blue halo — the page shows through around the sphere
      const layers = map.getStyle().layers;
      const bg = layers.find((l) => l.type === 'background');
      if (bg) map.setPaintProperty(bg.id, 'background-color', o.background);
      layers.filter((l) => l.type === 'symbol').forEach((l) => map.setLayerZoomRange(l.id, Math.max(l.minzoom || 0, o.labelsFromZoom), l.maxzoom ?? 24));
    });

    // ambient spin
    let spinning = o.spin && !reduced;
    const frame = () => {
      if (!spinning) return;
      const c = map.getCenter();
      map.jumpTo({ center: [c.lng + o.spinSpeed, c.lat] });
      requestAnimationFrame(frame);
    };
    const stop = () => { spinning = false; };
    ['mousedown', 'touchstart', 'wheel', 'zoomstart'].forEach((e) => map.on(e, stop));

    const popups = [];
    const bounds = (coords) => coords.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));

    function addLine(id, coords, sketch) {
      map.addSource(id, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } } });
      map.addLayer({
        id, type: 'line', source: id,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: Object.assign(
          { 'line-color': sketch ? o.sketchColor : o.lineColor, 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 2, 8, 4] },
          sketch ? { 'line-dasharray': [1.5, 2] } : {}
        ),
      });
    }

    function addDot(route, coords) {
      const mid = coords[Math.floor(coords.length / 2)];
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'og-dot' + (route.sketch ? ' sketch' : '');
      el.setAttribute('aria-label', route.title);
      const popup = new maplibregl.Popup({ offset: 18, maxWidth: '300px', className: 'og-popup' }).setHTML(cardHtml(route, o));
      popups.push(popup);
      new maplibregl.Marker({ element: el }).setLngLat(mid).setPopup(popup).addTo(map);
      el.addEventListener('click', () => {
        stop();
        map.fitBounds(bounds(coords), { padding: o.fitPadding, maxZoom: o.fitMaxZoom, duration: 1500 });
        reset.hidden = false;
        if (typeof o.onSelect === 'function') o.onSelect(route);
      });
    }

    map.on('load', async () => {
      requestAnimationFrame(frame);
      for (let i = 0; i < o.routes.length; i++) {
        const r = o.routes[i];
        const coords = r.points || (r.gpx ? await loadGpx(r.gpx) : null);
        if (!coords || coords.length < 2) continue;
        addLine('og-route-' + i, coords, !!r.sketch);
        addDot(r, coords);
      }
    });

    reset.addEventListener('click', () => {
      popups.forEach((p) => p.remove());
      reset.hidden = true;
      map.flyTo({ center: o.home.center, zoom: o.home.zoom, duration: 1600 });
      map.once('moveend', () => { if (o.spin && !reduced) { spinning = true; frame(); } });
    });

    return { map, reset: () => reset.click() };
  }

  global.OutdoGlobe = { create };
})(window);

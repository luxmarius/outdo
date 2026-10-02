// Adapted from the supplied outdo-globe demo. Loaded only by the trips page.
const MAPLIBRE = 'https://unpkg.com/maplibre-gl@5.6.0/dist/maplibre-gl.js';
let library;
function loadLibrary() {
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  return library ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = MAPLIBRE;
    script.async = true;
    script.onload = () => resolve(window.maplibregl);
    script.onerror = () => reject(new Error('The map library could not load.'));
    document.head.append(script);
  });
}

async function loadCoordinates(route, signal) {
  if (route.points) return route.points;
  const response = await fetch(route.gpx, { signal });
  if (!response.ok) throw new Error('The route could not load.');
  const xml = new DOMParser().parseFromString(await response.text(), 'application/xml');
  if (xml.querySelector('parsererror')) throw new Error('Invalid GPX.');
  const points = [...xml.querySelectorAll('trkpt, rtept')]
    .filter((point) => point.hasAttribute('lon') && point.hasAttribute('lat'))
    .map((point) => [Number(point.getAttribute('lon')), Number(point.getAttribute('lat'))])
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lng) <= 180 && Math.abs(lat) <= 90);
  const step = Math.max(1, Math.ceil(points.length / 600));
  return points.filter((_, i) => i % step === 0 || i === points.length - 1);
}

class OutdoGlobe extends HTMLElement {
  connectedCallback() {
    if (this.controller) return;
    this.controller = new AbortController();
    void this.initialize(this.controller.signal);
  }

  async initialize(signal) {
    const box = this.querySelector('.globe-canvas');
    const status = this.querySelector('.globe-status');
    const controls = this.querySelector('.globe-controls');
    const reset = this.querySelector('.globe-reset');
    const spin = this.querySelector('.globe-spin');
    const choices = [...this.querySelectorAll('.route-choice')];
    const data = JSON.parse(this.dataset.routes);
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const token = (name) => getComputedStyle(this).getPropertyValue(name).trim();
    const options = { signal };
    let map;
    let popup;
    let selected = null;
    let previousFocus;
    let spinning = !motion.matches;
    let inView = true;
    let ready = false;
    let raf = 0;
    let lastTime = 0;
    let resetVersion = 0;
    const markers = [];
    const home = () => ({ center: [20, 35], zoom: box.clientWidth < 500 ? 0.15 : 1.05 });

    const showFallback = () => {
      status.hidden = false;
      status.textContent = 'The globe couldn’t load. You can still explore the trip stories below.';
    };
    const timeout = setTimeout(showFallback, 15000);

    const updateSpin = () => {
      spin.textContent = spinning ? 'Pause rotation' : 'Rotate globe';
      spin.setAttribute('aria-pressed', String(spinning));
    };
    const frame = (time) => {
      raf = 0;
      if (!spinning || !inView || document.hidden || !ready || signal.aborted) return;
      const elapsed = lastTime ? Math.min(time - lastTime, 64) : 0;
      lastTime = time;
      const center = map.getCenter();
      map.jumpTo({ center: [center.lng + elapsed * 0.0021, center.lat] });
      raf = requestAnimationFrame(frame);
    };
    const animate = () => {
      cancelAnimationFrame(raf);
      lastTime = 0;
      raf = requestAnimationFrame(frame);
      updateSpin();
    };
    const stop = () => {
      spinning = false;
      resetVersion++;
      cancelAnimationFrame(raf);
      updateSpin();
    };
    const clearSelection = () => {
      selected = null;
      choices.forEach((button) => button.setAttribute('aria-pressed', 'false'));
      markers.forEach((button) => button.setAttribute('aria-pressed', 'false'));
    };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; animate(); });
    observer.observe(box);
    this.cleanup = () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
      observer.disconnect();
      popup?.remove();
      map?.remove();
    };

    try {
      const gl = await loadLibrary();
      if (signal.aborted) return;
      map = new gl.Map({
        container: box,
        style: 'https://tiles.openfreemap.org/styles/positron',
        ...home(), minZoom: -0.4, maxZoom: 13,
        dragRotate: false, pitchWithRotate: false,
        cooperativeGestures: true,
        attributionControl: { compact: true },
        canvasContextAttributes: { antialias: true },
      });
      map.addControl(new gl.NavigationControl({ showCompass: false }), 'top-right');
      map.on('style.load', () => {
        map.setProjection({ type: 'globe' });
        map.setSky({ 'atmosphere-blend': 0 });
        const layers = map.getStyle().layers;
        const background = layers.find((layer) => layer.type === 'background');
        if (background) map.setPaintProperty(background.id, 'background-color', token('--stone'));
        layers.filter((layer) => layer.type === 'symbol' && (layer.maxzoom ?? 24) > 5)
          .forEach((layer) => map.setLayerZoomRange(layer.id, Math.max(layer.minzoom || 0, 5), layer.maxzoom ?? 24));
      });
      box.addEventListener('pointerdown', stop, options);
      box.addEventListener('wheel', stop, { ...options, passive: true });
      box.addEventListener('keydown', (event) => { if (event.key !== 'Tab') stop(); }, options);
      document.addEventListener('visibilitychange', animate, options);
      motion.addEventListener('change', () => { if (motion.matches) stop(); }, options);

      function selectRoute(index, coordinates, focusFrom) {
        stop();
        map.stop();
        popup?.remove();
        selected = index;
        previousFocus = focusFrom;
        choices.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
        markers.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
        const card = this.querySelector(`template[data-card="${index}"]`).content.cloneNode(true);
        popup = new gl.Popup({ anchor: 'bottom', offset: 20, maxWidth: '280px', className: 'globe-popup', closeOnClick: false, focusAfterOpen: false })
          .setLngLat(coordinates[Math.floor(coordinates.length / 2)]).setDOMContent(card).addTo(map);
        popup.on('close', clearSelection);
        reset.hidden = false;
        const bounds = coordinates.reduce((bounds, coordinate) => bounds.extend(coordinate), new gl.LngLatBounds(coordinates[0], coordinates[0]));
        map.fitBounds(bounds, {
          padding: { top: data[index].image ? 340 : 240, bottom: 55, left: 45, right: 45 },
          maxZoom: 9, duration: motion.matches ? 0 : 1300,
        });
        const close = popup.getElement().querySelector('.maplibregl-popup-close-button');
        close.setAttribute('aria-label', `Close ${data[index].title} preview`);
        if (focusFrom?.matches(':focus-visible')) close.focus({ preventScroll: true });
      }
      const select = selectRoute.bind(this);

      map.on('load', async () => {
        ready = true;
        clearTimeout(timeout);
        status.hidden = true;
        controls.hidden = false;
        animate();
        const loaded = await Promise.allSettled(data.map((route) => loadCoordinates(route, signal)));
        if (signal.aborted) return;
        loaded.forEach((result, index) => {
          if (result.status !== 'fulfilled' || result.value.length < 2) return;
          const coordinates = result.value;
          const route = data[index];
          const id = `outdo-route-${index}`;
          map.addSource(id, { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } } });
          map.addLayer({
            id, type: 'line', source: id,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': token(route.sketch ? '--map-sketch' : '--map-route'),
              'line-width': ['interpolate', ['linear'], ['zoom'], 1, 2, 8, 4],
              ...(route.sketch ? { 'line-dasharray': [1.5, 2] } : {}),
            },
          });
          // A generous invisible hit area makes the route itself clickable.
          map.addLayer({ id: `${id}-hit`, type: 'line', source: id, paint: { 'line-width': 18, 'line-opacity': 0 } });
          map.on('click', `${id}-hit`, () => select(index, coordinates));
          map.on('mouseenter', `${id}-hit`, () => { map.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', `${id}-hit`, () => { map.getCanvas().style.cursor = ''; });
          const marker = document.createElement('button');
          marker.type = 'button';
          marker.className = `globe-marker${route.sketch ? ' sketch' : ''}`;
          marker.setAttribute('aria-label', `Explore ${route.title}`);
          marker.setAttribute('aria-pressed', 'false');
          new gl.Marker({ element: marker }).setLngLat(coordinates[Math.floor(coordinates.length / 2)]).addTo(map);
          markers[index] = marker;
          marker.addEventListener('click', (event) => { event.stopPropagation(); select(index, coordinates, marker); }, options);
          choices[index].disabled = false;
          choices[index].addEventListener('click', () => select(index, coordinates, choices[index]), options);
        });
      });
      reset.addEventListener('click', () => {
        stop();
        popup?.remove();
        clearSelection();
        reset.hidden = true;
        const version = resetVersion;
        map.once('moveend', () => {
          if (version !== resetVersion) return;
          spinning = !motion.matches;
          animate();
        });
        map.flyTo({ ...home(), duration: motion.matches ? 0 : 1400 });
      }, options);
      spin.addEventListener('click', () => {
        if (spinning) stop();
        else {
          popup?.remove();
          if (map.getZoom() > 2) {
            map.jumpTo(home());
            reset.hidden = true;
          }
          spinning = true;
          animate();
        }
      }, options);
      this.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && selected !== null) {
          event.preventDefault();
          popup?.remove();
          previousFocus?.focus({ preventScroll: true });
        }
      }, options);
    } catch {
      if (!signal.aborted) { clearTimeout(timeout); showFallback(); }
    }
  }

  disconnectedCallback() {
    this.controller?.abort();
    this.cleanup?.();
    this.controller = null;
  }
}

if (!customElements.get('outdo-globe')) customElements.define('outdo-globe', OutdoGlobe);

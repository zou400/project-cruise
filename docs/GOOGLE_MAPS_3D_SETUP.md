# Google Maps 3D Aerial setup

Project Cruise v0.10.3 uses the Maps JavaScript API `maps3d` library and the `gmp-map-3d` web component. It loads Google Maps only after the user selects `3D AERIAL`; the existing Leaflet route preview remains the default.

## Setup

1. Create or select a Google Cloud project with billing enabled.
2. Enable the Maps JavaScript API and confirm that 3D Maps is available for the project.
3. Create a **browser** API key.
4. Restrict the key by HTTP referrer to the exact GitHub Pages or production HTTPS origin.
5. Restrict the key to the Maps JavaScript API.
6. Edit `runtime-config.js`:

```js
window.PROJECT_CRUISE_RUNTIME = {
  googleMaps3dEnabled: true,
  googleMapsApiKey: "YOUR_RESTRICTED_BROWSER_KEY",
  weatherEndpoint: "",
  storyMode: "auto",
  storyIntensity: "trace",
  vehicleTraits: []
};
```

## Behavior

- `ROUTE` uses the existing 2D route preview.
- `3D AERIAL` loads Google Maps on demand and centers an angled HYBRID view on the destination.
- Start, waypoint, and destination markers are added when coordinates are available.
- A failed API load automatically returns to `ROUTE`.
- An unconfigured key never disables the 2D map or Google Maps navigation link.

## Security boundary

Browser API keys are visible to the browser. Protection comes from HTTPS referrer and API restrictions. Never place a server-side unrestricted key in `runtime-config.js`.

Official references:

- https://developers.google.com/maps/documentation/javascript/examples/3d/add-map-html
- https://developers.google.com/maps/documentation/javascript/load-maps-js-api

/*
 * Optional runtime integrations for Project Cruise.
 * Browser keys must be restricted to the deployed HTTPS origin in Google Cloud.
 * Keep googleMaps3dEnabled false until Maps JavaScript API / maps3d is enabled.
 */
window.PROJECT_CRUISE_RUNTIME = {
  googleMaps3dEnabled: false,
  googleMapsApiKey: "",
  weatherEndpoint: "",
  storyMode: "auto",
  storyIntensity: "trace",
  vehicleTraits: []
};

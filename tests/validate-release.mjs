import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const html = read("index.html");
const destinations = JSON.parse(read("destinations.json"));
const routes = JSON.parse(read("routes.json"));
const manifest = JSON.parse(read("assets/visuals/manifest.json"));
const checks = [];

function check(name, condition, detail = "") {
  checks.push({ name, passed: Boolean(condition), detail });
}

const canonical = routes.filter(route => route.candidateSource === "canonical_route");
const direct = routes.filter(route => route.candidateSource === "destination_direct");
check("destinations_count", destinations.length === 320, String(destinations.length));
check("results_count", routes.length === 501, String(routes.length));
check("canonical_routes_count", canonical.length === 181, String(canonical.length));
check("direct_results_count", direct.length === 320, String(direct.length));
check("destination_ids_unique", new Set(destinations.map(item => item.id)).size === 320);
check("result_ids_unique", new Set(routes.map(item => item.id)).size === 501);
check("release_version", html.includes("CINEMATIC POLISH v0.10.3") && !html.includes('pageVersion:"v0.10.2.1"'));
check("visual_reveal", html.includes("MISSION UNLOCKED / 今夜の一本"));
check("learning_schema_v5", html.includes("LEARNING_SCHEMA_VERSION=5"));
check("midnight_noir", html.includes("MIDNIGHT NOIR") && html.includes("midnightNoirLine"));
check("maps3d_on_demand", html.includes('importLibrary("maps3d")') && html.includes("googleMaps3dConfigured"));
check("runtime_key_not_embedded", !/googleMapsApiKey:\s*"[^"]{12,}"/.test(read("runtime-config.js")));

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
check("duplicate_html_ids", duplicateIds.length === 0, duplicateIds.join(","));

const queriedIds = [...html.matchAll(/\$\("#([^"]+)"\)/g)].map(match => match[1]);
const missingQueriedIds = [...new Set(queriedIds.filter(id => !ids.includes(id)))];
check("javascript_dom_targets", missingQueriedIds.length === 0, missingQueriedIds.join(","));

for (const [key, file] of Object.entries(manifest.assets)) {
  const assetPath = path.join(root, "assets/visuals", file);
  check(`visual_${key}`, fs.existsSync(assetPath) && fs.statSync(assetPath).size > 40000, file);
}

const failed = checks.filter(item => !item.passed);
const report = {
  release: "Project Cruise Cinematic Polish v0.10.3",
  generatedAt: new Date().toISOString(),
  status: failed.length ? "failed" : "passed",
  checks
};

fs.writeFileSync(path.join(root, "VALIDATION_v0.10.3.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exitCode = failed.length ? 1 : 0;

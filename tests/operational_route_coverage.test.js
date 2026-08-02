const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const routes = JSON.parse(fs.readFileSync(path.join(root, 'routes.json'), 'utf8'));
const destinations = JSON.parse(fs.readFileSync(path.join(root, 'destinations.json'), 'utf8'));
const overlay = JSON.parse(fs.readFileSync(path.join(root, 'data/operational/canonical-operational-overlay-u1b.v0.11.json'), 'utf8'));
const index = JSON.parse(fs.readFileSync(path.join(root, 'data/operational/route-operational-index.v0.11.json'), 'utf8'));
const core = require(path.join(root, 'assets/js/arrival/operational-core.js'));
const data = {
  overlay,
  registry: JSON.parse(fs.readFileSync(path.join(root, 'data/operational/arrival-anchor-display.v0.11.json'), 'utf8'))
};
const indexes = core.buildIndexes(data, destinations);
const overlayIds = new Set(overlay.items.map(item => item.destinationId));
const expected = routes.filter(route => core.destinationIdsForRoute(route, indexes).some(id => overlayIds.has(id)));
const actualIds = new Set(index.routes.map(route => route.routeId));
const checks = [];
function check(name, fn) {
  try { fn(); checks.push({ name, pass: true }); }
  catch (error) { checks.push({ name, pass: false, error: error.message }); }
}
check('all affected routes indexed', () => assert.deepStrictEqual([...actualIds].sort(), expected.map(r => r.id).sort()));
check('summary route count', () => assert.strictEqual(index.summary.affectedRouteCount, expected.length));
check('all overlay destinations have routes', () => assert.strictEqual(index.destinations.filter(row => row.affectedRouteCount === 0).length, 0));
check('canonical count preserved', () => assert.strictEqual(index.summary.canonicalRouteCount, 501));
check('maps blocked for unresolved anchor', () => {
  const route = routes.find(r => core.destinationIdsForRoute(r, indexes).includes('D204'));
  const assessed = core.assessRoute(route, { now: new Date('2026-08-02T12:00:00+09:00') }, route.googleMaps, indexes);
  assert.strictEqual(assessed.state, 'blocked');
  assert.strictEqual(assessed.mapReady, false);
});
check('verified parking replaces destination query', () => {
  const route = routes.find(r => core.destinationIdsForRoute(r, indexes).includes('D185'));
  const assessed = core.assessRoute(route, { now: new Date('2026-08-02T12:00:00+09:00') }, route.googleMaps, indexes);
  assert.strictEqual(assessed.mapReady, true);
  assert.ok(decodeURIComponent(assessed.maps.url).replace(/\+/g, ' ').includes('横須賀美術館 駐車場'));
});
const failures = checks.filter(row => !row.pass);
console.log(JSON.stringify({ total: checks.length, pass: checks.length - failures.length, fail: failures.length, summary: index.summary, checks }, null, 2));
if (failures.length) process.exit(1);

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const core = require('../assets/js/arrival/operational-core.js');
const machineApi = require('../assets/js/arrival/result-state-machine.js');

const root = path.resolve(__dirname, '..');
const project = JSON.parse(fs.readFileSync(path.join(root, 'project-cruise.json'), 'utf8'));
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/arrival/arrival-data.js'), 'utf8'), sandbox);
const data = sandbox.window.PROJECT_CRUISE_ARRIVAL_DATA;
const routes = project.data.routes;
const destinations = project.data.destinations;
const indexes = core.buildIndexes(data, destinations);

const contexts = [
  { label: 'weekday-evening', now: new Date('2026-08-03T19:00:00+09:00'), vehicleWidthM: 2.05, stayMinutes: 30, exitBufferMinutes: 15 },
  { label: 'late-night', now: new Date('2026-08-03T23:15:00+09:00'), vehicleWidthM: 2.05, stayMinutes: 30, exitBufferMinutes: 15 },
  { label: 'holiday-day', now: new Date('2026-08-09T13:00:00+09:00'), vehicleWidthM: 2.05, stayMinutes: 45, exitBufferMinutes: 15 }
];

const byBucket = new Map([['90', []], ['120', []], ['half', []]]);
for (const route of routes) {
  for (const bucket of route.timeBuckets || [route.timeBucket]) {
    if (byBucket.has(bucket)) byBucket.get(bucket).push(route);
  }
}

const matrix = [];
for (const context of contexts) {
  for (const [bucket, pool] of byBucket) {
    const rows = pool.map(route => ({ route, assessment: core.assessRoute(route, context, route.mapUrl, indexes) }));
    const ready = rows.filter(row => row.assessment.state === 'ready');
    const blocked = rows.filter(row => row.assessment.state === 'blocked');
    const pending = rows.filter(row => row.assessment.state === 'pending_anchor');
    assert(ready.length > 0, `${context.label}/${bucket} should retain ready routes`);
    for (const row of ready) {
      assert(row.assessment.maps.url, 'ready route must have Maps URL');
      const destinationEval = row.assessment.evaluations.at(-1);
      const selected = destinationEval ? core.selectAnchors(destinationEval.destinationId, indexes) : null;
      if (selected?.walk?.name) {
        assert(!decodeURIComponent(row.assessment.maps.url).includes(selected.walk.name), 'walk endpoint leaked into driving URL');
      }
    }
    matrix.push({ context: context.label, bucket, total: rows.length, ready: ready.length, blocked: blocked.length, pending: pending.length });
  }
}

// Verify bounded automatic fallback can find another route without learning-side mutations.
const machine = machineApi.create({ maxAutomaticReselects: 8, blockTtlMs: 30 * 60_000, clock: () => Date.parse('2026-08-03T19:00:00+09:00') });
const pool = byBucket.get('120');
const assessments = pool.map(route => ({ route, assessment: core.assessRoute(route, contexts[0], route.mapUrl, indexes) }));
const blockedRow = assessments.find(row => row.assessment.state !== 'ready');
const readyRow = assessments.find(row => row.assessment.state === 'ready');
assert(readyRow, 'a ready fallback route is required');
if (blockedRow) {
  machine.begin(blockedRow.route.id);
  const outcome = machine.block({
    routeId: blockedRow.route.id,
    blockedDestinationId: blockedRow.assessment.blockedDestinationId,
    reason: blockedRow.assessment.reason || 'unknown'
  });
  assert(outcome.shouldReselect);
  const ids = core.destinationIdsForRoute(readyRow.route, indexes);
  assert.equal(machine.isBlocked(readyRow.route.id, ids), false);
}

console.log(JSON.stringify({
  totalRoutes: routes.length,
  contexts: matrix,
  checks: {
    allBucketsRetainReadyRoutes: true,
    readyRoutesHaveMapsUrl: true,
    walkEndpointsExcludedFromDrivingUrl: true,
    boundedFallbackAvailable: true
  }
}, null, 2));

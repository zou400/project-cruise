const assert = require('assert');
const api = require('../assets/js/arrival/result-state-machine.js');

let now = Date.parse('2026-08-02T15:00:00+09:00');
const machine = api.create({
  maxAutomaticReselects: 3,
  blockTtlMs: 60_000,
  clock: () => now
});

assert.equal(machine.snapshot().status, 'idle');
machine.begin('R001');
assert.equal(machine.snapshot().status, 'evaluating');
let result = machine.block({ routeId: 'R001', blockedDestinationId: 'D002', reason: 'parking_closed' });
assert.equal(result.shouldReselect, true);
assert.equal(result.attempts, 1);
assert.equal(machine.isBlocked('R001', []), true);
assert.equal(machine.isBlocked('R999', ['D002']), true);
assert.equal(machine.blockedReason('R001', []), 'parking_closed');

machine.begin('R002');
result = machine.block({ routeId: 'R002', blockedDestinationId: 'D003', reason: 'vehicle_width' });
assert.equal(result.shouldReselect, true);
machine.begin('R003');
result = machine.block({ routeId: 'R003', blockedDestinationId: 'D004', reason: 'facility_closed' });
assert.equal(result.shouldReselect, true);
machine.begin('R004');
result = machine.block({ routeId: 'R004', blockedDestinationId: 'D005', reason: 'anchor_unresolved' });
assert.equal(result.shouldReselect, false);
assert.equal(machine.snapshot().status, 'exhausted');

machine.resetCycle({ source: 'test' });
assert.equal(machine.snapshot().status, 'idle');
assert.equal(machine.snapshot().attempts, 0);
// Resetting a cycle intentionally preserves short-lived blocks.
assert.equal(machine.isBlocked('R001', []), true);
now += 60_001;
assert.equal(machine.isBlocked('R001', []), false);
assert.equal(machine.snapshot().blockedRouteIds.length, 0);

machine.begin('R010');
machine.markPreliminaryReady();
assert.equal(machine.snapshot().status, 'ready_preliminary');
machine.settle({ mapReady: true });
assert.equal(machine.snapshot().status, 'ready');
assert.equal(machine.snapshot().attempts, 0);

assert.match(api.copyForReason('parking_closed'), /駐車場/);
assert.match(api.copyForReason('not-registered'), /確認/);

console.log(JSON.stringify({ total: 18, pass: 18, fail: 0 }, null, 2));

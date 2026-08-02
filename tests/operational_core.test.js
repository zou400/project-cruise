const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const core = require(path.join(root, 'assets/js/arrival/operational-core.js'));
const data = {
  overlay: JSON.parse(fs.readFileSync(path.join(root, 'data/operational/canonical-operational-overlay-u1b.v0.11.json'), 'utf8')),
  registry: JSON.parse(fs.readFileSync(path.join(root, 'data/operational/arrival-anchor-display.v0.11.json'), 'utf8')),
  resolutionLanes: JSON.parse(fs.readFileSync(path.join(root, 'data/operational/resolution-lanes.v0.11.json'), 'utf8')).lanes
};
const destinations = JSON.parse(fs.readFileSync(path.join(root, 'destinations.json'), 'utf8'));
const vectors = JSON.parse(fs.readFileSync(path.join(root, 'data/operational/implementation-test-vectors.v0.11.json'), 'utf8')).tests;
const indexes = core.buildIndexes(data, destinations);
let pass = 0;
const failures = [];
for (const vector of vectors) {
  try {
    if (vector.id.startsWith('LANE-')) {
      const actual = data.resolutionLanes[vector.expected.lane] || [];
      assert.strictEqual(actual.length, vector.expected.count);
      assert.deepStrictEqual(actual, vector.input.anchorIds);
    } else {
      const actual = core.evaluateDestination(vector.input.destinationId, vector.input, indexes);
      for (const [key, expected] of Object.entries(vector.expected)) {
        assert.deepStrictEqual(actual[key], expected, `${vector.id} ${key}`);
      }
    }
    pass += 1;
  } catch (error) {
    failures.push({ id: vector.id, message: error.message });
  }
}
const output = { total: vectors.length, pass, fail: failures.length, failures };
console.log(JSON.stringify(output, null, 2));
if (failures.length) process.exit(1);

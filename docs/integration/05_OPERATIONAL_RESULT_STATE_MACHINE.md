# 05 — Operational Result State Machine

## Purpose

Project Cruise must never hand a user a route that is known to fail at the expected arrival time. The v0.11 overlay therefore evaluates operational truth before ranking and again after the road-time estimate is available.

## State flow

`idle → evaluating → ready_preliminary → ready`

A failed or unresolved result follows:

`evaluating → reselecting → evaluating`

After eight automatic attempts:

`evaluating → exhausted`

The machine keeps route and destination blocks for 30 minutes. A user-initiated reroll resets the attempt counter, but deliberately retains those short-lived blocks so the same invalid destination is not immediately returned.

## Ranking boundary

`eligiblePool()` asks `ProjectCruiseOperational.isRouteEligible(route)` before destination scoring. This means hard gates are applied before:

- destination weighting,
- route variant weighting,
- recency suppression,
- local learning multipliers.

Weather is not part of this gate in v0.11. Weather remains presentation-only.

## Late invalidation

The preliminary check uses the route's stored median or driving budget. After OSRM returns a road estimate, the route is assessed again. If the later arrival time crosses a closing or exit-lock boundary, the result emits `pc:operational-reselect-request` and the canonical draw function selects another route without recording a user rejection.

An operational skip is written only as an `operational_skip` event for diagnosis. It does not write accepted/rejected preference signals.

## Maps safety

A result is `ready` only when:

- all operational destination checks pass,
- every driving point has a safe map query,
- unresolved parking anchors are not promoted,
- walking endpoints are excluded from driving waypoints.

## Kill switch

`?pcOps=off` removes the overlay and restores the canonical v0.10.0 selection and Maps behavior.

## Automated evidence

- `tests/result_state_machine.test.js`
- `tests/operational_selection_integration.test.js`
- `records/result-state-machine-test.json`
- `records/operational-selection-matrix.json`

The matrix covers 501 results over three representative Tokyo-time contexts and all three time buckets.

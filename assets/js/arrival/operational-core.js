/* Project Cruise Operational Overlay Core v0.11
 * Pure logic: no DOM, no network, no mutation of canonical datasets.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ProjectCruiseOperationalCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const unresolvedDecisions = new Set([
    "hold_direct_maps_until_parking_selected"
  ]);

  const toDate = value => {
    if (value instanceof Date) return new Date(value.getTime());
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? new Date() : date;
  };
  const tokyoFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
    weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  });
  const tokyoParts = date => {
    const parts = Object.fromEntries(tokyoFormatter.formatToParts(date).filter(part => part.type !== "literal").map(part => [part.type, part.value]));
    const weekdays = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), weekday: weekdays[parts.weekday], hour: Number(parts.hour), minute: Number(parts.minute) };
  };
  const hhmm = date => { const p = tokyoParts(date); return p.hour * 60 + p.minute; };
  const inWindow = (date, start, end) => {
    const value = hhmm(date);
    return value >= start && value < end;
  };
  const addMinutes = (date, minutes) => new Date(date.getTime() + Math.max(0, Number(minutes) || 0) * 60000);
  const normalize = value => String(value || "").replace(/[\s　]+/g, " ").trim().toLowerCase();
  const destinationIdFromRouteId = routeId => {
    const match = String(routeId || "").match(/(?:^|-)D(\d{3})(?:$|-)/i);
    return match ? `D${match[1]}` : null;
  };

  function buildIndexes(data, destinations) {
    const overlayItems = data?.overlay?.items || [];
    const anchors = data?.registry?.anchors || [];
    const overlayByDestinationId = new Map(overlayItems.map(item => [item.destinationId, item]));
    const anchorsByDestinationId = new Map();
    for (const anchor of anchors) {
      const id = String(anchor.spotEntityKey || "").replace(/^SPOT-/, "");
      if (!anchorsByDestinationId.has(id)) anchorsByDestinationId.set(id, []);
      anchorsByDestinationId.get(id).push(anchor);
    }
    const destinationByName = new Map((destinations || []).map(item => [normalize(item.name), item]));
    return { overlayByDestinationId, anchorsByDestinationId, destinationByName };
  }

  function destinationIdForName(name, indexes) {
    return indexes.destinationByName.get(normalize(name))?.id || null;
  }

  function destinationIdsForRoute(route, indexes) {
    const ids = [];
    const direct = destinationIdFromRouteId(route?.id);
    if (direct) ids.push(direct);
    const names = [...(Array.isArray(route?.waypoints) ? route.waypoints : []), route?.destination].filter(Boolean);
    for (const name of names) {
      const id = destinationIdForName(name, indexes);
      if (id && !ids.includes(id)) ids.push(id);
    }
    return ids;
  }

  function anchorsFor(destinationId, indexes) {
    return indexes.anchorsByDestinationId.get(destinationId) || [];
  }

  function selectAnchors(destinationId, indexes) {
    const anchors = anchorsFor(destinationId, indexes);
    const driving = anchors.filter(anchor => anchor.drivingEligible && anchor.anchorRole !== "display_only");
    const primary = driving.find(anchor => anchor.defaultForMaps) || driving.find(anchor => anchor.anchorRole === "primary") || driving[0] || null;
    const alternates = driving.filter(anchor => anchor !== primary);
    const walk = anchors.find(anchor => anchor.type === "walk_only_endpoint" || anchor.anchorRole === "walk_endpoint") || null;
    const display = anchors.find(anchor => anchor.anchorRole === "display_only") || null;
    const unresolved = !!primary && ["anchor_choice_required", "parking_selection_required"].includes(primary.status);
    return { primary, alternates, walk, display, unresolved, all: anchors };
  }

  function genericResult(destinationId, indexes) {
    const overlay = indexes.overlayByDestinationId.get(destinationId) || null;
    const selected = selectAnchors(destinationId, indexes);
    return {
      destinationId,
      eligible: true,
      reason: null,
      experienceState: overlay?.experienceState || "canonical",
      anchorId: selected.primary?.anchorId || null,
      overlay,
      anchors: selected
    };
  }

  function evaluateDestination(destinationId, context, indexes) {
    const result = genericResult(destinationId, indexes);
    const overlay = result.overlay;
    if (!overlay) return result;
    const arrival = toDate(context.arrival || context.date || context.now);
    const id = destinationId;

    if (unresolvedDecisions.has(overlay.canonicalDecision) && context.anchorResolved === false) {
      result.eligible = false;
      result.reason = id === "D204" ? "parking_selection_required" : "anchor_unresolved";
      return result;
    }

    const width = Number(context.vehicleWidthM);
    const widthLimits = result.anchors.all.map(a => Number(a.vehicleConstraints?.maxWidthM)).filter(Number.isFinite);
    if (Number.isFinite(width) && widthLimits.length && width > Math.max(...widthLimits) + 1e-9) {
      result.eligible = false;
      result.reason = "vehicle_width";
      return result;
    }

    if (id === "D185") {
      if (!inWindow(arrival, 8 * 60, 22 * 60)) return { ...result, eligible: false, reason: "parking_closed" };
      if (arrival < new Date("2026-09-05T00:00:00+09:00")) result.experienceState = "outdoor_partial";
      result.anchorId = "AA-D185-PARK";
    } else if (id === "D313") {
      if (tokyoParts(arrival).weekday === 1 || !inWindow(arrival, 10 * 60, 18 * 60)) return { ...result, eligible: false, reason: "facility_closed" };
    } else if (id === "D247") {
      if (context.parkingLiveOpen === false) return { ...result, eligible: false, reason: "parking_closed" };
      if (context.deckOpen === false) result.experienceState = "indoor_fallback";
    } else if (id === "D136") {
      const month = tokyoParts(arrival).month;
      const summer = month >= 4 && month <= 9;
      const start = summer ? 6 * 60 + 30 : 7 * 60;
      if (!inWindow(arrival, start, 21 * 60)) return { ...result, eligible: false, reason: "experience_closed" };
    } else if (id === "D315") {
      if (!inWindow(arrival, 10 * 60, 21 * 60)) return { ...result, eligible: false, reason: "facility_closed" };
    } else if (id === "D308") {
      if (tokyoParts(arrival).year === 2026 && tokyoParts(arrival).month === 8 && tokyoParts(arrival).day === 8 && hhmm(arrival) >= 16 * 60) {
        return { ...result, eligible: false, reason: "dated_override" };
      }
      if (!inWindow(arrival, 7 * 60, 24 * 60)) return { ...result, eligible: false, reason: "parking_closed" };
    } else if (id === "D222") {
      if (context.requestedWalkAnchor === "central_entrance") return { ...result, eligible: false, reason: "construction_closure" };
      result.experienceState = "parking_and_walk_construction_reroute";
    } else if (id === "D023") {
      if (context.placeResolved === false || context.parkingOpen === false) return { ...result, eligible: false, reason: "place_or_parking_unresolved" };
      result.anchorId = "AA-D023-PARK";
    } else if (id === "D303") {
      if (tokyoParts(arrival).weekday === 1 || !inWindow(arrival, 9 * 60, 16 * 60 + 30)) return { ...result, eligible: false, reason: "facility_closed" };
    } else if (id === "D312") {
      result.experienceState = "exterior_view_only";
    } else if (id === "D314") {
      const day = tokyoParts(arrival).weekday;
      if (![0, 5, 6].includes(day) || !inWindow(arrival, 10 * 60, 17 * 60)) return { ...result, eligible: false, reason: "facility_closed" };
    } else if (id === "D208") {
      const exit = addMinutes(arrival, (Number(context.stayMinutes) || 30) + (Number(context.exitBufferMinutes) || 15));
      if (hhmm(exit) > 19 * 60) return { ...result, eligible: false, reason: "exit_lock_risk" };
      result.anchorId = "AA-D208-PARK";
    }
    return result;
  }

  function routeArrival(route, now) {
    const median = Number(route?.feasibility?.medianMinutes ?? route?.drivingBudgetMinutes ?? 45);
    return addMinutes(toDate(now), Number.isFinite(median) ? median : 45);
  }

  function evaluateRoute(route, context, indexes) {
    const ids = destinationIdsForRoute(route, indexes);
    const arrival = context.arrival || routeArrival(route, context.now);
    const evaluations = ids.map(destinationId => {
      const selected = selectAnchors(destinationId, indexes);
      return evaluateDestination(destinationId, { ...context, arrival, anchorResolved: !selected.unresolved }, indexes);
    });
    const failed = evaluations.find(item => !item.eligible);
    return {
      eligible: !failed,
      reason: failed?.reason || null,
      blockedDestinationId: failed?.destinationId || null,
      arrival: toDate(arrival).toISOString(),
      evaluations
    };
  }

  function replaceRoutePoint(name, indexes) {
    const destinationId = destinationIdForName(name, indexes);
    if (!destinationId) return { query: name, blocked: false, destinationId: null, walk: null, anchor: null };
    const overlay = indexes.overlayByDestinationId.get(destinationId);
    const selected = selectAnchors(destinationId, indexes);
    if (overlay && !overlay.directMapsAllowed && !selected.primary?.defaultForMaps) {
      return { query: null, blocked: true, destinationId, walk: selected.walk, anchor: selected.primary };
    }
    const verified = selected.primary && !["anchor_choice_required", "parking_selection_required", "canonical_text_only"].includes(selected.primary.status);
    return { query: verified ? selected.primary.mapQuery || selected.primary.name : name, blocked: false, destinationId, walk: selected.walk, anchor: selected.primary };
  }

  function buildMapsUrl(route, baseUrl, indexes) {
    let url;
    try { url = new URL(baseUrl || "https://www.google.com/maps/dir/?api=1"); }
    catch (_) { url = new URL("https://www.google.com/maps/dir/?api=1"); }
    const destination = replaceRoutePoint(route?.destination || "", indexes);
    if (destination.blocked) return { url: null, blocked: true, reason: "anchor_unresolved", destination };
    const waypointRows = (route?.waypoints || []).map(name => replaceRoutePoint(name, indexes));
    const blockedWaypoint = waypointRows.find(row => row.blocked);
    if (blockedWaypoint) return { url: null, blocked: true, reason: "waypoint_anchor_unresolved", destination: blockedWaypoint };
    url.searchParams.set("api", "1");
    url.searchParams.set("travelmode", "driving");
    if (destination.query) url.searchParams.set("destination", destination.query);
    if (waypointRows.length) url.searchParams.set("waypoints", waypointRows.map(row => row.query).filter(Boolean).join("|"));
    else url.searchParams.delete("waypoints");
    return { url: url.toString(), blocked: false, destination, waypoints: waypointRows };
  }

  function assessRoute(route, context, baseUrl, indexes) {
    const evaluation = evaluateRoute(route, context || {}, indexes);
    const maps = buildMapsUrl(route, baseUrl, indexes);
    const blocked = !evaluation.eligible;
    const pending = !blocked && maps.blocked;
    return {
      state: blocked ? "blocked" : pending ? "pending_anchor" : "ready",
      eligible: !blocked,
      mapReady: !blocked && !maps.blocked && !!maps.url,
      reason: blocked ? evaluation.reason : pending ? maps.reason : null,
      blockedDestinationId: blocked ? evaluation.blockedDestinationId : maps.destination?.destinationId || null,
      arrival: evaluation.arrival,
      evaluations: evaluation.evaluations,
      maps
    };
  }

  return {
    buildIndexes,
    normalize,
    destinationIdForName,
    destinationIdsForRoute,
    selectAnchors,
    evaluateDestination,
    evaluateRoute,
    routeArrival,
    buildMapsUrl,
    assessRoute
  };
});

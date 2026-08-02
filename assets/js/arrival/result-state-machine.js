/* Project Cruise Result State Machine v0.11
 * Controls operational validation, automatic reselection, and bounded fallback.
 * Pure logic: no DOM, no network, no canonical data mutation.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ProjectCruiseResultStateMachine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const REASON_COPY = Object.freeze({
    anchor_unresolved: "駐車場がまだ確定していません。",
    parking_selection_required: "駐車場の選定が必要です。",
    waypoint_anchor_unresolved: "経由地の駐車地点が確定していません。",
    vehicle_width: "車幅条件に合う駐車場を確保できません。",
    parking_closed: "到着時刻には駐車場が利用できません。",
    facility_closed: "到着時刻には施設が営業していません。",
    experience_closed: "到着時刻には体験エリアが利用できません。",
    dated_override: "当日の時間指定規制に該当します。",
    construction_closure: "工事中のため指定入口を利用できません。",
    place_or_parking_unresolved: "地点または駐車場の確認が未完了です。",
    exit_lock_risk: "滞在後に駐車場から退出できない可能性があります。",
    map_unavailable: "安全なGoogle Maps終点を作れません。",
    unknown: "成立条件を確認できませんでした。"
  });

  const copyForReason = reason => REASON_COPY[reason] || REASON_COPY.unknown;

  function create(options = {}) {
    const maxAutomaticReselects = Math.max(1, Number(options.maxAutomaticReselects) || 8);
    const blockTtlMs = Math.max(60_000, Number(options.blockTtlMs) || 30 * 60_000);
    const clock = typeof options.clock === "function" ? options.clock : () => Date.now();
    const blockedRoutes = new Map();
    const blockedDestinations = new Map();
    let status = "idle";
    let attempts = 0;
    let currentRouteId = null;
    let lastTransition = null;

    function prune() {
      const now = clock();
      for (const [key, row] of blockedRoutes) if (row.expiresAt <= now) blockedRoutes.delete(key);
      for (const [key, row] of blockedDestinations) if (row.expiresAt <= now) blockedDestinations.delete(key);
    }

    function transition(next, detail = {}) {
      status = next;
      lastTransition = { at: new Date(clock()).toISOString(), status: next, ...detail };
      return snapshot();
    }

    function resetCycle(detail = {}) {
      attempts = 0;
      currentRouteId = null;
      return transition("idle", { event: "reset", ...detail });
    }

    function begin(routeId, detail = {}) {
      currentRouteId = String(routeId || "");
      return transition("evaluating", { event: "begin", routeId: currentRouteId, ...detail });
    }

    function markPreliminaryReady(detail = {}) {
      return transition("ready_preliminary", { event: "preliminary_ready", routeId: currentRouteId, ...detail });
    }

    function settle(detail = {}) {
      attempts = 0;
      return transition("ready", { event: "settled", routeId: currentRouteId, ...detail });
    }

    function markPending(detail = {}) {
      return transition("pending_anchor", { event: "pending", routeId: currentRouteId, ...detail });
    }

    function block(detail = {}) {
      prune();
      const routeId = String(detail.routeId || currentRouteId || "");
      const destinationId = String(detail.blockedDestinationId || "");
      const reason = detail.reason || "unknown";
      const expiresAt = clock() + blockTtlMs;
      const existing = routeId ? blockedRoutes.get(routeId) : null;
      const duplicate = !!existing && existing.reason === reason && existing.expiresAt > clock() && status === "reselecting";
      if (duplicate) {
        return { shouldReselect: false, duplicate: true, attempts, maxAutomaticReselects, reasonCopy: copyForReason(reason), snapshot: snapshot() };
      }
      attempts += 1;
      if (routeId) blockedRoutes.set(routeId, { reason, expiresAt });
      if (destinationId) blockedDestinations.set(destinationId, { reason, expiresAt });
      const shouldReselect = attempts <= maxAutomaticReselects;
      transition(shouldReselect ? "reselecting" : "exhausted", {
        event: "blocked",
        routeId,
        blockedDestinationId: destinationId || null,
        reason,
        reasonCopy: copyForReason(reason),
        attempts,
        maxAutomaticReselects,
        source: detail.source || "operational"
      });
      return { shouldReselect, attempts, maxAutomaticReselects, reasonCopy: copyForReason(reason), snapshot: snapshot() };
    }

    function isBlocked(routeId, destinationIds = []) {
      prune();
      const routeKey = String(routeId || "");
      if (routeKey && blockedRoutes.has(routeKey)) return true;
      return (destinationIds || []).some(id => blockedDestinations.has(String(id || "")));
    }

    function blockedReason(routeId, destinationIds = []) {
      prune();
      const routeKey = String(routeId || "");
      if (routeKey && blockedRoutes.has(routeKey)) return blockedRoutes.get(routeKey).reason;
      for (const id of destinationIds || []) {
        const row = blockedDestinations.get(String(id || ""));
        if (row) return row.reason;
      }
      return null;
    }

    function snapshot() {
      prune();
      return {
        status,
        attempts,
        maxAutomaticReselects,
        currentRouteId,
        blockedRouteIds: [...blockedRoutes.keys()],
        blockedDestinationIds: [...blockedDestinations.keys()],
        lastTransition
      };
    }

    return {
      resetCycle,
      begin,
      markPreliminaryReady,
      settle,
      markPending,
      block,
      isBlocked,
      blockedReason,
      snapshot
    };
  }

  return { create, copyForReason, REASON_COPY };
});

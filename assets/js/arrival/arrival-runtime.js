/* Project Cruise Arrival / Parking Presentation v0.11 */
(() => {
  "use strict";
  const params = new URLSearchParams(location.search);
  if (params.get("pcArrival") === "off" || params.get("pcOps") === "off") return;

  const data = window.PROJECT_CRUISE_ARRIVAL_DATA || {};
  const core = window.ProjectCruiseOperationalCore;
  const machineApi = window.ProjectCruiseResultStateMachine;
  const destinations = window.PROJECT_CRUISE_DESTINATIONS || [];
  if (!core || !machineApi || !data.overlay || !data.registry) return;
  const indexes = core.buildIndexes(data, destinations);
  const machine = machineApi.create({ maxAutomaticReselects: 8, blockTtlMs: 30 * 60 * 1000 });
  let current = null;
  let activeRouteId = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const formatTime = value => {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "--:--" : new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" }).format(date);
  };
  const vehicleWidth = () => {
    const query = Number(params.get("vehicleWidthM"));
    if (Number.isFinite(query)) return query;
    try {
      const profile = JSON.parse(localStorage.getItem("pcVehicleProfileV1") || "null");
      const width = Number(profile?.widthM);
      return Number.isFinite(width) ? width : null;
    } catch (_) { return null; }
  };

  function ensureArrivalPanel() {
    const card = $("#result .result-card");
    if (!card) return null;
    let panel = $("#pc-arrival-panel", card);
    if (panel) return panel;
    panel = document.createElement("section");
    panel.id = "pc-arrival-panel";
    panel.className = "pc-arrival-panel";
    panel.setAttribute("aria-label", "到着時情報");
    panel.innerHTML = `
      <article class="pc-arrival-card pc-parking-card">
        <div class="pc-arrival-card-head">
          <span>ARRIVAL ANCHOR</span>
          <small id="pc-anchor-state">確認中</small>
        </div>
        <h3 id="pc-anchor-name">駐車場を確認中</h3>
        <div class="pc-arrival-facts">
          <div><span>到着予定</span><strong id="pc-arrival-time">計算中</strong></div>
          <div><span>利用時間</span><strong id="pc-anchor-hours">現地確認</strong></div>
          <div><span>徒歩終点</span><strong id="pc-walk-endpoint">なし</strong></div>
        </div>
        <p id="pc-anchor-copy" class="pc-arrival-copy">車を置く場所まで含めて、今夜の一本です。</p>
        <p id="pc-anchor-caution" class="pc-arrival-caution" hidden></p>
      </article>
      <article id="pc-weather-card" class="pc-arrival-card pc-weather-card" aria-live="polite">
        <div class="pc-arrival-card-head">
          <span>ARRIVAL WEATHER</span>
          <small id="pc-weather-state">取得待ち</small>
        </div>
        <h3 id="pc-weather-title">到着エリアの天気</h3>
        <div id="pc-weather-content" class="pc-weather-content">
          <span class="pc-weather-icon" aria-hidden="true">–</span>
          <div><strong>予報を準備中</strong><p>ルート時間の確定後に更新します。</p></div>
        </div>
        <div id="pc-weather-facts" class="pc-weather-facts" hidden></div>
        <p id="pc-weather-narrative" class="pc-arrival-copy">天気は推薦順位を変えず、到着時の参考として表示します。</p>
        <p class="pc-weather-attribution"><a id="pc-weather-source" href="https://open-meteo.com/" target="_blank" rel="noopener">Weather data by Open-Meteo.com</a></p>
      </article>`;
    const intent = $("#intent", card);
    if (intent) intent.insertAdjacentElement("afterend", panel);
    else card.append(panel);
    return panel;
  }

  function destinationId(detail) {
    return detail?.destination?.id || core.destinationIdsForRoute(detail?.route || {}, indexes).slice(-1)[0] || null;
  }

  function routeContext(route, estimateDetail = null) {
    const routeMinutes = Number(estimateDetail?.routeData?.durationMinutes ?? route?.feasibility?.medianMinutes ?? route?.drivingBudgetMinutes ?? 45);
    const safeMinutes = Math.max(5, Number.isFinite(routeMinutes) ? routeMinutes : 45);
    return {
      now: new Date(),
      arrival: new Date(Date.now() + safeMinutes * 60000),
      vehicleWidthM: vehicleWidth(),
      stayMinutes: Number(route?.suggestedStayMinutes || route?.stayPerStopMinutes || 30),
      exitBufferMinutes: 15
    };
  }

  function baseMapUrl() {
    return $("#gmap")?.href || $("#map-link")?.href || "https://www.google.com/maps/dir/?api=1";
  }

  function assess(route, estimateDetail = null) {
    return core.assessRoute(route, routeContext(route, estimateDetail), baseMapUrl(), indexes);
  }

  function arrivalCopy(destination, selected, evaluation) {
    if (!evaluation?.eligible) return "この到着条件では成立しません。別の一本へ切り替えます。";
    if (selected.walk) return "車はここで休憩。最後の数分だけ、夜の空気へ乗り換えます。";
    if (selected.primary?.liveSignalRequired) return "入口と空き状況を確かめたら、そのまま今夜の終点へ。";
    if (destination?.category?.includes("海") || destination?.category?.includes("港")) return "エンジンを休ませて、残りは水辺の音に任せます。";
    if (destination?.category?.includes("公園") || destination?.category?.includes("自然")) return "ここから先は少しだけ徒歩。車には静かに待っていてもらいます。";
    return "車を置いたところから、目的地の時間が始まります。";
  }

  function render(detail, estimateDetail = null, assessment = null) {
    const panel = ensureArrivalPanel();
    if (!panel) return;
    const route = detail?.route || {};
    const destination = detail?.destination || destinations.find(item => item.name === route.destination) || {};
    const id = destinationId({ route, destination });
    if (!id) return;
    const selected = core.selectAnchors(id, indexes);
    const context = routeContext(route, estimateDetail);
    const evaluation = assessment?.evaluations?.find(row => row.destinationId === id) || core.evaluateDestination(id, {
      ...context,
      anchorResolved: !selected.unresolved,
      placeResolved: selected.primary?.status !== "anchor_choice_required",
      parkingOpen: true
    }, indexes);
    current = { detail: { route, destination }, id, selected, arrival: context.arrival, evaluation, assessment };

    const primary = selected.primary || selected.display;
    $("#pc-anchor-name").textContent = primary?.name || "駐車場情報を確認中";
    $("#pc-arrival-time").textContent = formatTime(context.arrival);
    $("#pc-anchor-hours").textContent = primary?.operationalWindow || destination.hours || "出発前に確認";
    $("#pc-walk-endpoint").textContent = selected.walk?.name || "駐車地点が終点";
    $("#pc-anchor-copy").textContent = arrivalCopy(destination, selected, evaluation);
    const state = $("#pc-anchor-state");
    if (!evaluation.eligible) {
      state.textContent = "成立条件外";
      state.dataset.level = "blocked";
    } else if (selected.unresolved) {
      state.textContent = "選定待ち";
      state.dataset.level = "pending";
    } else if (primary?.status === "canonical_text_only") {
      state.textContent = "参考表示";
      state.dataset.level = "reference";
    } else {
      state.textContent = "選択済み";
      state.dataset.level = "ready";
    }
    const caution = $("#pc-anchor-caution");
    const message = primary?.navigationCaution || (selected.unresolved ? "駐車場が確定するまでGoogle Mapsの直行リンクは公開しません。" : "");
    caution.hidden = !message;
    caution.textContent = message;
    panel.dataset.destinationId = id;
    panel.dataset.operationalEligible = String(evaluation.eligible);
    panel.dataset.resultState = assessment?.state || (evaluation.eligible ? "ready" : "blocked");
    document.dispatchEvent(new CustomEvent("pc:arrival-anchor", { detail: current }));
  }

  function applyMapState(route, assessment = null) {
    const result = assessment || assess(route);
    const url = result.mapReady ? result.maps.url : null;
    for (const element of [$("#gmap"), $("#map-link")]) {
      if (!element) continue;
      if (url) {
        element.href = url;
        element.removeAttribute("aria-disabled");
        element.classList.remove("is-disabled");
      } else {
        element.removeAttribute("href");
        element.setAttribute("aria-disabled", "true");
        element.classList.add("is-disabled");
      }
    }
    const button = $("#gmap");
    if (button) {
      if (result.state === "blocked") button.textContent = "成立条件を再確認中";
      else if (result.state === "pending_anchor") button.textContent = "駐車場の選定待ち";
      else button.textContent = "Googleマップで出発";
    }
  }

  function publishState(route, assessment, phase, transition) {
    document.dispatchEvent(new CustomEvent("pc:operational-state", {
      detail: {
        routeId: route?.id || "",
        destination: route?.destination || "",
        phase,
        assessment,
        transition,
        machine: machine.snapshot()
      }
    }));
  }

  function handleAssessment(detail, estimateDetail = null, phase = "preliminary") {
    const route = detail?.route || {};
    if (!route.id) return null;
    if (phase === "estimate" && activeRouteId && String(route.id) !== String(activeRouteId)) return null;
    if (phase === "preliminary") activeRouteId = String(route.id);
    machine.begin(route.id, { phase });
    const assessment = assess(route, estimateDetail);
    render(detail, estimateDetail, assessment);
    applyMapState(route, assessment);

    if (assessment.state === "blocked" || assessment.state === "pending_anchor") {
      const outcome = machine.block({
        routeId: route.id,
        blockedDestinationId: assessment.blockedDestinationId,
        reason: assessment.reason || (assessment.state === "pending_anchor" ? "anchor_unresolved" : "unknown"),
        source: phase
      });
      publishState(route, assessment, phase, outcome.snapshot);
      if (outcome.duplicate) return assessment;
      const eventName = outcome.shouldReselect ? "pc:operational-reselect-request" : "pc:operational-exhausted";
      document.dispatchEvent(new CustomEvent(eventName, {
        detail: {
          route,
          routeId: route.id,
          destination: route.destination,
          blockedDestinationId: assessment.blockedDestinationId,
          reason: assessment.reason,
          reasonCopy: outcome.reasonCopy,
          attempts: outcome.attempts,
          maxAutomaticReselects: outcome.maxAutomaticReselects,
          phase
        }
      }));
      return assessment;
    }

    const transition = phase === "estimate"
      ? machine.settle({ phase, mapReady: assessment.mapReady })
      : machine.markPreliminaryReady({ phase, mapReady: assessment.mapReady });
    publishState(route, assessment, phase, transition);
    return assessment;
  }

  function isRouteEligible(route) {
    const ids = core.destinationIdsForRoute(route, indexes);
    if (machine.isBlocked(route?.id, ids)) return false;
    const result = assess(route);
    return result.state === "ready";
  }

  function mapsUrlFor(route, baseUrl) {
    const result = core.assessRoute(route, routeContext(route), baseUrl || baseMapUrl(), indexes);
    return result.mapReady ? result.maps.url : null;
  }

  window.ProjectCruiseOperational = {
    indexes,
    isRouteEligible,
    mapsUrlFor,
    assessRoute: (route, estimateDetail = null) => assess(route, estimateDetail),
    routeDestinationIds: route => core.destinationIdsForRoute(route, indexes),
    evaluateDestination: (id, context = {}) => core.evaluateDestination(id, context, indexes),
    resetAutoCycle: detail => machine.resetCycle(detail),
    stateSnapshot: () => machine.snapshot(),
    current: () => current
  };

  document.addEventListener("pc:route-shown", event => handleAssessment(event.detail || {}, null, "preliminary"));
  document.addEventListener("pc:route-estimate", event => {
    if (!current) return;
    handleAssessment(current.detail, event.detail || {}, "estimate");
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ensureArrivalPanel, { once: true });
  else ensureArrivalPanel();
})();

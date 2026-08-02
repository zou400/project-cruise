/* Project Cruise GitHub Integration v0.11.0-rc7
 * UI shell only. Canonical selection, learning, Maps, feedback and issue-report
 * behavior remains owned by the inline v0.10.0 engine.
 */
(() => {
  "use strict";

  const params = new URLSearchParams(location.search);
  if (params.get("pcUi") === "classic") return;

  const state = {
    lastRouteId: null,
    lastDetail: null,
    currentWeatherState: "unknown",
    visualHistoryKey: "pcHeroHistoryV1",
    build: "v0.11.0-rc7",
    activeModal: null,
    modalReturnFocus: null,
    lowData: params.get("pcData") === "low",
    heroAssetVersion: "v0.11.0-rc7",
    brandAssetVersion: "v0.11.0-rc7",
    sessionDestinations: new Set(),
    candidateTotal: null
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const text = (value, fallback = "") => String(value ?? fallback).trim();
  const escapeCssUrl = value => String(value).replace(/["\\\n\r]/g, "");

  function addBuildClass() {
    document.body.classList.add("pc-v011");
    document.documentElement.dataset.pcUi = state.build;
  }

  function syncChoiceGroup(group) {
    const buttons = [...group.querySelectorAll("button")];
    const active = buttons.find(button => button.classList.contains("active")) || buttons[0];
    for (const button of buttons) {
      const checked = button === active;
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", String(checked));
      button.tabIndex = checked ? 0 : -1;
    }
  }

  function installChoiceKeyboard(group) {
    if (!group || group.dataset.pcKeyboard) return;
    group.dataset.pcKeyboard = "true";
    syncChoiceGroup(group);
    group.addEventListener("click", () => queueMicrotask(() => syncChoiceGroup(group)));
    group.addEventListener("keydown", event => {
      const buttons = [...group.querySelectorAll("button:not([disabled])")];
      const current = buttons.indexOf(document.activeElement);
      if (current < 0) return;
      let next = current;
      if (["ArrowRight", "ArrowDown"].includes(event.key)) next = (current + 1) % buttons.length;
      else if (["ArrowLeft", "ArrowUp"].includes(event.key)) next = (current - 1 + buttons.length) % buttons.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = buttons.length - 1;
      else return;
      event.preventDefault();
      buttons[next].focus();
      buttons[next].click();
      queueMicrotask(() => syncChoiceGroup(group));
    });
  }

  function focusableElements(root) {
    return [...root.querySelectorAll('a[href],button:not([disabled]),select:not([disabled]),textarea:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])')]
      .filter(node => !node.hidden && getComputedStyle(node).display !== "none" && getComputedStyle(node).visibility !== "hidden");
  }

  function modalCloseControl(modal) {
    if (modal.id === "issue-modal") return $("#issue-close", modal);
    if (modal.id === "reroll-modal") return $("#reroll-skip", modal);
    if (modal.id === "return-modal") return $("#return-later", modal);
    return null;
  }

  function updateModalState(modal) {
    const open = !modal.classList.contains("hidden");
    modal.setAttribute("aria-hidden", String(!open));
    if (open && state.activeModal !== modal) {
      state.modalReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      state.activeModal = modal;
      document.body.classList.add("pc-modal-open");
      requestAnimationFrame(() => {
        const focusables = focusableElements(modal);
        (focusables[0] || $(".issue-panel", modal) || modal).focus({ preventScroll: true });
      });
    } else if (!open && state.activeModal === modal) {
      state.activeModal = null;
      document.body.classList.remove("pc-modal-open");
      const target = state.modalReturnFocus;
      state.modalReturnFocus = null;
      if (target?.isConnected) requestAnimationFrame(() => target.focus({ preventScroll: true }));
    }
  }

  function enhanceAccessibility() {
    document.documentElement.dataset.pcData = state.lowData ? "low" : "normal";
    const main = $("#main-content") || $("main.app");
    if (main && !main.id) main.id = "main-content";
    for (const group of [$(".origin-options"), $(".time-options")]) installChoiceKeyboard(group);

    const aboutToggle = $("#about-toggle");
    const about = $("#about");
    if (aboutToggle && about) {
      const sync = () => aboutToggle.setAttribute("aria-expanded", String(!about.classList.contains("hidden")));
      aboutToggle.addEventListener("click", () => queueMicrotask(sync));
      sync();
    }

    for (const id of ["origin-status", "pool-status", "map-status", "report-toast", "learning-toast"]) {
      const node = $("#" + id);
      if (node) {
        node.setAttribute("role", "status");
        node.setAttribute("aria-live", "polite");
      }
    }

    const modals = [...document.querySelectorAll('.issue-modal[role="dialog"]')];
    for (const modal of modals) {
      const panel = $(".issue-panel", modal);
      if (panel && !panel.hasAttribute("tabindex")) panel.tabIndex = -1;
      updateModalState(modal);
      new MutationObserver(() => updateModalState(modal)).observe(modal, { attributes: true, attributeFilter: ["class"] });
    }

    document.addEventListener("keydown", event => {
      const modal = state.activeModal;
      if (!modal) return;
      if (event.key === "Escape") {
        event.preventDefault();
        modalCloseControl(modal)?.click();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = focusableElements(modal);
      if (!nodes.length) {
        event.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }


  function ensureDecisionDock() {
    let dock = $("#pc-decision-dock");
    if (dock) return dock;
    dock = document.createElement("aside");
    dock.id = "pc-decision-dock";
    dock.className = "pc-decision-dock";
    dock.setAttribute("aria-label", "目的地の再選定");
    dock.innerHTML = `
      <div class="pc-decision-dock-copy">
        <span>NEXT DESTINATION</span>
        <strong id="pc-decision-destination">今夜の一本</strong>
        <small id="pc-decision-progress">候補を準備中</small>
      </div>
      <button id="pc-decision-reroll" type="button">次の一本</button>`;
    document.body.append(dock);
    $("#pc-decision-reroll", dock)?.addEventListener("click", () => {
      const redraw = $("#redraw");
      if (redraw && !redraw.disabled) redraw.click();
    });
    return dock;
  }

  function candidateTotalFromStatus() {
    const match = text($("#pool-status")?.textContent).match(/成立する(\d+)種類/);
    return match ? Number(match[1]) : null;
  }

  function syncDecisionDock() {
    const dock = ensureDecisionDock();
    const result = $("#result");
    const destination = text($("#destination")?.textContent);
    const visible = Boolean(result && !result.classList.contains("hidden") && destination);
    dock.classList.toggle("is-visible", visible);
    document.body.classList.toggle("pc-decision-dock-visible", visible);
    if (!visible) return;
    state.sessionDestinations.add(destination);
    state.candidateTotal = candidateTotalFromStatus() || state.candidateTotal;
    $("#pc-decision-destination", dock).textContent = destination;
    const progress = $("#pc-decision-progress", dock);
    if (progress) progress.textContent = state.candidateTotal
      ? `このセッション ${state.sessionDestinations.size} / ${state.candidateTotal}地点`
      : `このセッション ${state.sessionDestinations.size}地点`;
  }

  function installDecisionDockObservers() {
    ensureDecisionDock();
    const result = $("#result");
    const destination = $("#destination");
    const poolStatus = $("#pool-status");
    if (result) new MutationObserver(syncDecisionDock).observe(result, { attributes: true, attributeFilter: ["class"] });
    if (destination) new MutationObserver(syncDecisionDock).observe(destination, { childList: true, characterData: true, subtree: true });
    if (poolStatus) new MutationObserver(syncDecisionDock).observe(poolStatus, { childList: true, characterData: true, subtree: true });
    syncDecisionDock();
  }

  function enhanceBrand() {
    const brand = $(".brand");
    if (!brand || brand.dataset.pcEnhanced) return;
    brand.dataset.pcEnhanced = "true";
    const version = $("#db-version", brand);
    const versionNode = version ? version.cloneNode(true) : null;
    brand.innerHTML = `
      <div class="pc-brand-row pc-brand-row--v2">
        <a class="pc-brand-logo-link" href="./" aria-label="Project Cruise ホーム">
          <img class="pc-logo-v2" src="assets/brand/project-cruise-mark-v2.svg?v=${state.brandAssetVersion}" alt="PROJECT CRUISE — TOKYO DRIVE SYSTEM">
        </a>
      </div>`;
    if (versionNode) {
      versionNode.textContent = `INTEGRATION RC ${state.build}｜320地点・501結果`;
      brand.append(versionNode);
    }
  }

  function enhanceSelector() {
    const selector = $(".selector");
    if (!selector || selector.dataset.pcEnhanced) return;
    selector.dataset.pcEnhanced = "true";

    const controls = document.createElement("div");
    controls.className = "pc-selector-controls";
    const eyebrow = document.createElement("p");
    eyebrow.className = "pc-selector-eyebrow";
    eyebrow.textContent = "ROUTE CONDITION / 01";
    controls.append(eyebrow);
    [...selector.children].forEach(child => controls.append(child));

    const preview = document.createElement("aside");
    preview.className = "pc-preview-stage pc-preview-stage--hero";
    preview.setAttribute("aria-label", "目的地ビジュアル");

    selector.append(controls, preview);
    const draw = $("#draw");
    if (draw) draw.textContent = "今夜の一本を開く";
    const hint = $(".hint");
    if (hint) hint.textContent = "場所価値・現在適合・ルート完成度を分けて評価。天気はこのRCでは表示参考のみです。";

    selector.addEventListener("click", event => {
      const button = event.target.closest(".time-btn,.origin-btn");
      if (!button) return;
      queueMicrotask(updatePreviewCopy);
    });
  }

  function updatePreviewCopy() {
    const hero = $("#pc-scene-hero");
    if (!hero || state.lastRouteId) return;
    const activeTime = $(".time-btn.active")?.dataset.time || "90";
    const origin = $(".origin-btn.active span:last-child")?.textContent || "現在地";
    const timeCopy = activeTime === "half" ? "半日" : activeTime === "120" ? "2時間" : "90分";
    $(".pc-scene-kicker", hero).textContent = "TONIGHT'S ROUTE";
    $(".pc-scene-destination", hero).textContent = `${origin}から、${timeCopy}の夜。`;
    $(".pc-scene-story", hero).textContent = "一本を開くと、ここが目的地の景色へ切り替わります。";
    $(".pc-scene-index", hero).textContent = "PC / 0104";
  }

  function ensureHero() {
    const stage = $(".pc-preview-stage");
    if (!stage) return null;
    let hero = $("#pc-scene-hero", stage);
    if (hero) return hero;
    hero = document.createElement("article");
    hero.id = "pc-scene-hero";
    hero.className = "pc-scene-hero pc-scene-hero--embedded is-placeholder";
    hero.setAttribute("aria-live", "polite");
    hero.innerHTML = `
      <div class="pc-scene-media" aria-hidden="true">
        <img class="pc-scene-image" alt="" decoding="async" fetchpriority="high">
      </div>
      <div class="pc-scene-content">
        <span class="pc-scene-kicker">TONIGHT'S ROUTE</span>
        <h2 class="pc-scene-destination">今夜の一本</h2>
        <p class="pc-scene-story">条件を選ぶと、ここに目的地が現れます。</p>
        <span class="pc-scene-index">PC / 0104</span>
        <span class="pc-scene-disclosure">体験イメージ</span>
      </div>`;
    stage.replaceChildren(hero);
    return hero;
  }

  function visualTime() {
    const override = params.get("visualTime");
    if (["morning", "day", "night"].includes(override)) return override;
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10) return "morning";
    if (hour >= 10 && hour < 17) return "day";
    return "night";
  }

  function heroPhase() {
    const override = params.get("heroPhase") || params.get("visualTime");
    if (["day", "twilight", "night", "rain"].includes(override)) return override;
    if (override === "morning") return "day";
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 16) return "day";
    if (hour >= 16 && hour < 20) return "twilight";
    return "night";
  }

  function heroWeatherState() {
    const value = params.get("weatherDemoState") || params.get("heroWeather") || state.currentWeatherState || "unknown";
    return ["clear", "cloudy", "rain", "fog", "wind", "unknown"].includes(value) ? value : "unknown";
  }

  function visualCategory(route = {}, destination = {}) {
    const source = [
      destination.category,
      destination.theme,
      destination.type,
      destination.experienceDNA?.category,
      route.theme,
      route.type,
      route.experienceDNA?.category
    ].filter(Boolean).join(" ").toLowerCase();
    if (/pa|高速|首都高|サービスエリア|パーキングエリア/.test(source)) return "pa";
    if (/空港|飛行機|航空|滑走路/.test(source)) return "airport";
    if (/工場|industrial|コンビナート/.test(source)) return "industrial";
    if (/海|港|水辺|湾岸|河川|湖|water/.test(source)) return "water";
    if (/公園|自然|森|山|park/.test(source)) return "park";
    if (/文化|寺|神社|歴史|建築|culture/.test(source)) return "culture";
    return "city";
  }

  function hash(value) {
    let result = 2166136261;
    for (const char of String(value)) {
      result ^= char.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return result >>> 0;
  }

  function heroCandidates(category, time, seed) {
    const timeIndex = time === "morning" ? [1] : time === "day" ? [2] : [3, 4, 5];
    const ordered = [...timeIndex].sort((a, b) => (hash(seed + a) % 97) - (hash(seed + b) % 97));
    return ordered.map(index => `assets/hero/precision/${category}_${time}_${String(index).padStart(2, "0")}.webp`);
  }

  function readVisualHistory() {
    try {
      const value = JSON.parse(localStorage.getItem(state.visualHistoryKey) || "[]");
      return Array.isArray(value) ? value.slice(0, 10) : [];
    } catch (_) {
      return [];
    }
  }

  function rememberVisual(src) {
    try {
      const next = [src, ...readVisualHistory().filter(item => item !== src)].slice(0, 10);
      localStorage.setItem(state.visualHistoryKey, JSON.stringify(next));
    } catch (_) {}
  }

  async function imageAvailable(src) {
    return new Promise(resolve => {
      const image = new Image();
      image.decoding = "async";
      image.fetchPriority = "high";
      const timer = setTimeout(() => resolve(false), 8000);
      image.onload = () => { clearTimeout(timer); resolve(true); };
      image.onerror = () => { clearTimeout(timer); resolve(false); };
      image.src = src;
    });
  }

  async function pickAvailableVisual(route, destination, category, time, seed) {
    if (params.get("pcVisual") === "off") return null;
    const precision = window.ProjectCruiseHeroPrecision?.select?.({
      route,
      destination,
      phase: heroPhase(),
      weatherState: heroWeatherState()
    });
    if (precision) {
      for (const candidate of precision.candidates || [precision]) {
        if (await imageAvailable(candidate.assetPath)) {
          const selected = { ...precision, ...candidate };
          window.ProjectCruiseHeroPrecision?.remember?.(selected);
          return selected;
        }
      }
    }
    const history = readVisualHistory().slice(0, 3);
    const candidates = heroCandidates(category, time, seed);
    const ordered = [...candidates.filter(src => !history.includes(src)), ...candidates.filter(src => history.includes(src))];
    for (const src of ordered) {
      if (await imageAvailable(src)) {
        rememberVisual(src);
        return { assetPath: src, imageId: src, source: "category-fallback", disclosure: "体験イメージ" };
      }
    }
    if (precision?.assetPath) return { ...precision, source: "hero-precision-direct-load" };
    const direct = ordered[0];
    return direct ? { assetPath: direct, imageId: direct, source: "category-direct-load", disclosure: "体験イメージ" } : null;
  }

  function compactStory() {
    const raw = text($("#intent")?.textContent, "今夜の目的地へ向かう一本です。");
    const firstTwo = raw.split(/(?<=[。！？])/).filter(Boolean).slice(0, 2).join("");
    return (firstTwo || raw).slice(0, 150);
  }

  async function renderHero(detail = {}) {
    const hero = ensureHero();
    if (!hero) return;
    const route = detail.route || {};
    const destination = detail.destination || {};
    state.lastDetail = { route, destination };
    const destinationName = text(route.destination || $("#destination")?.textContent, "今夜の目的地");
    const routeId = text(route.id, destinationName);
    state.lastRouteId = routeId;
    hero.classList.remove("is-placeholder");
    document.body.classList.add("pc-has-result");

    $(".pc-scene-kicker", hero).textContent = "DESTINATION REVEAL";
    $(".pc-scene-destination", hero).textContent = destinationName;
    $(".pc-scene-story", hero).textContent = compactStory();
    $(".pc-scene-index", hero).textContent = `PC / ${text(route.id, "REVEAL")}`;
    hero.classList.remove("is-revealing");
    void hero.offsetWidth;
    hero.classList.add("is-revealing");

    const category = visualCategory(route, destination);
    hero.dataset.category = category;
    hero.dataset.visualTime = visualTime();
    hero.dataset.heroPhase = heroPhase();
    hero.dataset.heroWeather = heroWeatherState();
    const choice = await pickAvailableVisual(route, destination, category, visualTime(), routeId);
    if (state.lastRouteId !== routeId) return;
    const media = $(".pc-scene-media", hero);
    const image = $(".pc-scene-image", hero);
    media?.classList.remove("has-image", "image-error");
    if (media) media.style.removeProperty("--pc-hero-image");

    if (image && choice?.assetPath) {
      const assetUrl = new URL(choice.assetPath, document.baseURI);
      assetUrl.searchParams.set("v", state.heroAssetVersion);
      const expectedRouteId = routeId;
      image.onload = () => {
        if (state.lastRouteId !== expectedRouteId) return;
        media?.classList.add("has-image");
        media?.classList.remove("image-error");
        hero.dataset.heroLoad = "loaded";
      };
      image.onerror = () => {
        if (state.lastRouteId !== expectedRouteId) return;
        media?.classList.remove("has-image");
        media?.classList.add("image-error");
        hero.dataset.heroLoad = "error";
      };
      image.src = assetUrl.href;
      hero.dataset.heroLoad = image.complete && image.naturalWidth > 0 ? "loaded" : "loading";
      if (image.complete && image.naturalWidth > 0) media?.classList.add("has-image");
    } else if (image) {
      image.removeAttribute("src");
      hero.dataset.heroLoad = "fallback";
    }

    hero.dataset.heroImageId = choice?.imageId || "css-fallback";
    hero.dataset.heroSource = choice?.source || "category-css-fallback";
    const disclosure = $(".pc-scene-disclosure", hero);
    if (disclosure) disclosure.textContent = choice?.disclosure || "体験イメージ";
  }

  function fallbackRouteDetail() {
    const name = text($("#destination")?.textContent);
    const title = text($("#title")?.textContent);
    const routes = window.PROJECT_CRUISE_ROUTES || [];
    const route = routes.find(item => item.destination === name && (!title || item.title === title)) || routes.find(item => item.destination === name) || { destination: name, title };
    const destinations = window.PROJECT_CRUISE_DESTINATIONS || [];
    const destination = destinations.find(item => item.name === name) || {};
    return { route, destination };
  }

  function installFallbackObserver() {
    const destination = $("#destination");
    if (!destination) return;
    const observer = new MutationObserver(() => {
      if (!text(destination.textContent)) return;
      renderHero(fallbackRouteDetail());
    });
    observer.observe(destination, { childList: true, characterData: true, subtree: true });
  }

  function init() {
    addBuildClass();
    enhanceBrand();
    enhanceSelector();
    enhanceAccessibility();
    ensureHero();
    updatePreviewCopy();
    installFallbackObserver();
    installDecisionDockObservers();
    document.addEventListener("pc:route-shown", event => renderHero(event.detail || {}));
    document.addEventListener("pc:arrival-weather", event => {
      state.currentWeatherState = event.detail?.weatherState || "unknown";
      document.body.dataset.weather = state.currentWeatherState;
      if (state.lastDetail) renderHero(state.lastDetail);
    });
    document.addEventListener("pc:operational-state", event => {
      const status = event.detail?.assessment?.state || "idle";
      const result = $("#result");
      if (result) result.dataset.operationalState = status;
      document.body.dataset.operationalState = status;
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();

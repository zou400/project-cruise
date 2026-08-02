/* Project Cruise Hero Precision runtime v1 adapter */
(() => {
  "use strict";
  const data = window.PROJECT_CRUISE_HERO_PRECISION_DATA;
  if (!data) return;
  const HISTORY_KEY = "pcHeroHistoryV1";
  const catalog = new Map(data.catalog.entries.map(item => [item.imageId, item]));
  const profiles = new Map(data.destinationProfiles.entries.map(item => [item.destinationId, item]));
  const affinities = new Map(data.routeAffinities.entries.map(item => [item.routeId, item]));

  function hash(value) {
    let result = 2166136261;
    for (const char of String(value ?? "")) {
      result ^= char.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return result >>> 0;
  }
  function history() {
    try {
      const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
    } catch (_) { return []; }
  }
  function phaseScore(imagePhase, phase) {
    if (imagePhase === phase) return 24;
    const near = new Set(["twilight|night","night|twilight","day|twilight","twilight|day"]);
    return near.has(`${imagePhase}|${phase}`) ? 12 : 0;
  }
  function resolveDestinationId(route = {}, destination = {}) {
    if (destination.id && profiles.has(destination.id)) return destination.id;
    const routeId = String(route.id || "");
    if (routeId.startsWith("P-D")) return `D${routeId.slice(3)}`;
    return affinities.get(routeId)?.destinationId || null;
  }
  function rankCandidate(candidate, context, profile, forbidden) {
    const image = catalog.get(candidate.imageId);
    if (!image || forbidden.has(candidate.imageId)) return null;
    let score = Number(candidate.semanticScore || 0);
    score += phaseScore(image.phase, context.phase);
    if (context.weatherState === "rain") {
      if (image.phase === "rain" || image.weatherAffinity?.includes("rain")) score += 28;
      else score -= 5;
    } else if (image.phase === "rain" && context.weatherState !== "unknown") score -= 18;
    if (image.category === profile?.primaryCategory) score += 8;
    if (profile?.secondaryCategories?.includes(image.category)) score += 4;
    if (context.recent.includes(candidate.imageId) || context.recent.includes(image.assetPath)) score -= 42;
    score += (hash(`${context.routeId}|${context.phase}|${context.weatherState}|${candidate.imageId}`) % 1000) / 1000;
    return { image, score, baseSemanticScore: candidate.semanticScore, reasons: candidate.reasons || [] };
  }
  function select(options = {}) {
    const route = options.route || {};
    const destination = options.destination || {};
    const routeId = String(route.id || options.routeId || "");
    const affinity = affinities.get(routeId);
    if (!affinity) return null;
    const destinationId = resolveDestinationId(route, destination);
    const profile = profiles.get(destinationId);
    const phase = ["day","twilight","night","rain"].includes(options.phase) ? options.phase : "night";
    const weatherState = ["clear","cloudy","rain","fog","wind","unknown"].includes(options.weatherState) ? options.weatherState : "unknown";
    const context = { routeId, phase: weatherState === "rain" ? "rain" : phase, weatherState, recent: history().slice(0, 3) };
    const forbidden = new Set(affinity.forbiddenImageIds || []);
    const ranked = (affinity.candidates || []).map(item => rankCandidate(item, context, profile, forbidden)).filter(Boolean).sort((a,b) => b.score-a.score);
    if (!ranked.length) return null;
    const winner = ranked[0];
    return {
      routeId,
      destinationId,
      imageId: winner.image.imageId,
      assetPath: winner.image.assetPath,
      disclosure: winner.image.disclosure || "体験イメージ",
      phase: context.phase,
      weatherState,
      score: Math.min(100, Math.round(winner.score * 100) / 100),
      semanticScore: winner.baseSemanticScore,
      reasons: winner.reasons,
      assignmentConfidence: affinity.assignmentConfidence,
      source: "hero-precision-v1-compatible",
      candidates: ranked.slice(0, 6).map(item => ({
        imageId: item.image.imageId,
        assetPath: item.image.assetPath,
        disclosure: item.image.disclosure || "体験イメージ",
        score: Math.min(100, Math.round(item.score * 100) / 100)
      }))
    };
  }
  function remember(choice) {
    if (!choice?.imageId) return;
    try {
      const next = [choice.imageId, ...history().filter(item => item !== choice.imageId && item !== choice.assetPath)].slice(0, 10);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch (_) {}
  }
  function diagnostics() {
    return {
      version: "hero-precision-v1-adapter",
      catalog: catalog.size,
      destinationProfiles: profiles.size,
      routeAffinities: affinities.size,
      exactAssetsPresent: data.catalog.entries.filter(item => item.availability === "verified").length,
      externalImportState: data.externalPackage.workspaceImportState
    };
  }
  window.ProjectCruiseHeroPrecision = Object.freeze({ select, remember, diagnostics });
})();

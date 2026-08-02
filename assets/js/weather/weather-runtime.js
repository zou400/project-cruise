/* Project Cruise Arrival Weather v0.11
 * Display-only. Never changes ranking, learning, exclusion, or Maps eligibility.
 */
(() => {
  "use strict";
  const params = new URLSearchParams(location.search);
  const enabled = params.get("pcWeather") !== "off";
  const cacheKey = "pcWeatherCacheV1";
  const cacheTtlMs = 30 * 60 * 1000;
  let current = null;
  let requestToken = 0;

  const $ = selector => document.querySelector(selector);
  const formatTime = date => new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" }).format(date);
  const normalize = value => String(value || "").replace(/[\s　]+/g, " ").trim();

  function weatherLabel(code) {
    if (code === 0) return ["快晴", "clear", "☾"];
    if ([1, 2].includes(code)) return ["晴れ時々雲", "clear", "◒"];
    if (code === 3) return ["曇り", "cloudy", "☁"];
    if ([45, 48].includes(code)) return ["霧", "fog", "≋"];
    if ([51, 53, 55, 56, 57].includes(code)) return ["霧雨", "rain", "⌁"];
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return ["雨", "rain", "╱"];
    if ([71, 73, 75, 77, 85, 86].includes(code)) return ["雪", "cloudy", "✦"];
    if ([95, 96, 99].includes(code)) return ["雷雨", "rain", "ϟ"];
    return ["天気不明", "unknown", "–"];
  }

  function readCache(key) {
    try {
      const cache = JSON.parse(localStorage.getItem(cacheKey) || "{}");
      const row = cache[key];
      if (!row || Date.now() - row.savedAt > cacheTtlMs) return null;
      return row.value;
    } catch (_) { return null; }
  }

  function writeCache(key, value) {
    try {
      const cache = JSON.parse(localStorage.getItem(cacheKey) || "{}");
      cache[key] = { savedAt: Date.now(), value };
      const entries = Object.entries(cache).sort((a, b) => b[1].savedAt - a[1].savedAt).slice(0, 20);
      localStorage.setItem(cacheKey, JSON.stringify(Object.fromEntries(entries)));
    } catch (_) {}
  }

  function demoForecast(mode, arrival) {
    const options = {
      live: { temperature: 29, apparent: 32, precipitationProbability: 20, precipitation: 0, code: 1, wind: 18, gust: 31, visibility: 21000 },
      caution: { temperature: 28, apparent: 31, precipitationProbability: 55, precipitation: 1.2, code: 3, wind: 31, gust: 63, visibility: 9000 },
      avoid: { temperature: 27, apparent: 30, precipitationProbability: 90, precipitation: 16, code: 95, wind: 46, gust: 84, visibility: 900 }
    };
    return { ...options[mode], forecastTime: arrival.toISOString(), source: "demo", demo: true };
  }

  async function destinationCoordinate(destination) {
    const lat = Number(destination?.latitude ?? destination?.lat);
    const lon = Number(destination?.longitude ?? destination?.lon ?? destination?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return [lat, lon];
    if (typeof window.geocode === "function") {
      try {
        const value = await window.geocode(destination?.name || "", destination || {});
        if (Array.isArray(value) && value.length === 2 && value.every(Number.isFinite)) return value;
      } catch (_) {}
    }
    return null;
  }

  function nearestIndex(times, arrival) {
    let best = 0;
    let delta = Infinity;
    times.forEach((value, index) => {
      const current = Math.abs(new Date(value).getTime() - arrival.getTime());
      if (current < delta) { delta = current; best = index; }
    });
    return best;
  }

  async function fetchForecast(coords, arrival) {
    const [latitude, longitude] = coords;
    const cacheId = `${latitude.toFixed(3)}|${longitude.toFixed(3)}|${arrival.toISOString().slice(0, 13)}`;
    const cached = readCache(cacheId);
    if (cached) return { ...cached, source: "cache" };
    const hourly = ["temperature_2m", "apparent_temperature", "precipitation_probability", "precipitation", "weather_code", "visibility", "wind_speed_10m", "wind_gusts_10m"];
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", latitude);
    url.searchParams.set("longitude", longitude);
    url.searchParams.set("hourly", hourly.join(","));
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "3");
    url.searchParams.set("wind_speed_unit", "kmh");
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`weather-http-${response.status}`);
    const json = await response.json();
    const index = nearestIndex(json.hourly?.time || [], arrival);
    const forecast = {
      temperature: Number(json.hourly?.temperature_2m?.[index]),
      apparent: Number(json.hourly?.apparent_temperature?.[index]),
      precipitationProbability: Number(json.hourly?.precipitation_probability?.[index]),
      precipitation: Number(json.hourly?.precipitation?.[index]),
      code: Number(json.hourly?.weather_code?.[index]),
      visibility: Number(json.hourly?.visibility?.[index]),
      wind: Number(json.hourly?.wind_speed_10m?.[index]),
      gust: Number(json.hourly?.wind_gusts_10m?.[index]),
      forecastTime: json.hourly?.time?.[index] || arrival.toISOString(),
      source: "open-meteo",
      demo: false
    };
    if (![forecast.temperature, forecast.code, forecast.wind].every(Number.isFinite)) throw new Error("weather-fields-missing");
    writeCache(cacheId, forecast);
    return forecast;
  }

  function narrative(destination, state, forecast) {
    const source = `${destination?.category || ""} ${destination?.tags?.join?.(" ") || ""}`;
    if (state === "rain") {
      if (/工場|港|湾岸/.test(source)) return "雨が光を路面へ落とし、輪郭より反射が主役になる夜です。";
      if (/公園|自然|森/.test(source)) return "足元を急がず、雨音まで景色の一部として受け取る夜です。";
      return "濡れた街の光が、いつもの目的地に別の表情を足します。";
    }
    if (state === "fog") return "遠くを見通すより、近くの灯りを拾う夜になりそうです。";
    if (forecast.wind >= 35) return "風が景色を動かします。長居より、短く濃い到着が似合います。";
    if (state === "clear") return "空の抜けが、目的地まで走った距離を静かに報いてくれます。";
    if (state === "cloudy") return "雲の多い夜にも、この場所らしい光は残っています。";
    return "今夜の条件を、到着してから確かめるための一本です。";
  }

  function renderLoading(destination, arrival) {
    const title = $("#pc-weather-title");
    if (title) title.textContent = `${destination?.area || destination?.name || "到着エリア"}の到着時予報`;
    const state = $("#pc-weather-state");
    if (state) state.textContent = enabled ? `${formatTime(arrival)} 到着` : "表示OFF";
    const content = $("#pc-weather-content");
    if (content) content.innerHTML = enabled ? `<span class="pc-weather-icon" aria-hidden="true">…</span><div><strong>予報を取得中</strong><p>目的地周辺の到着時刻に合わせています。</p></div>` : `<span class="pc-weather-icon" aria-hidden="true">–</span><div><strong>天気表示は停止中</strong><p>推薦と出発導線はそのまま使えます。</p></div>`;
    const facts = $("#pc-weather-facts");
    if (facts) facts.hidden = true;
  }

  function renderForecast(destination, arrival, forecast) {
    const [label, state, icon] = weatherLabel(forecast.code);
    const stateNode = $("#pc-weather-state");
    if (stateNode) stateNode.textContent = forecast.demo ? "参考予報" : forecast.source === "cache" ? "保存済み予報" : "到着時予報";
    const content = $("#pc-weather-content");
    if (content) content.innerHTML = `<span class="pc-weather-icon" aria-hidden="true">${icon}</span><div><strong>${label}・${Math.round(forecast.temperature)}℃</strong><p>${formatTime(arrival)}ごろの予報</p></div>`;
    const facts = $("#pc-weather-facts");
    if (facts) {
      facts.hidden = false;
      facts.innerHTML = [
        ["降水", `${Math.round(forecast.precipitationProbability)}%`],
        ["風", `${Math.round(forecast.wind)}km/h`],
        ["体感", `${Math.round(forecast.apparent)}℃`]
      ].map(([key, value]) => `<div><span>${key}</span><strong>${value}</strong></div>`).join("");
    }
    const copy = $("#pc-weather-narrative");
    if (copy) copy.textContent = narrative(destination, state, forecast);
    const source = $("#pc-weather-source");
    if (source) source.hidden = !!forecast.demo;
    document.body.dataset.weather = state;
    document.dispatchEvent(new CustomEvent("pc:arrival-weather", { detail: { destination, arrival: arrival.toISOString(), forecast, weatherState: state, label } }));
  }

  function renderError(destination, arrival, error) {
    const state = $("#pc-weather-state");
    if (state) state.textContent = "UNAVAILABLE";
    const content = $("#pc-weather-content");
    if (content) content.innerHTML = `<span class="pc-weather-icon" aria-hidden="true">–</span><div><strong>予報を取得できませんでした</strong><p>推薦とGoogle Mapsはそのまま利用できます。</p></div>`;
    const facts = $("#pc-weather-facts");
    if (facts) facts.hidden = true;
    const copy = $("#pc-weather-narrative");
    if (copy) copy.textContent = "天気が見えない夜も、選ばれた一本そのものは変わりません。";
    console.info("Project Cruise weather unavailable", normalize(error?.message));
  }

  async function update(detail) {
    const token = ++requestToken;
    const route = detail?.route || current?.route || {};
    const destination = detail?.destination || current?.destination || (window.PROJECT_CRUISE_DESTINATIONS || []).find(item => item.name === route.destination) || {};
    const minutes = Number(detail?.routeData?.durationMinutes ?? route?.feasibility?.medianMinutes ?? 45);
    const arrival = new Date(Date.now() + Math.max(5, Number.isFinite(minutes) ? minutes : 45) * 60000);
    current = { route, destination, arrival };
    renderLoading(destination, arrival);
    if (!enabled) return;
    const demoMode = params.get("weatherDemoState");
    try {
      const forecast = ["live", "caution", "avoid"].includes(demoMode) ? demoForecast(demoMode, arrival) : await (async () => {
        const coords = await destinationCoordinate(destination);
        if (!coords) throw new Error("destination-coordinate-unavailable");
        return fetchForecast(coords, arrival);
      })();
      if (token !== requestToken) return;
      renderForecast(destination, arrival, forecast);
    } catch (error) {
      if (token !== requestToken) return;
      renderError(destination, arrival, error);
    }
  }

  document.addEventListener("pc:route-shown", event => update(event.detail || {}));
  document.addEventListener("pc:route-estimate", event => update({ ...(current || {}), ...(event.detail || {}) }));
})();

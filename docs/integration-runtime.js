
// PROJECT CRUISE INTEGRATION RUNTIME v0.10.4-rc1
const PC_HERO_LIBRARY = [{"id":"airport-01","category":"airport","time":"morning","src":"assets/hero/airport-morning-01.webp","disclosure":"体験イメージ"},{"id":"airport-02","category":"airport","time":"day","src":"assets/hero/airport-day-02.webp","disclosure":"体験イメージ"},{"id":"airport-03","category":"airport","time":"night","src":"assets/hero/airport-night-03.webp","disclosure":"体験イメージ"},{"id":"airport-04","category":"airport","time":"night","src":"assets/hero/airport-night-04.webp","disclosure":"体験イメージ"},{"id":"airport-05","category":"airport","time":"night","src":"assets/hero/airport-night-05.webp","disclosure":"体験イメージ"},{"id":"waterfront-01","category":"waterfront","time":"morning","src":"assets/hero/waterfront-morning-01.webp","disclosure":"体験イメージ"},{"id":"waterfront-02","category":"waterfront","time":"day","src":"assets/hero/waterfront-day-02.webp","disclosure":"体験イメージ"},{"id":"waterfront-03","category":"waterfront","time":"night","src":"assets/hero/waterfront-night-03.webp","disclosure":"体験イメージ"},{"id":"waterfront-04","category":"waterfront","time":"night","src":"assets/hero/waterfront-night-04.webp","disclosure":"体験イメージ"},{"id":"waterfront-05","category":"waterfront","time":"night","src":"assets/hero/waterfront-night-05.webp","disclosure":"体験イメージ"},{"id":"industrial-01","category":"industrial","time":"morning","src":"assets/hero/industrial-morning-01.webp","disclosure":"体験イメージ"},{"id":"industrial-02","category":"industrial","time":"day","src":"assets/hero/industrial-day-02.webp","disclosure":"体験イメージ"},{"id":"industrial-03","category":"industrial","time":"night","src":"assets/hero/industrial-night-03.webp","disclosure":"体験イメージ"},{"id":"industrial-04","category":"industrial","time":"night","src":"assets/hero/industrial-night-04.webp","disclosure":"体験イメージ"},{"id":"industrial-05","category":"industrial","time":"night","src":"assets/hero/industrial-night-05.webp","disclosure":"体験イメージ"},{"id":"park-01","category":"park","time":"morning","src":"assets/hero/park-morning-01.webp","disclosure":"体験イメージ"},{"id":"park-02","category":"park","time":"day","src":"assets/hero/park-day-02.webp","disclosure":"体験イメージ"},{"id":"park-03","category":"park","time":"night","src":"assets/hero/park-night-03.webp","disclosure":"体験イメージ"},{"id":"park-04","category":"park","time":"night","src":"assets/hero/park-night-04.webp","disclosure":"体験イメージ"},{"id":"park-05","category":"park","time":"night","src":"assets/hero/park-night-05.webp","disclosure":"体験イメージ"},{"id":"highway-01","category":"highway","time":"morning","src":"assets/hero/highway-morning-01.webp","disclosure":"体験イメージ"},{"id":"highway-02","category":"highway","time":"day","src":"assets/hero/highway-day-02.webp","disclosure":"体験イメージ"},{"id":"highway-03","category":"highway","time":"night","src":"assets/hero/highway-night-03.webp","disclosure":"体験イメージ"},{"id":"highway-04","category":"highway","time":"night","src":"assets/hero/highway-night-04.webp","disclosure":"体験イメージ"},{"id":"highway-05","category":"highway","time":"night","src":"assets/hero/highway-night-05.webp","disclosure":"体験イメージ"},{"id":"city-01","category":"city","time":"morning","src":"assets/hero/city-morning-01.webp","disclosure":"体験イメージ"},{"id":"city-02","category":"city","time":"day","src":"assets/hero/city-day-02.webp","disclosure":"体験イメージ"},{"id":"city-03","category":"city","time":"night","src":"assets/hero/city-night-03.webp","disclosure":"体験イメージ"},{"id":"city-04","category":"city","time":"night","src":"assets/hero/city-night-04.webp","disclosure":"体験イメージ"},{"id":"city-05","category":"city","time":"night","src":"assets/hero/city-night-05.webp","disclosure":"体験イメージ"}];
const PC_HERO_HISTORY_KEY="pcHeroHistoryV1";
const PC_WEATHER_CACHE_KEY="pcArrivalWeatherV1";
const PC_OPS_RULES = [{"ids":["D034","D187"],"name":"燈明堂緑地","window":"05:00-21:30","gate":"exclude_if_arrival_or_exit_outside","anchor":"燈明堂緑地駐車場"},{"ids":["D107"],"name":"海浜大通り展望駐車場","window":"24h","gate":"exclude_if_vehicle_too_wide","maxWidthM":1.9,"anchor":"海浜大通り展望駐車場"},{"ids":["D061"],"name":"大黒PA","window":"normally_24h","gate":"live_closure_required","anchor":"大黒PA"},{"ids":["D052","D177"],"name":"袖ケ浦海浜公園","window":null,"gate":"exclude_late_night_until_verified","anchor":"袖ケ浦海浜公園駐車場"},{"ids":["D033","D162"],"name":"荒崎公園","seasonalWindows":{"01,11,12":"08:00-17:30","02-04,10":"08:00-18:30","05-09":"08:00-19:30"},"gate":"exclude_if_arrival_or_exit_outside","anchor":"荒崎公園駐車場"},{"ids":["D073","D169"],"name":"昭和の森","window":"08:30-17:30","gate":"exclude_if_arrival_or_exit_outside","anchor":"昭和の森駐車場"},{"ids":["D029","D165"],"name":"海の公園","window":"04:00-22:00","exitAfterCloseAllowed":true,"gate":"exclude_if_arrival_outside","anchor":"海の公園 柴口駐車場"},{"ids":["D044","D143"],"name":"桜ヶ丘公園 ゆうひの丘","window":"08:45-20:00","gate":"exclude_if_arrival_or_exit_outside","anchor":"桜ヶ丘公園 ゆうひの丘駐車場"},{"ids":["D048"],"name":"みさと公園","window":"24h","gate":"select_anchor_by_time","anchor":"みさと公園 第2駐車場","anchorId":"AA-D048-P2"},{"ids":["D103"],"name":"市川市動植物園","window":"09:00-16:30","gate":"exclude_if_arrival_or_exit_outside","anchor":"市川市動植物園 駐車場"},{"ids":["D109"],"name":"亥鼻公園","window":"09:00-17:00","gate":"exclude_if_arrival_or_exit_outside","anchor":"千葉市立郷土博物館 駐車場"},{"ids":["D114"],"name":"まつぶし緑の丘公園","window":"06:00-21:20","gate":"select_valid_anchor_or_exclude","anchor":"まつぶし緑の丘マルシンパーク 南駐車場","anchorId":"AA-D114-SOUTH"},{"ids":["D115"],"name":"県民健康福祉村","window":"09:00-17:00","gate":"exclude_if_arrival_or_exit_outside","anchor":"県民健康福祉村 駐車場"},{"ids":["D161","D028"],"name":"野島公園","window":"07:00-23:00","gate":"exclude_if_arrival_or_exit_outside","anchor":"野島公園 第1駐車場","anchorId":"AA-D161-P1"},{"ids":["D191"],"name":"宮ヶ瀬ダム 水とエネルギー館","window":"09:00-17:15","gate":"exclude_if_arrival_or_exit_outside","anchor":"宮ヶ瀬ダム周辺公式駐車場"},{"ids":["D068"],"name":"中の島公園","window":"walk_extension","gate":"route_to_parking_then_walk","anchor":"鳥居崎海浜公園 駐車場","walkExtensionMinutes":12},{"ids":["D081"],"name":"道の駅 いちかわ","window":"24h","facilityWindow":"09:00-22:00","gate":"experience_state","afterHoursState":"rest_only","anchor":"道の駅 いちかわ 小型車駐車場","liveCongestionRequired":true},{"ids":["D082"],"name":"道の駅 しょうなん","window":"24h except event restrictions","facilityWindow":"09:00-18:00","gate":"event_override_then_experience_state","afterHoursState":"rest_only","anchor":"道の駅しょうなん 第1駐車場","liveEventRequired":true},{"ids":["D062"],"name":"辰巳第一PA","window":"dynamic","gate":"network_topology_and_live_closure_required","anchor":"辰巳第一PA"},{"ids":["D063"],"name":"芝浦PA","window":"dynamic","gate":"network_topology_and_live_closure_required","anchor":"芝浦PA"},{"ids":["D038"],"name":"宮川公園","window":null,"gate":"map_exclude_until_anchor_verified","anchor":null},{"ids":["D066","D021","D135"],"name":"hours_unknown_group","window":null,"gate":"exclude_night_until_verified"},{"ids":["D070"],"name":"鹿野山 九十九谷展望公園","window":null,"gate":"conditional_daybreak_sunset_only","anchor":"鹿野山九十九谷展望公園"},{"ids":["D078"],"name":"狭山公園","window":"09:00-17:00 provisional","gate":"daytime_only_until_verified","anchor":"狭山公園 駐車場"},{"ids":["D079"],"name":"野山北・六道山公園","window":"daytime_area_specific","gate":"daytime_only_until_valid_anchor","anchor":"区域別公式駐車場"},{"ids":["D100"],"name":"石垣山一夜城歴史公園","window":"daytime provisional","gate":"daytime_only_until_verified","anchor":"石垣山一夜城駐車場"},{"ids":["D108"],"name":"千葉公園","window":"park always / parking separate","gate":"parking_window_required","anchor":"千葉公園第2駐車場"},{"ids":["D118"],"name":"御幸公園","window":null,"gate":"downgrade_until_parking_evidence_replaced","anchor":null},{"ids":["D201"],"name":"ひこうきの丘","window":null,"gate":"exclude_late_night_until_verified","anchor":"ひこうきの丘 駐車場"}];
const PC_RULE_BY_ID = new Map();
PC_OPS_RULES.forEach(rule=>(rule.ids||[]).forEach(id=>PC_RULE_BY_ID.set(id,rule)));

function pcClockMinutes(v){const m=String(v||"").match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):null}
function pcWithinWindow(minutes,windowText){
 if(!windowText||windowText==="24h"||String(windowText).includes("24h"))return true;
 const pair=String(windowText).match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);if(!pair)return true;
 const open=pcClockMinutes(pair[1]),close=pcClockMinutes(pair[2]);
 return open<=close?minutes>=open&&minutes<=close:(minutes>=open||minutes<=close);
}
function pcRuleForName(name){const d=destinationByName.get(normalizeName(name))||{};return PC_RULE_BY_ID.get(d.id)||null}
function pcEstimatedDriveMinutes(r,d){
 const routeMedian=Number(r?.feasibility?.medianMinutes);if(Number.isFinite(routeMedian))return Math.max(15,Math.min(selectedBudgetMinutes(),routeMedian*.62));
 const nums=String(d?.driveTime||"").match(/\d+/g)?.map(Number)||[];if(nums.length)return nums.reduce((a,b)=>a+b,0)/nums.length;
 return Math.max(20,selectedBudgetMinutes()*.58);
}
function pcPlanningTimes(r,d){
 const now=new Date(),arrival=new Date(now.getTime()+pcEstimatedDriveMinutes(r,d)*60000),exit=new Date(now.getTime()+(selectedBudgetMinutes()+20)*60000);
 return {now,arrival,exit,arrivalMinutes:arrival.getHours()*60+arrival.getMinutes(),exitMinutes:exit.getHours()*60+exit.getMinutes()};
}
function pcSeasonalWindow(rule,date){
 if(!rule?.seasonalWindows)return rule?.window||null;const month=date.getMonth()+1;
 for(const [key,value] of Object.entries(rule.seasonalWindows)){
  if(key.split(',').some(part=>{const p=part.split('-').map(Number);return p.length===1?month===p[0]:month>=p[0]&&month<=p[1]}))return value;
 }
 return null;
}
function pcNodeDecision(name,r){
 const d=destinationByName.get(normalizeName(name))||{},rule=PC_RULE_BY_ID.get(d.id);if(!rule)return {eligible:true,state:"canonical",rule:null,d};
 const t=pcPlanningTimes(r,d),hour=t.arrival.getHours(),isLate=hour>=22||hour<5;
 const windowText=pcSeasonalWindow(rule,t.arrival);
 const gate=rule.gate||"";
 if(gate==="map_exclude_until_anchor_verified")return {eligible:false,state:"closed",reason:"到着駐車アンカー未解決",rule,d,t};
 if(gate==="network_topology_and_live_closure_required")return {eligible:false,state:"unknown_fail_closed",reason:"PAの進入方向・閉鎖信号を未接続",rule,d,t};
 if(gate.includes("exclude_late_night")&&isLate)return {eligible:false,state:"unknown_fail_closed",reason:"夜間駐車条件が未確認",rule,d,t};
 if(gate.includes("exclude_night")&&(hour>=18||hour<6))return {eligible:false,state:"unknown_fail_closed",reason:"夜間駐車条件が未確認",rule,d,t};
 if(gate.includes("daytime_only")&&(hour<8||hour>=18))return {eligible:false,state:"closed",reason:"昼間のみの暫定運用",rule,d,t};
 if(gate==="conditional_daybreak_sunset_only"&&!(hour>=4&&hour<9)&&!(hour>=15&&hour<19))return {eligible:false,state:"conditional",reason:"夜明け・夕景用途に限定",rule,d,t};
 if(gate==="parking_window_required"&&(hour>=18||hour<7))return {eligible:false,state:"unknown_fail_closed",reason:"駐車場運用時間を未分離",rule,d,t};
 if(gate==="downgrade_until_parking_evidence_replaced")return {eligible:false,state:"unknown_fail_closed",reason:"駐車根拠の差替え待ち",rule,d,t};
 if(gate==="exclude_if_vehicle_too_wide"){
  const profile=config?.vehicleProfile||{};if(profile.knownWideVehicle&&rule.maxWidthM<2)return {eligible:false,state:"closed",reason:`車幅上限 ${rule.maxWidthM}m`,rule,d,t};
 }
 if(windowText&&String(windowText).match(/\d{1,2}:\d{2}-\d{1,2}:\d{2}/)){
  const arrivalOK=pcWithinWindow(t.arrivalMinutes,windowText),exitOK=pcWithinWindow(t.exitMinutes,windowText);
  if(gate.includes("arrival_or_exit")&&(!arrivalOK||!exitOK))return {eligible:false,state:"closed",reason:`予定到着・退出が ${windowText} 外`,rule,d,t};
  if(gate.includes("arrival_outside")&&!arrivalOK)return {eligible:false,state:"closed",reason:`予定到着が ${windowText} 外`,rule,d,t};
 }
 let state="full_experience";
 if(rule.afterHoursState&&rule.facilityWindow&&!pcWithinWindow(t.arrivalMinutes,rule.facilityWindow))state=rule.afterHoursState;
 return {eligible:true,state,reason:null,rule,d,t};
}
function pcOperationalGate(r){
 const nodes=[...(r.waypoints||[]),r.destination].filter(Boolean);let primary=null;
 for(const name of nodes){const decision=pcNodeDecision(name,r);if(!primary||name===r.destination)primary=decision;if(!decision.eligible)return {eligible:false,decision,name};}
 return {eligible:true,decision:primary,name:r.destination};
}
function pcMapQueryForName(name){
 const d=destinationByName.get(normalizeName(name))||{},rule=PC_RULE_BY_ID.get(d.id);if(!rule)return null;
 if(rule.gate==="map_exclude_until_anchor_verified"||rule.gate==="network_topology_and_live_closure_required")return null;
 return rule.anchor||null;
}
function pcHeroCategory(r){const c=routeCategory(r);if(/飛行機|空港/.test(c))return"airport";if(/工場|港湾/.test(c))return"industrial";if(/走行|高速/.test(c))return"highway";if(/海|湾岸|川|水辺/.test(c))return"waterfront";if(/公園|自然|山/.test(c))return"park";return"city"}
function pcVisualTime(){const q=new URLSearchParams(location.search).get("visualTime");if(["morning","day","night"].includes(q))return q;const h=new Date().getHours();return h>=5&&h<10?"morning":h>=10&&h<17?"day":"night"}
function pcChooseHero(r){
 const category=pcHeroCategory(r),time=pcVisualTime();let candidates=PC_HERO_LIBRARY.filter(x=>x.category===category&&x.time===time);
 if(!candidates.length)candidates=PC_HERO_LIBRARY.filter(x=>x.category===category);if(!candidates.length)candidates=PC_HERO_LIBRARY;
 let history=[];try{history=JSON.parse(localStorage.getItem(PC_HERO_HISTORY_KEY)||"[]")}catch(e){}
 const fresh=candidates.filter(x=>!history.slice(-6).includes(x.id));const pool=fresh.length?fresh:candidates;
 let h=0;for(const ch of String(r.id||r.destination||""))h=(h*31+ch.charCodeAt(0))>>>0;const chosen=pool[(h+Date.now())%pool.length];
 history.push(chosen.id);localStorage.setItem(PC_HERO_HISTORY_KEY,JSON.stringify(history.slice(-24)));return chosen;
}
function pcHeroLine(r,d){
 const cat=pcHeroCategory(r),seed=String(r.id||r.destination||"");const lines={
  airport:["滑走路の光が、今夜の距離感を変えていく。","機体が夜を横切るたび、街の輪郭が少し遠ざかる。"],
  waterfront:["水面の向こうへ、街の速度を置いていく。","橋と岸壁の灯りが、今夜の終点を静かに決める。"],
  industrial:["配管と物流の光が、眠らない湾岸の輪郭を描く。","観光地ではない光ほど、夜の記憶に残る。"],
  highway:["行き先より先に、走る理由が整っていく。","都市の線をつなぎ直す、それだけで夜は変わる。"],
  park:["街の明かりが薄くなるほど、自分の速度が戻ってくる。","木々の向こうに残る光が、短い旅の終点になる。"],
  city:["建物の灯りを追ううちに、自分の速度だけが静かに整っていく。","まだ知らない街角が、今夜の一本を完成させる。"]};
 let h=0;for(const ch of seed)h=(h*33+ch.charCodeAt(0))>>>0;return lines[cat][h%lines[cat].length];
}
function pcEnhanceResult(r,d){
 const hero=pcChooseHero(r);const heroEl=$("#hero-image");heroEl.style.backgroundImage=`url("${hero.src}")`;heroEl.setAttribute("aria-label",`${routeCategory(r)}の体験イメージ`);
 $("#hero-area").textContent=d.area||routeDirection(r);$("#hero-title").textContent=r.destination||"今夜の目的地";$("#hero-line").textContent=pcHeroLine(r,d);$("#hero-category").textContent=routeCategory(r);$("#hero-time").textContent=pcVisualTime().toUpperCase();
 const gate=pcOperationalGate(r),decision=gate.decision||pcNodeDecision(r.destination,r),rule=decision.rule;
 $("#ops-title").textContent=rule?.anchor||"正本の到着地点を使用";$("#ops-badge").textContent=rule?`${decision.state.toUpperCase()} · OVERLAY`:"CANONICAL";
 const planned=decision.t?`${decision.t.arrival.toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"})}到着想定`:`${timeLabel(selectedTime)}条件`;
 const live=rule&&(rule.liveEventRequired||rule.liveCongestionRequired||String(rule.gate).includes("live"));
 $("#ops-content").innerHTML=`<div class="ops-grid"><div class="ops-chip"><span>ARRIVAL ANCHOR</span><strong>${escapeHtml(rule?.anchor||r.destination||"")}</strong></div><div class="ops-chip"><span>WINDOW / STATE</span><strong>${escapeHtml(rule?.window||rule?.facilityWindow||decision.state||"正本条件")}</strong></div><div class="ops-chip"><span>PLANNED</span><strong>${escapeHtml(planned)}</strong></div><div class="ops-chip"><span>MAP POLICY</span><strong>${rule?.anchor?"駐車アンカー優先":"表示地点を使用"}</strong></div></div><p class="ops-note ${live?"ops-warning":"ops-ok"}">${live?"当日閉鎖・イベント・混雑のライブ信号は未接続です。静的条件を上回る規制はGoogleマップと公式案内で再確認してください。":"ハードゲートを推薦順位より先に判定。Place ID・座標は推測で補完していません。"}</p>`;
 pcWeatherLoading();
}
function pcWeatherLoading(){const box=$("#weather-shadow");box.classList.remove("hidden");box.dataset.state="loading";$("#weather-shadow-title").textContent="到着時の空を確認中";$("#weather-shadow-badge").textContent="順位未反映 · SHADOW";$("#weather-shadow-grid").hidden=true;$("#weather-shadow-loading").hidden=false;$("#weather-shadow-narrative").hidden=true;$("#weather-shadow-meta").hidden=true;$("#weather-shadow-note").hidden=true}
function pcWeatherFailure(message){const box=$("#weather-shadow");if(!box)return;box.classList.remove("hidden");box.dataset.state="unknown";$("#weather-shadow-title").textContent="到着時の天気を取得できませんでした";$("#weather-shadow-badge").textContent="順位未反映";$("#weather-shadow-loading").hidden=true;$("#weather-shadow-grid").hidden=true;$("#weather-shadow-narrative").hidden=false;$("#weather-shadow-narrative").textContent=message;$("#weather-shadow-meta").hidden=true;$("#weather-shadow-note").hidden=false;$("#weather-shadow-note").textContent="天気取得失敗時も推薦・Googleマップ・帰還評価はそのまま利用できます。"}
function pcWeatherNarrative(f,r){
 const code=Number(f.weatherCode),rain=Number(f.precipitationProbability||0),wind=Number(f.windGustKmh||0),vis=Number(f.visibilityM||0),cat=pcHeroCategory(r);
 if([95,96,99].includes(code)||wind>=80)return"空の条件が主役になりすぎる夜です。今夜は無理に景色へ近づかず、屋内か短いルートへ切り替える判断を。";
 if(rain>=65)return cat==="waterfront"?"雨が水面の光を細く伸ばす夜。景色は濃くなるけれど、岸壁と歩道では足元を最優先に。":"雨が街の輪郭を少し曖昧にする。車内から眺める時間を長めに取ると、この場所の静けさが残る。";
 if(wind>=50)return"風が景色の印象を変える夜です。橋上や海沿いでは滞在を短くし、車外へ出る前に現地の体感を確かめて。";
 if(vis>=15000)return cat==="airport"?"視界の抜けた夜。滑走路灯火と機体の動きが、いつもより遠くまで一本につながる。":"遠くの灯りまで輪郭が残る夜。目的地へ着く前から、街の広がりが少しずつ見えてくる。";
 return"雲の下に光が残る夜。派手な景色ではなく、到着したときの空気そのものが今夜の理由になる。";
}
async function pcRenderArrivalWeather(r,coord,routeData){
 pcWeatherLoading();const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7500);
 try{
  const eta=Math.max(10,Number(routeData?.durationMinutes)||pcEstimatedDriveMinutes(r,routeDestination(r)));const arrival=new Date(Date.now()+eta*60000);
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${coord[0]}&longitude=${coord[1]}&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,visibility,wind_speed_10m,wind_gusts_10m&timezone=Asia%2FTokyo&forecast_days=3`;
  const res=await fetch(url,{signal:controller.signal});if(!res.ok)throw new Error("weather");const data=await res.json(),h=data.hourly||{},times=h.time||[];if(!times.length)throw new Error("weather");
  let idx=0,best=Infinity;times.forEach((x,i)=>{const diff=Math.abs(new Date(x).getTime()-arrival.getTime());if(diff<best){best=diff;idx=i}});
  const f={temperatureC:h.temperature_2m?.[idx],apparentC:h.apparent_temperature?.[idx],precipitationProbability:h.precipitation_probability?.[idx],precipitationMm:h.precipitation?.[idx],weatherCode:h.weather_code?.[idx],visibilityM:h.visibility?.[idx],windKmh:h.wind_speed_10m?.[idx],windGustKmh:h.wind_gusts_10m?.[idx]};
  const thunder=[95,96,99].includes(Number(f.weatherCode)),state=thunder||Number(f.windGustKmh)>=80||Number(f.visibilityM)<1000?"avoid":Number(f.precipitationProbability)>=65||Number(f.windGustKmh)>=50||Number(f.visibilityM)<3000?"caution":"ok";
  const box=$("#weather-shadow");box.dataset.state=state;$("#weather-shadow-title").textContent=`${arrival.toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"})}ごろの到着予報`;$("#weather-shadow-badge").textContent=`順位未反映 · ${state.toUpperCase()}`;
  $("#weather-temperature").textContent=`${Math.round(f.temperatureC)}℃ / ${Math.round(f.apparentC)}℃`;$("#weather-rain").textContent=`${Math.round(f.precipitationProbability||0)}% / ${Number(f.precipitationMm||0).toFixed(1)}mm`;$("#weather-wind").textContent=`${Math.round(f.windKmh||0)} / ${Math.round(f.windGustKmh||0)}km/h`;$("#weather-visibility").textContent=Number.isFinite(Number(f.visibilityM))?`${Math.round(f.visibilityM/1000)}km`:"--";
  $("#weather-shadow-loading").hidden=true;$("#weather-shadow-grid").hidden=false;$("#weather-shadow-narrative").hidden=false;$("#weather-shadow-narrative").textContent=pcWeatherNarrative(f,r);$("#weather-shadow-meta").hidden=false;$("#weather-shadow-meta").innerHTML=`<span>OPEN-METEO FORECAST</span><span>${escapeHtml(routeDestination(r).area||"")}</span><span>取得 ${new Date().toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"})}</span><a href="https://open-meteo.com/" target="_blank" rel="noopener">出典</a>`;$("#weather-shadow-note").hidden=false;$("#weather-shadow-note").textContent="Shadow表示：天気は候補順位・ハードゲート・学習値を変更しません。出発前に公式の警報・道路規制も確認してください。";
 }catch(e){pcWeatherFailure(e?.name==="AbortError"?"天気の応答が間に合いませんでした。":"到着時の天気を取得できませんでした。")}finally{clearTimeout(timer)}
}

(()=>{
'use strict';
const RELEASE=window.PC_RELEASE||{version:'0.14.0',assetToken:'01400'};
const D=window.PC_DESTINATIONS||[];
const R=window.PC_ROUTES||[];
const $=(s)=>document.querySelector(s);
const $$=(s)=>[...document.querySelectorAll(s)];
const KAMATA={label:'蒲田駅',lat:35.56124,lng:139.71608};
const TIME_PROFILES={
  '90':{label:'往復90分',min:70,max:100,target:85,waypointMin:1,waypointMax:2,safetyRate:.12},
  '120':{label:'往復2時間',min:100,max:140,target:120,waypointMin:2,waypointMax:3,safetyRate:.12},
  'half':{label:'半日（帰宅まで）',min:180,max:300,target:240,waypointMin:3,waypointMax:5,safetyRate:.12}
};
const state={origin:'kamata',originCoords:{...KAMATA},time:'90',active:null,activePlan:null,draws:0,sessionRejected:new Set(),heroTimer:null,drawBusy:false,heroRequestToken:0,scrollTimer:null,heroLoadTimer:null,geolocationAttempted:false};
const STORAGE='pc_v013_profile';
const HISTORY='pc_v013_history';
const VISUALS={
 airport:['airport-scene-1-1.webp','airport-scene-1-2.webp','airport-scene-1-3.webp','airport-scene-1-4.webp','airport-scene-2-1.webp','airport-scene-2-2.webp','airport-scene-2-3.webp','airport-scene-2-4.webp'],
 bridge:['bridge-scene-1-1.webp','bridge-scene-1-2.webp','bridge-scene-1-3.webp','bridge-scene-1-4.webp','bridge-scene-2-1.webp','bridge-scene-2-2.webp','bridge-scene-2-3.webp','bridge-scene-2-4.webp'],
 industry:['industry-scene-1-1.webp','industry-scene-1-2.webp','industry-scene-1-3.webp','industry-scene-1-4.webp','industry-scene-2-1.webp','industry-scene-2-2.webp','industry-scene-2-3.webp','industry-scene-2-4.webp'],
 city:['city-scene-1-1.webp','city-scene-1-2.webp','city-scene-1-3.webp','city-scene-1-4.webp','city-scene-2-1.webp','city-scene-2-2.webp','city-scene-2-3.webp','city-scene-2-4.webp']};
const profile=load(STORAGE,{routeStats:{},recent:[],accepted:[],version:RELEASE.version});
function load(k,f){try{return JSON.parse(localStorage.getItem(k))||f}catch{return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
function normalize(s){return String(s||'').replace(/[\s　]+/g,' ').trim().toLowerCase()}
function destMeta(routeOrName){const name=typeof routeOrName==='string'?routeOrName:routeOrName?.destination;return D.find(d=>normalize(d.name)===normalize(name))||{}}
function sourceRole(r){return r.candidateSource==='canonical_route'?'検証済みルート':r.generatedFromDestination?'目的地直行':'探索候補'}
function category(r,d){const t=[r.theme,r.family,r.title,r.destination,d.category,d.useCase,(d.tags||[]).join(' ')].join(' ');if(/飛行機|空港|滑走路|羽田/.test(t))return'airport';if(/橋|高架|JCT|首都高|ベイブリッジ|海沿い|海岸|岬/.test(t))return'bridge';if(/工場|工業|港|物流|コンテナ|産業/.test(t))return'industry';return'city'}
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function finite(n){return Number.isFinite(Number(n))}
function clamp(n,min,max){return Math.min(max,Math.max(min,n))}
function routeId(r){return String(r?.id||r?.entityId||r?.title||r?.destination||'')}
function routeWaypoints(r){return Array.isArray(r.waypoints)?r.waypoints.filter(Boolean):[]}
function timeProfile(){return TIME_PROFILES[state.time]||TIME_PROFILES['90']}
function parseDurationRange(r){
  const text=String(r.duration||'');
  const values=[...text.matchAll(/(\d+)\s*(?:〜|～|-|–|—|から)?\s*(\d+)?\s*分/g)].flatMap(m=>m[2]?[Number(m[1]),Number(m[2])]:[Number(m[1])]);
  if(values.length>=2)return{min:Math.min(values[0],values[1]),max:Math.max(values[0],values[1]),source:'duration'};
  if(values.length===1)return{min:values[0],max:values[0],source:'duration'};
  const explicit=Number(r.drivingBudgetMinutes||r.durationMinutes||r.durationMin||r.feasibility?.medianMinutes);
  if(Number.isFinite(explicit)&&explicit>0)return{min:explicit,max:explicit,source:'explicit'};
  return null;
}
function buildTimePlan(r){
  const p=timeProfile(),range=parseDurationRange(r);
  if(!range)return null;
  const baseMin=Math.max(range.min,p.min/(1+p.safetyRate));
  const baseMax=Math.min(range.max,p.max/(1+p.safetyRate));
  if(baseMin>baseMax)return null;
  const desired=p.target/(1+p.safetyRate);
  const baseMinutes=Math.round(clamp(desired,baseMin,baseMax));
  const safetyMinutes=Math.max(7,Math.ceil(baseMinutes*p.safetyRate));
  const totalMinutes=Math.round(clamp(baseMinutes+safetyMinutes,p.min,p.max));
  return{baseMinutes,safetyMinutes,totalMinutes,sourceMin:range.min,sourceMax:range.max,profile:p};
}
function pointForDestination(name){
  const d=destMeta(name);
  const lat=Number(d.lat??d.coordinates?.lat),lng=Number(d.lng??d.coordinates?.lng);
  return finite(lat)&&finite(lng)?{label:name,lat,lng}:{label:name};
}
function originPoint(){
  if(state.origin==='kamata')return{...KAMATA};
  if(state.originCoords&&finite(state.originCoords.lat)&&finite(state.originCoords.lng))return{label:'現在地',lat:Number(state.originCoords.lat),lng:Number(state.originCoords.lng)};
  return{label:'Current Location'};
}
function distanceKm(a,b){
  if(!a||!b||!finite(a.lat)||!finite(a.lng)||!finite(b.lat)||!finite(b.lng))return null;
  const rad=x=>x*Math.PI/180,R=6371,dLat=rad(Number(b.lat)-Number(a.lat)),dLng=rad(Number(b.lng)-Number(a.lng));
  const q=Math.sin(dLat/2)**2+Math.cos(rad(Number(a.lat)))*Math.cos(rad(Number(b.lat)))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(q));
}
function directMinutes(r){
  const km=distanceKm(originPoint(),pointForDestination(r.destination));
  return km===null?null:Math.max(4,Math.ceil(km/26*60)+4);
}
function parseClock(value){
  const m=String(value||'').match(/(?:^|\D)([01]?\d|2[0-3]):([0-5]\d)(?:\D|$)/);
  return m?Number(m[1])*60+Number(m[2]):null;
}
function minuteOfDay(date){return date.getHours()*60+date.getMinutes()}
function inClockRange(minute,start,end){return start<=end?minute>=start&&minute<end:minute>=start||minute<end}
function parseClockRange(value){
  const times=[...String(value||'').matchAll(/([01]?\d|2[0-3]):([0-5]\d)/g)].map(m=>Number(m[1])*60+Number(m[2]));
  return times.length>=2?{start:times[0],end:times[times.length-1]}:null;
}
function routeAvailability(r,plan,now=new Date()){
  const operations=r.operations||{},tc=operations.timeConditions||{};
  const text=[tc.closingTime,tc.operationDecision,tc.directionConstraint,operations.caution,operations.skipRule].filter(Boolean).join(' / ');
  const departure=new Date(now.getTime()+3*60000);
  const criticalArrival=new Date(departure.getTime()+Math.round(plan.totalMinutes*.58)*60000);
  const latest=parseClock(tc.latestRecommendedDeparture),departureMinute=minuteOfDay(departure);
  if(latest!==null){
    const tooLate=latest>=6*60?(departureMinute>latest||departureMinute<5*60):(departureMinute>latest&&departureMinute<6*60);
    if(tooLate)return{ok:false,reason:'推奨出発時刻を過ぎています'};
  }
  const range=parseClockRange(tc.closingTime);
  if(range){
    const arrivalMinute=minuteOfDay(criticalArrival);
    const isProhibited=/(不可|禁止|閉鎖|入出庫不可|進入禁止)/.test(String(tc.closingTime));
    if(isProhibited&&inClockRange(arrivalMinute,range.start,range.end))return{ok:false,reason:'到着予定時刻が利用禁止時間に重なります'};
    if(!isProhibited&&!/24時間|終日|常時|原則24時間/.test(String(tc.closingTime))&&!inClockRange(arrivalMinute,range.start,range.end))return{ok:false,reason:'到着予定時刻に利用できません'};
  }else{
    const closing=parseClock(tc.closingTime);
    if(closing!==null&&!/24時間|終日|常時|原則24時間/.test(String(tc.closingTime))){
      const arrival=minuteOfDay(criticalArrival);
      if(closing>5*60&&(arrival>closing||arrival<5*60))return{ok:false,reason:'到着予定時刻が閉場後です'};
    }
  }
  if(/一般車.{0,8}(不可|禁止)|関係車両以外.{0,8}(不可|禁止)|終日閉鎖/.test(text))return{ok:false,reason:'一般車の利用条件を満たしません'};
  const verified=Boolean(latest!==null||range||parseClock(tc.closingTime)!==null||/24時間|終日|常時|原則24時間/.test(String(tc.closingTime||'')));
  return{ok:true,reason:null,verified,text};
}
function routeRiskPenalty(r){
  const t=[r.theme,r.intent,r.operations?.caution,r.operations?.skipRule,r.operations?.timeConditions?.directionConstraint].filter(Boolean).join(' ');
  let penalty=0;
  if(/渋滞|混雑|駐車待ち/.test(t))penalty+=7;
  if(/狭路|道幅.{0,4}狭|住宅街|切り返し/.test(t))penalty+=12;
  if(/Uターン|右左折.{0,4}連続|複雑な合流|車線変更/.test(t))penalty+=10;
  if(/満車/.test(t))penalty+=4;
  return penalty;
}
function integrityAssessment(r){
  if(state.sessionRejected.has(routeId(r))||isOrdinaryCarDealerDestination(r))return{ok:false,reason:'session'};
  const p=timeProfile(),wps=routeWaypoints(r),plan=buildTimePlan(r);
  if(!plan)return{ok:false,reason:'time-window'};
  if(!(r.timeBuckets||[r.timeBucket]).includes(state.time))return{ok:false,reason:'bucket'};
  if(wps.length<p.waypointMin||wps.length>p.waypointMax)return{ok:false,reason:'waypoint-count'};
  const direct=directMinutes(r);
  const titleText=[r.title,r.type,r.operations?.timeConditions?.shortPattern].join(' ');
  if(direct!==null&&direct<=20&&(/直行|経由地なし/.test(titleText)||wps.length<p.waypointMin))return{ok:false,reason:'too-close-direct'};
  const availability=routeAvailability(r,plan);
  if(!availability.ok)return{ok:false,reason:'hours',detail:availability.reason};
  return{ok:true,plan,directMinutes:direct,availability,riskPenalty:routeRiskPenalty(r)};
}
const HERO_CONFIG=window.PC_HERO_REGISTRY||{};
const HERO_REGISTRY=HERO_CONFIG.destinations||{};
function heroRecordFor(name){return HERO_REGISTRY[name]||null}
function heroAltFor(name){const r=heroRecordFor(name);return r&&typeof r==='object'&&r.alt?r.alt:`${name}のシネマティックHero`}
function preferredHeroVariant(){const h=new Date().getHours();return h>=18||h<5?'night':h>=15?'evening':'day'}
function heroAssetSelection(record){
  const preferred=preferredHeroVariant();
  const variant=record[preferred]?preferred:record.default?'default':record.hero?'hero':Object.entries(record).find(([k,v])=>!['id','alt','credit','source','assetVersions'].includes(k)&&typeof v==='string')?.[0];
  const path=variant?record[variant]:null;
  const version=variant&&record.assetVersions?.[variant];
  return path?{path,variant,src:version?`${path}?v=${version}`:path}:null;
}
function visualFor(r){
  const record=heroRecordFor(r.destination);
  if(record){if(typeof record==='string')return record;const selected=heroAssetSelection(record);if(selected)return selected.src}
  const d=destMeta(r),cat=category(r,d),a=VISUALS[cat]||VISUALS.city;
  return'assets/visuals/'+a[hash(normalize(r.destination))%a.length];
}
function isOrdinaryCarDealerDestination(r){
  const t=[r.destination,r.title,r.theme,r.family,r.intent,r.type].join(' ');
  const dealer=/(BMW\s*GROUP\s*Tokyo\s*Bay|BMW|Mercedes|メルセデス|Porsche|ポルシェ|Audi|アウディ|LEXUS|レクサス|正規ディーラー|カーディーラー|中古車販売店|自動車販売店|ショールーム|販売店|ディーラー)/i.test(t);
  const experience=/(博物館|ミュージアム|ヘリテージ|コレクション|工場見学|モビリティリゾート|テーマパーク)/i.test(t);
  return dealer&&!experience;
}
function eligible(){return R.map(r=>({r,a:integrityAssessment(r)})).filter(x=>x.a.ok)}
function score(r,a=integrityAssessment(r)){
  const stat=profile.routeStats[routeId(r)]||{},p=timeProfile();
  let s=Number(r.routeAssessment?.overallScore??r.quality??r.evaluation?.routeReadiness??58);
  s+=Number(r.feasibility?.score||60)*.12;
  s+=r.candidateSource==='canonical_route'?14:-4;
  s+=(stat.maps||0)*4+(stat.accepted||0)*5-(stat.rejected||0)*8;
  const recent=profile.recent.slice(-12),pos=recent.lastIndexOf(r.destination);
  if(pos>=0)s-=26*(1-(recent.length-1-pos)/14);
  if(a.plan)s-=Math.abs(a.plan.totalMinutes-p.target)*.35;
  s-=Number(a.riskPenalty||0);
  s+=Math.min(8,routeWaypoints(r).length*2);
  if(a.directMinutes!==null&&a.directMinutes<=20)s-=5;
  return Math.max(1,s);
}
function rankedEligible(){return eligible().sort((x,y)=>score(y.r,y.a)-score(x.r,x.a)||routeId(x.r).localeCompare(routeId(y.r),'ja'))}
function story(r,d){const base=d.reason||r.intent||`${r.destination}へ向かうドライブ。`;const categoryText=category(r,d);const tails={airport:'滑走路の灯りが、まだ夜の続きを残している。',bridge:'道路の高さが変わるたび、街の輪郭も少しずつ変わる。',industry:'役目のある光には、飾りとは違う温度がある。',city:'建物の灯りを追ううちに、自分の速度だけが静かに整っていく。'};return`${tails[categoryText]} ${base} 速さではなく、いま走りたい距離を選ぶ。`}
function pointValue(point){return finite(point?.lat)&&finite(point?.lng)?`${Number(point.lat).toFixed(6)},${Number(point.lng).toFixed(6)}`:point?.label||''}
function mapsUrl(r){
  const origin=originPoint();
  const stops=[...routeWaypoints(r),r.destination].map(pointForDestination);
  const params=new URLSearchParams({api:'1',origin:pointValue(origin),destination:pointValue(origin),travelmode:'driving'});
  if(stops.length)params.set('waypoints',stops.slice(0,8).map(pointValue).join('|'));
  return`https://www.google.com/maps/dir/?${params.toString()}`;
}
function timeLabel(){return timeProfile().label}
function tags(r,d){return[timeLabel(),r.family||d.category||'東京発',sourceRole(r),'NOIR / DEEP']}
function routeMinutes(r){return(routeId(state.active)===routeId(r)&&state.activePlan?.totalMinutes)||integrityAssessment(r).plan?.totalMinutes||timeProfile().target}
function formatClock(date){return new Intl.DateTimeFormat('ja-JP',{hour:'2-digit',minute:'2-digit',hour12:false}).format(date)}
function updateHeroTimes(r){
  if(!r)return;
  const now=new Date(),departure=new Date(now.getTime()+3*60000),arrival=new Date(departure.getTime()+routeMinutes(r)*60000);
  $('#hero-now').textContent=formatClock(now);$('#hero-departure').textContent=formatClock(departure);$('#hero-arrival').textContent=formatClock(arrival);$('#hero-drive-minutes').textContent=`帰着まで約${routeMinutes(r)}分`;
}
function startHeroClock(r){if(state.heroTimer)clearInterval(state.heroTimer);updateHeroTimes(r);state.heroTimer=setInterval(()=>state.active&&updateHeroTimes(state.active),30000)}
function atlasPointsFor(r){const nodes=[...routeWaypoints(r),r.destination].filter(Boolean);const count=Math.max(2,nodes.length+1),seed=hash(String(routeId(r)||r.destination));return Array.from({length:count},(_,i)=>{const t=i/(count-1),x=70+t*665,wave=Math.sin(t*Math.PI*2+(seed%17)/5)*55,bend=Math.sin(t*Math.PI)*(((seed>>3)%95)-47),y=320-t*225+wave+bend;return{x:Math.round(x),y:Math.max(62,Math.min(350,Math.round(y)))}})}
function atlasPath(points){if(points.length<2)return'';let d=`M${points[0].x} ${points[0].y}`;for(let i=1;i<points.length;i++){const p0=points[i-1],p=points[i],mx=Math.round((p0.x+p.x)/2);d+=` C${mx} ${p0.y}, ${mx} ${p.y}, ${p.x} ${p.y}`}return d}
function renderAtlasRoute(r){const points=atlasPointsFor(r),d=atlasPath(points);$('#atlas-route-shadow').setAttribute('d',d);$('#atlas-route-line').setAttribute('d',d);$('#atlas-route-dots').innerHTML=points.map((p,i)=>`<circle cx="${p.x}" cy="${p.y}" r="${i===0?9:i===points.length-1?13:6}" class="${i===0?'start-dot':i===points.length-1?'end-dot':'stop-dot'}"/>`).join('')}
function categoryFallbackVisual(r){const d=destMeta(r),cat=category(r,d),a=VISUALS[cat]||VISUALS.city;return'assets/visuals/'+a[hash(normalize(r.destination))%a.length]}
function applyHeroImage(r){
  const image=$('#hero-image'),primary=visualFor(r),fallback=categoryFallbackVisual(r),token=++state.heroRequestToken;
  if(state.heroLoadTimer)clearTimeout(state.heroLoadTimer);
  image.dataset.primarySrc=primary;image.dataset.heroLoading='true';
  const finishTimer=()=>{if(state.heroLoadTimer){clearTimeout(state.heroLoadTimer);state.heroLoadTimer=null}};
  const commit=(src,mode)=>{if(token!==state.heroRequestToken)return;finishTimer();image.src=src;image.alt=heroAltFor(r.destination);image.dataset.heroMode=mode;image.dataset.heroLoading='false'};
  const fail=()=>{if(token!==state.heroRequestToken)return;finishTimer();image.dataset.heroLoading='failed';image.dataset.heroMode='previous_preserved'};
  const loadFallback=(mode)=>{if(token!==state.heroRequestToken)return;const retry=new Image();retry.decoding='async';retry.onload=()=>commit(fallback,mode);retry.onerror=fail;state.heroLoadTimer=setTimeout(fail,3500);retry.src=fallback};
  const preload=new Image();preload.decoding='async';preload.onload=()=>commit(primary,heroRecordFor(r.destination)?'destination':'category_fallback');preload.onerror=()=>loadFallback('asset_error_fallback');state.heroLoadTimer=setTimeout(()=>loadFallback('asset_timeout_fallback'),3500);preload.src=primary;
}
function heroModeFor(r){return heroRecordFor(r.destination)?'destination':'category_fallback'}
function buildProposalPayload(r){
  const now=new Date(),departure=new Date(now.getTime()+3*60000),driveMinutes=routeMinutes(r),arrival=new Date(departure.getTime()+driveMinutes*60000);
  return{routeId:routeId(r),destination:String(r.destination||''),title:String(r.title||''),timeBucket:state.time,origin:state.origin,mapsUrl:mapsUrl(r),hero:{src:visualFor(r),mode:heroModeFor(r),variant:preferredHeroVariant()},timing:{now:formatClock(now),departure:formatClock(departure),return:formatClock(arrival),totalMinutes:driveMinutes,safetyMinutes:state.activePlan?.safetyMinutes||null},waypoints:[...routeWaypoints(r),r.destination].filter(Boolean),selection:{score:Math.round(score(r,state.activePlan?{...integrityAssessment(r),plan:state.activePlan}:integrityAssessment(r))),sourceRole:sourceRole(r),integrity:'route_integrity_v1'}};
}
function emitNativeEvent(name,detail){window.dispatchEvent(new CustomEvent(name,{detail}))}
function routeCaution(r,a){
  const base=r.caution||destMeta(r).caution||'営業時間・駐車条件・通行規制を出発前に確認してください。';
  const availability=a?.availability?.verified?'到着予定時刻で営業時間を確認済み。':'営業時間は公開情報で判定できないため最終確認が必要です。';
  return`${base} ${availability} 所要時間は12%の余裕込み。リアルタイム渋滞はGoogle Mapsで最終確認してください。`;
}
function render(r,a){
  state.active=r;state.activePlan=a.plan;state.draws++;const d=destMeta(r);startHeroClock(r);applyHeroImage(r);
  $('#hero-copy').textContent=story(r,d);$('#destination-name').textContent=r.destination;$('#hero-tags').innerHTML=tags(r,d).map(x=>`<span>${esc(x)}</span>`).join('');
  const url=mapsUrl(r);$('#maps-primary').href=url;$('#maps-atlas').href=url;$('#mobile-maps-primary').href=url;
  $('#route-role').textContent=sourceRole(r).toUpperCase();$('#detail-tags').innerHTML=tags(r,d).slice(0,3).map(x=>`<span>${esc(x)}</span>`).join('');$('#route-title').textContent=r.title||`${r.destination}を含む周遊`;
  $('#route-intent').textContent=r.intent||d.reason||'往路・立ち寄り・目的地・帰路を一つの体験として楽しむ。';
  const wp=[...routeWaypoints(r),r.destination];$('#waypoint-list').innerHTML=wp.map((x,i)=>`<li><small>${i===wp.length-1?'DESTINATION':'STOP '+(i+1)}</small><br>${esc(x)}</li>`).join('');
  $('#fact-time').textContent=`約${a.plan.totalMinutes}分`;$('#fact-stops').textContent=`${routeWaypoints(r).length}か所＋目的地`;$('#fact-score').textContent=`${Math.round(score(r,a))}%`;$('#caution-box').textContent=routeCaution(r,a);
  $('#atlas-origin').textContent=state.origin==='kamata'?'蒲田駅':'現在地';$('#atlas-destination').textContent=`${r.destination} → 帰着`;$('#atlas-stops').innerHTML=[...wp,state.origin==='kamata'?'蒲田駅へ帰着':'出発地点へ帰着'].map(x=>`<span>${esc(x)}</span>`).join('');renderAtlasRoute(r);
  $('#mission').classList.remove('hidden');$('#details').classList.remove('hidden');$('#mobile-action-dock').classList.remove('hidden');$('#desktop-reroll').classList.remove('hidden');remember(r);emitNativeEvent('pc:proposal',buildProposalPayload(r));if(state.scrollTimer)clearTimeout(state.scrollTimer);state.scrollTimer=setTimeout(()=>$('#mission').scrollIntoView({behavior:'smooth',block:'start'}),80);
}
function setDrawBusy(busy){state.drawBusy=busy;['launch-button','hero-reroll','sticky-reroll','desktop-reroll'].forEach(id=>{const el=$('#'+id);if(el)el.disabled=busy});$('#mission').setAttribute('aria-busy',String(busy))}
function resolveOriginCoordinates(){
  if(state.origin==='kamata'){state.originCoords={...KAMATA};return Promise.resolve(state.originCoords)}
  if(state.originCoords&&finite(state.originCoords.lat)&&finite(state.originCoords.lng))return Promise.resolve(state.originCoords);
  if(!navigator.geolocation)return Promise.resolve(null);
  state.geolocationAttempted=true;
  return new Promise(resolve=>navigator.geolocation.getCurrentPosition(pos=>{state.originCoords={label:'現在地',lat:pos.coords.latitude,lng:pos.coords.longitude};resolve(state.originCoords)},()=>resolve(null),{enableHighAccuracy:false,timeout:5000,maximumAge:120000}));
}
function noQualityRoute(){
  state.active=null;state.activePlan=null;
  $('#mission').classList.add('hidden');$('#details').classList.add('hidden');$('#mobile-action-dock').classList.add('hidden');$('#desktop-reroll').classList.add('hidden');
  $('#pool-status').textContent='現在の時刻・営業時間・往復時間では、品質基準を満たすCruiseがありません。時間枠を変更してください。';
  toast('品質基準を満たすルートが見つかりません');
  emitNativeEvent('pc:no-quality-route',{timeBucket:state.time,origin:state.origin});
}
async function draw({rejectCurrent=false}={}){
  if(state.drawBusy)return false;setDrawBusy(true);
  try{
    await resolveOriginCoordinates();
    if(rejectCurrent)emitNativeEvent('pc:reroll',{previousRouteId:routeId(state.active)||null});
    if(rejectCurrent&&state.active){state.sessionRejected.add(routeId(state.active));bump(routeId(state.active),'rejected')}
    let pool=rankedEligible();
    if(!pool.length&&state.sessionRejected.size){state.sessionRejected.clear();pool=rankedEligible()}
    const best=pool[0];if(best)render(best.r,best.a);else noQualityRoute();updatePool();return Boolean(best);
  }finally{setTimeout(()=>setDrawBusy(false),420)}
}
function bump(id,key){profile.routeStats[id]??={};profile.routeStats[id][key]=(profile.routeStats[id][key]||0)+1;save(STORAGE,profile)}
function remember(r){profile.recent.push(r.destination);if(profile.recent.length>40)profile.recent.splice(0,profile.recent.length-40);bump(routeId(r),'impressions');const history=load(HISTORY,[]);history.unshift({id:routeId(r),destination:r.destination,title:r.title,at:new Date().toISOString(),time:state.time,totalMinutes:state.activePlan?.totalMinutes||null});save(HISTORY,history.slice(0,20))}
function updatePool(){const p=rankedEligible(),unique=new Set(p.map(x=>x.r.destination)).size,verified=p.filter(x=>x.r.candidateSource==='canonical_route').length;$('#pool-status').textContent=p.length?`帰着時間・経由地・営業時間を満たす${unique}種類／${p.length}通り（検証済み${verified}件）。`:'現在の条件では品質基準を満たす候補がありません。'}
function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function toast(s){const e=$('#toast');e.textContent=s;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1700)}
function history(){const h=load(HISTORY,[]);$('#history-list').innerHTML=h.length?h.map(x=>`<div class="history-entry"><b>${esc(x.destination)}</b><small>${esc(x.title||'')} / ${x.totalMinutes?`往復約${x.totalMinutes}分 / `:''}${new Date(x.at).toLocaleString('ja-JP')}</small></div>`).join(''):'<p>まだ履歴はありません。</p>';$('#history-panel').classList.remove('hidden')}
$$('[data-origin]').forEach(b=>b.addEventListener('click',()=>{$$('[data-origin]').forEach(x=>x.classList.toggle('active',x===b));state.origin=b.dataset.origin;state.originCoords=state.origin==='kamata'?{...KAMATA}:null;state.sessionRejected.clear();$('#origin-note').textContent=state.origin==='kamata'?'蒲田駅をスタート・帰着地点に設定しました。':'現在地をスタート・帰着地点に設定します。';updatePool()}));
$$('[data-time]').forEach(b=>b.addEventListener('click',()=>{$$('[data-time]').forEach(x=>x.classList.toggle('active',x===b));state.time=b.dataset.time;state.sessionRejected.clear();updatePool()}));
$('#launch-button').addEventListener('click',()=>draw());$('#hero-reroll').addEventListener('click',()=>draw({rejectCurrent:true}));$('#sticky-reroll').addEventListener('click',()=>draw({rejectCurrent:true}));$('#desktop-reroll').addEventListener('click',()=>draw({rejectCurrent:true}));
function onMapsOpen(){if(state.active){bump(routeId(state.active),'maps');emitNativeEvent('pc:maps',buildProposalPayload(state.active))}}
$('#maps-primary').addEventListener('click',onMapsOpen);$('#maps-atlas').addEventListener('click',onMapsOpen);$('#mobile-maps-primary').addEventListener('click',onMapsOpen);
$('#history-button').addEventListener('click',history);$('#history-close').addEventListener('click',()=>$('#history-panel').classList.add('hidden'));$('#reset-button').addEventListener('click',()=>{localStorage.removeItem(STORAGE);localStorage.removeItem(HISTORY);toast('端末内の学習履歴を初期化しました');setTimeout(()=>location.reload(),500)});
$$('[data-toggle-panel]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.togglePanel,body=$(`[data-panel-body="${key}"]`),collapsed=body.classList.toggle('mobile-collapsed');button.setAttribute('aria-expanded',String(!collapsed));button.querySelector('b').textContent=collapsed?'＋':'−'}));
window.PC_RUNTIME=Object.freeze({draw:()=>draw(),reroll:()=>draw({rejectCurrent:true}),snapshot:()=>({routeId:routeId(state.active)||null,destination:state.active?.destination||null,draws:state.draws,time:state.time,origin:state.origin,totalMinutes:state.activePlan?.totalMinutes||null,integrity:'route_integrity_v1'})});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
$('#release-count').textContent=`PROJECT CRUISE v${RELEASE.version}｜${D.length}地点・${R.length}結果を読込済み`;updatePool();
})();

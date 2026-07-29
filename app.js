const $=s=>document.querySelector(s);
let routes=[],destinations=[],destinationByName=new Map(),selectedTime="90",lastId=null,map=null,mapLayers=[],activeRoute=null;
let config=null;
let originMode="preset";
let activeOrigin={name:"登録済み起点",query:"",coords:[35.5625,139.7160]};
const geocodeCache=JSON.parse(localStorage.getItem("pcGeocodeCache")||"{}");

Promise.all([
 fetch("data/routes.json").then(r=>r.json()),
 fetch("data/destinations.json").then(r=>r.json()),
 fetch("data/config.json").then(r=>r.json())
]).then(([routeData,destinationData,configData])=>{
 routes=routeData;
 destinations=destinationData;
 destinationByName=new Map(destinations.map(d=>[normalizeName(d.name),d]));
 config=configData;
 const p=config.presetOrigin;
 activeOrigin={name:p.name,query:p.query||p.name,coords:p.coordinates};
 originMode=config.defaultOriginMode||"preset";
 $("#preset-origin-label").textContent=p.name;
 $("#start-label").textContent=p.name;
 setOriginMode(originMode,false);
}).catch(()=>alert("設定またはルートデータを読み込めませんでした。"));

document.querySelectorAll(".time-btn").forEach(btn=>{
 btn.addEventListener("click",()=>{
  document.querySelectorAll(".time-btn").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");
  selectedTime=btn.dataset.time;
 });
});
$("#origin-current").addEventListener("click",()=>setOriginMode("current",true));
$("#origin-preset").addEventListener("click",()=>setOriginMode("preset",true));
$("#draw").addEventListener("click",draw);
$("#redraw").addEventListener("click",draw);
$("#about-toggle").addEventListener("click",()=>$("#about").classList.toggle("hidden"));

async function setOriginMode(mode,refreshResult){
 document.querySelectorAll(".origin-btn").forEach(x=>x.classList.remove("active"));
 if(mode==="current"){
  $("#origin-current").classList.add("active","loading");
  setOriginStatus("現在地を取得しています…","");
  try{
   const pos=await getCurrentPosition();
   activeOrigin={
    name:config?.currentLocationLabel||"現在地",
    query:`${pos.coords.latitude},${pos.coords.longitude}`,
    coords:[pos.coords.latitude,pos.coords.longitude]
   };
   originMode="current";
   $("#start-label").textContent=activeOrigin.name;
   setOriginStatus("現在地をスタート地点に設定しました。","success");
  }catch(e){
   $("#origin-current").classList.remove("active");
   $("#origin-preset").classList.add("active");
   usePreset();
   setOriginStatus("現在地を取得できなかったため、登録済み起点を使用します。","error");
  }finally{$("#origin-current").classList.remove("loading")}
 }else{
  $("#origin-preset").classList.add("active");
  usePreset();
  setOriginStatus(`${activeOrigin.name}をスタート地点に設定しました。`,"success");
 }
 if(refreshResult&&activeRoute){updateGoogleLinks(activeRoute);renderMap(activeRoute)}
}
function usePreset(){
 const p=config.presetOrigin;
 activeOrigin={name:p.name,query:p.query||p.name,coords:p.coordinates};
 originMode="preset";
 $("#start-label").textContent=p.name;
}
function setOriginStatus(text,kind){
 const el=$("#origin-status");el.textContent=text;el.className=`origin-status ${kind||""}`;
}
function getCurrentPosition(){
 return new Promise((resolve,reject)=>{
  if(!navigator.geolocation)return reject(new Error("unsupported"));
  navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:10000,maximumAge:300000});
 });
}
function draw(){
 let pool=routes.filter(r=>r.timeBucket===selectedTime);
 if(isNight()){
  const safe=pool.filter(r=>r.timeConditions?.lateNight!=="×");
  if(safe.length)pool=safe;
 }
 if(!pool.length){alert("この時間帯のルートは準備中です。");return}
 let choices=pool.filter(r=>r.id!==lastId);
 if(!choices.length)choices=pool;
 const route=weightedPick(choices);
 lastId=route.id;activeRoute=route;show(route);
}
function weightedPick(pool){
 const weighted=[];
 pool.forEach(r=>{
  const q=Number(r.routeAssessment?.overallScore||r.quality||70);
  const feasibility=Number(r.feasibility?.score||70);
  const certainty=Number(r.routeAssessment?.certainty||3);
  let score=q*.55+feasibility*.35+certainty*2;
  if(isNight()&&r.timeConditions?.lateNight==="○")score+=8;
  if(isNight()&&r.timeConditions?.lateNight==="△")score-=5;
  const copies=Math.max(1,Math.round((score-45)/7));
  for(let i=0;i<copies;i++)weighted.push(r);
 });
 return weighted[Math.floor(Math.random()*weighted.length)];
}
function show(r){
 $("#duration").textContent=`移動 ${timeLabel(selectedTime)}`;
 $("#theme").textContent=r.theme||r.type||"近距離ドライブ";
 $("#destination").textContent=r.destination||"目的地未設定";
 $("#goal").textContent=r.destination||"";
 $("#start-label").textContent=activeOrigin.name;
 $("#title").textContent=r.title||"";
 $("#intent").textContent=(r.intent||"無理なく戻れるルートです。")+" 選択時間は移動時間として扱い、各地点は短時間滞在でつなぎます。";
 $("#dwell").textContent=`滞在目安：${r.totalSuggestedStayMinutes||"各地点20分程度"}${r.totalSuggestedStayMinutes?"分前後":"（最長25分）"}／移動時間とは別枠`;
 $("#dwell").style.display="block";
 $("#caution").textContent=r.caution?`注意：${r.caution}`:"";
 $("#caution").style.display=r.caution?"block":"none";
 $("#waypoints").innerHTML=(r.waypoints||[]).map((x,i)=>`<div class="route-stop"><span>STOP ${i+1}</span><strong>${escapeHtml(x)}</strong></div>`).join("");
 renderStories(r);
 renderOperations(r);
 updateGoogleLinks(r);
 $("#result").classList.remove("hidden");
 $("#story-details").open=false;
 $("#ops-details").open=false;
 $("#result").scrollIntoView({behavior:"smooth",block:"start"});
 setTimeout(()=>renderMap(r),100);
}
function renderStories(r){
 const names=[...(r.waypoints||[]),r.destination].filter(Boolean);
 const blocks=names.map((name,index)=>{
  const d=destinationByName.get(normalizeName(name));
  const role=index===names.length-1?"目的地":`経由地 ${index+1}`;
  if(!d)return `<h3>${escapeHtml(role)}｜${escapeHtml(name)}</h3><p>詳細情報は確認中です。</p>`;
  const reason=d.reason||d.operational?.establishmentReason||"";
  const story=d.story||"";
  return `<h3>${escapeHtml(role)}｜${escapeHtml(name)}</h3>${reason?`<p>${escapeHtml(reason)}</p>`:""}${story?`<p>${escapeHtml(story)}</p>`:""}`;
 }).join("");
 $("#story-content").innerHTML=blocks||"<p>うんちく情報は準備中です。</p>";
}
function renderOperations(r){
 const f=r.feasibility||{};
 const t=r.timeConditions||{};
 const a=r.routeAssessment||{};
 const chips=[
  ["成立性",f.score!=null?`${f.score}/100`:"確認中"],
  ["駐車確度",f.minimumParkingCertainty!=null?`${f.minimumParkingCertainty}/5`:"確認中"],
  ["深夜",t.lateNight||"未評価"],
  ["雨天",t.rain||"未評価"],
  ["ルート総合",a.overallScore!=null?`${a.overallScore}/100`:"確認中"],
  ["所要幅",f.minMinutes!=null?`${f.minMinutes}〜${f.maxMinutes}分`:r.duration]
 ];
 let html=`<div class="db-grid">${chips.map(([k,v])=>`<div class="db-chip"><span>${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></div>`).join("")}</div>`;
 if(t.latestRecommendedDeparture)html+=`<p><strong>推奨最終出発：</strong>${escapeHtml(t.latestRecommendedDeparture)}</p>`;
 if(f.hardGate?.place)html+=`<p><strong>Hard Gate：</strong>${escapeHtml(f.hardGate.place)}${f.hardGate.time?`（${escapeHtml(f.hardGate.time)}）`:""}</p>`;
 if(t.shortPattern)html+=`<p><strong>時間不足時：</strong>${escapeHtml(t.shortPattern)}</p>`;
 if(f.planBDestination)html+=`<p><strong>代替先：</strong>${escapeHtml(f.planBDestination)}</p>`;
 if(f.failureConditions)html+=`<div class="db-alert"><strong>主な失敗条件：</strong>${escapeHtml(f.failureConditions)}</div>`;
 if((r.stopOperations||[]).length){
  html+=`<h3>滞在運用</h3>`+(r.stopOperations||[]).map(o=>`<p><strong>${escapeHtml(o.name||"")}</strong>｜${escapeHtml(o.role||"")}｜標準${escapeHtml(o.standardStayMinutes??"-")}分・最大${escapeHtml(o.maximumStayMinutes??"-")}分<br>${escapeHtml(o.firstFiveMinutes||"")}${o.skipCondition?`<br><small>省略条件：${escapeHtml(o.skipCondition)}</small>`:""}</p>`).join("");
 }
 $("#ops-content").innerHTML=html;
}
function normalizeName(s){return String(s||"").replace(/[\s　]+/g," ").trim().toLowerCase()}
function isNight(){const h=new Date().getHours();return h>=18||h<5}
function buildGoogleMapsUrl(r){
 const destination=encodeURIComponent(r.destination||"");
 const origin=encodeURIComponent(activeOrigin.query||activeOrigin.name);
 let url=`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
 const waypoints=(r.waypoints||[]).filter(Boolean);
 if(waypoints.length)url+=`&waypoints=${encodeURIComponent(waypoints.join("|"))}`;
 return url;
}
function updateGoogleLinks(r){const url=buildGoogleMapsUrl(r);$("#gmap").href=url;$("#map-link").href=url}
function initMap(){
 if(map)return;
 map=L.map("map",{zoomControl:true,attributionControl:true,scrollWheelZoom:false}).setView(activeOrigin.coords,11);
 L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"&copy; OpenStreetMap contributors"}).addTo(map);
}
function clearMap(){mapLayers.forEach(x=>map.removeLayer(x));mapLayers=[]}
async function renderMap(r){
 initMap();map.invalidateSize();clearMap();$("#map-status").textContent="地点を読み込み中";
 const names=[activeOrigin.name,...(r.waypoints||[]),r.destination].filter(Boolean);
 const coords=[activeOrigin.coords];
 for(let i=1;i<names.length;i++){const c=await geocode(names[i]);coords.push(c||null)}
 const valid=coords.map((c,i)=>({c,i})).filter(x=>x.c);
 if(valid.length<2){$("#map-status").textContent="地図取得失敗・Googleマップは利用可能";return}
 valid.forEach(({c,i})=>{
  const isStart=i===0,isGoal=i===names.length-1;
  const color=isStart?"blue":isGoal?"red":"yellow";
  const label=isStart?"S":isGoal?"G":String(i);
  const icon=L.divIcon({className:"",html:`<div class="marker-pin ${color}"><span>${label}</span></div>`,iconSize:[28,28],iconAnchor:[14,28]});
  const marker=L.marker(c,{icon}).addTo(map).bindTooltip(names[i],{direction:"top",offset:[0,-24]});mapLayers.push(marker);
 });
 const ordered=valid.map(x=>x.c);let geometry=null;
 try{geometry=await roadGeometry(ordered)}catch(e){}
 const line=L.polyline(geometry||ordered,{color:"#0e7490",weight:5,opacity:.85,className:"route-animated"}).addTo(map);
 mapLayers.push(line);map.fitBounds(line.getBounds(),{padding:[34,34],maxZoom:13});
 $("#map-status").textContent=geometry?"道路ルートを表示":"地点間を簡易表示";
}
async function geocode(name){
 if(geocodeCache[name])return geocodeCache[name];
 const query=encodeURIComponent(`${name}, 日本`);
 const url=`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=jp&q=${query}`;
 try{
  const res=await fetch(url,{headers:{"Accept":"application/json","Accept-Language":"ja"}});const data=await res.json();
  if(data[0]){const c=[Number(data[0].lat),Number(data[0].lon)];geocodeCache[name]=c;localStorage.setItem("pcGeocodeCache",JSON.stringify(geocodeCache));await sleep(1050);return c}
 }catch(e){}
 await sleep(1050);return null;
}
async function roadGeometry(coords){
 const path=coords.map(c=>`${c[1]},${c[0]}`).join(";");
 const url=`https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson`;
 const res=await fetch(url);if(!res.ok)throw new Error("route");
 const data=await res.json();if(!data.routes||!data.routes[0])throw new Error("route");
 return data.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]);
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function timeLabel(v){return v==="90"?"90分":v==="120"?"2時間":"半日"}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

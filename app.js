const $=s=>document.querySelector(s);
let routes=[],selectedTime="90",lastId=null,map=null,mapLayers=[],activeRoute=null;
const START_NAME="蒲田駅";
const START_COORD=[35.5625,139.7160];
const GOOD_STORAGE_KEY="projectCruiseGoodHistoryV1";
const geocodeCache=JSON.parse(localStorage.getItem("pcGeocodeCache")||"{}");

fetch("data/routes.json")
 .then(r=>r.json())
 .then(data=>{routes=data})
 .catch(()=>alert("ルートデータを読み込めませんでした。"));

document.querySelectorAll(".time-btn").forEach(btn=>{
 btn.addEventListener("click",()=>{
  document.querySelectorAll(".time-btn").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");
  selectedTime=btn.dataset.time;
 });
});
$("#draw").addEventListener("click",draw);
$("#redraw").addEventListener("click",draw);
$("#about-toggle").addEventListener("click",()=>$("#about").classList.toggle("hidden"));
$("#good-route").addEventListener("click",()=>saveGood("route"));
$("#good-story").addEventListener("click",()=>saveGood("story"));
$("#export-good").addEventListener("click",exportGoodHistory);

refreshGoodSummary();

function draw(){
 const pool=routes.filter(r=>r.timeBucket===selectedTime);
 if(!pool.length){alert("この時間帯のルートは準備中です。");return}
 let choices=pool.filter(r=>r.id!==lastId);
 if(!choices.length)choices=pool;
 const route=weightedPick(choices);
 lastId=route.id;activeRoute=route;show(route);
}
function weightedPick(pool){
 const weighted=[];
 pool.forEach(r=>{
  const q=Number(r.quality)||70;
  const copies=Math.max(1,Math.round((q-60)/8));
  for(let i=0;i<copies;i++)weighted.push(r);
 });
 return weighted[Math.floor(Math.random()*weighted.length)];
}
function show(r){
 $("#duration").textContent=r.duration||timeLabel(selectedTime);
 $("#theme").textContent=r.theme||r.type||"近距離ドライブ";
 $("#destination").textContent=r.destination||"目的地未設定";
 $("#goal").textContent=r.destination||"";
 $("#title").textContent=r.title||"";
 $("#intent").textContent=r.intent||"大田区から無理なく戻れるルートです。";
 $("#dwell").textContent=r.dwell?`推奨滞在：${r.dwell}`:"";
 $("#dwell").style.display=r.dwell?"block":"none";
 $("#caution").textContent=r.caution?`注意：${r.caution}`:"";
 $("#caution").style.display=r.caution?"block":"none";
 $("#gmap").href=r.googleMaps||"#";
 $("#map-link").href=r.googleMaps||"#";
 $("#waypoints").innerHTML=(r.waypoints||[]).map((x,i)=>`<div class="route-stop"><span>STOP ${i+1}</span><strong>${escapeHtml(x)}</strong></div>`).join("");
 resetGoodButtons();
 refreshCurrentGoodCounts();
 $("#result").classList.remove("hidden");
 $("#result").scrollIntoView({behavior:"smooth",block:"start"});
 setTimeout(()=>renderMap(r),100);
}

function getGoodHistory(){
 try{
  const data=JSON.parse(localStorage.getItem(GOOD_STORAGE_KEY)||"[]");
  return Array.isArray(data)?data:[];
 }catch(e){
  return [];
 }
}

function routeSignature(r){
 return [r.id,r.destination,(r.waypoints||[]).join(" > ")].join("|");
}

function storySignature(r){
 return [r.id,r.intent||""].join("|");
}

function saveGood(type){
 if(!activeRoute)return;
 const history=getGoodHistory();
 const signature=type==="route"?routeSignature(activeRoute):storySignature(activeRoute);
 const entry={
  feedbackId:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
  type,
  routeId:activeRoute.id||"",
  destination:activeRoute.destination||"",
  routeTitle:activeRoute.title||"",
  waypoints:[...(activeRoute.waypoints||[])],
  story:activeRoute.intent||"",
  theme:activeRoute.theme||activeRoute.type||"",
  duration:activeRoute.duration||timeLabel(selectedTime),
  timeBucket:activeRoute.timeBucket||selectedTime,
  signature,
  createdAt:new Date().toISOString()
 };
 history.push(entry);
 localStorage.setItem(GOOD_STORAGE_KEY,JSON.stringify(history));

 const button=type==="route"?$("#good-route"):$("#good-story");
 button.classList.add("saved");
 button.setAttribute("aria-pressed","true");
 $("#good-message").textContent=type==="route"
  ?"このルートをGOOD履歴へ保存しました。"
  :"このStoryをGOOD履歴へ保存しました。";
 refreshGoodSummary();
 refreshCurrentGoodCounts();
}

function refreshGoodSummary(){
 const history=getGoodHistory();
 const routeCount=history.filter(x=>x.type==="route").length;
 const storyCount=history.filter(x=>x.type==="story").length;
 $("#good-total").textContent=history.length;
 $("#good-breakdown").textContent=`ルート ${routeCount} / Story ${storyCount}`;
 $("#export-good").disabled=history.length===0;
}

function refreshCurrentGoodCounts(){
 if(!activeRoute){
  $("#route-good-count").textContent="0";
  $("#story-good-count").textContent="0";
  return;
 }
 const history=getGoodHistory();
 const routeKey=routeSignature(activeRoute);
 const storyKey=storySignature(activeRoute);
 $("#route-good-count").textContent=history.filter(x=>x.type==="route"&&x.signature===routeKey).length;
 $("#story-good-count").textContent=history.filter(x=>x.type==="story"&&x.signature===storyKey).length;
}

function resetGoodButtons(){
 ["#good-route","#good-story"].forEach(selector=>{
  const button=$(selector);
  button.classList.remove("saved");
  button.setAttribute("aria-pressed","false");
 });
 $("#good-message").textContent="この端末のブラウザに保存されます。";
}

function exportGoodHistory(){
 const history=getGoodHistory();
 if(!history.length)return;
 const payload={
  exportedAt:new Date().toISOString(),
  app:"Project Cruise",
  version:1,
  total:history.length,
  records:history
 };
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob);
 const a=document.createElement("a");
 a.href=url;
 a.download=`project-cruise-good-${new Date().toISOString().slice(0,10)}.json`;
 document.body.appendChild(a);
 a.click();
 a.remove();
 URL.revokeObjectURL(url);
 $("#good-message").textContent="GOOD履歴をJSONで書き出しました。";
}

function initMap(){
 if(map)return;
 map=L.map("map",{zoomControl:true,attributionControl:true,scrollWheelZoom:false}).setView(START_COORD,11);
 L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
  maxZoom:19,attribution:"&copy; OpenStreetMap contributors"
 }).addTo(map);
}
function clearMap(){
 mapLayers.forEach(x=>map.removeLayer(x));
 mapLayers=[];
}
async function renderMap(r){
 initMap();map.invalidateSize();clearMap();
 $("#map-status").textContent="地点を読み込み中";
 const names=[START_NAME,...(r.waypoints||[]),r.destination].filter(Boolean);
 const coords=[START_COORD];
 for(let i=1;i<names.length;i++){
  const c=await geocode(names[i]);
  if(c)coords.push(c);else coords.push(null);
 }
 const valid=coords.map((c,i)=>({c,i})).filter(x=>x.c);
 if(valid.length<2){
  $("#map-status").textContent="地図取得失敗・Googleマップは利用可能";
  return;
 }
 valid.forEach(({c,i})=>{
  const isStart=i===0,isGoal=i===names.length-1;
  const color=isStart?"blue":isGoal?"red":"yellow";
  const label=isStart?"S":isGoal?"G":String(i);
  const icon=L.divIcon({className:"",html:`<div class="marker-pin ${color}"><span>${label}</span></div>`,iconSize:[28,28],iconAnchor:[14,28]});
  const marker=L.marker(c,{icon}).addTo(map).bindTooltip(names[i],{direction:"top",offset:[0,-24]});
  mapLayers.push(marker);
 });
 const ordered=valid.map(x=>x.c);
 let geometry=null;
 try{geometry=await roadGeometry(ordered)}catch(e){}
 const line=L.polyline(geometry||ordered,{color:"#0e7490",weight:5,opacity:.85,className:"route-animated"}).addTo(map);
 mapLayers.push(line);
 map.fitBounds(line.getBounds(),{padding:[34,34],maxZoom:13});
 $("#map-status").textContent=geometry?"道路ルートを表示":"地点間を簡易表示";
}
async function geocode(name){
 if(name===START_NAME)return START_COORD;
 if(geocodeCache[name])return geocodeCache[name];
 const query=encodeURIComponent(`${name}, 日本`);
 const url=`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=jp&q=${query}`;
 try{
  const res=await fetch(url,{headers:{"Accept":"application/json","Accept-Language":"ja"}});
  const data=await res.json();
  if(data[0]){
   const c=[Number(data[0].lat),Number(data[0].lon)];
   geocodeCache[name]=c;
   localStorage.setItem("pcGeocodeCache",JSON.stringify(geocodeCache));
   await sleep(1050);
   return c;
  }
 }catch(e){}
 await sleep(1050);
 return null;
}
async function roadGeometry(coords){
 const path=coords.map(c=>`${c[1]},${c[0]}`).join(";");
 const url=`https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson`;
 const res=await fetch(url);
 if(!res.ok)throw new Error("route");
 const data=await res.json();
 if(!data.routes||!data.routes[0])throw new Error("route");
 return data.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]);
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function timeLabel(v){return v==="90"?"90分":v==="120"?"2時間":"半日"}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

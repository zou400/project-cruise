const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const score=v=>Number(v)||0;
let spots=[],routes=[],curb=[],meta={},visibleSpots=[];

Promise.all([
 fetch("data/destinations.json").then(r=>r.json()),
 fetch("data/routes.json").then(r=>r.json()),
 fetch("data/legal-curb-access.json").then(r=>r.json()),
 fetch("data/metadata.json").then(r=>r.json())
]).then(([s,r,c,m])=>{
 spots=s;routes=r;curb=c;meta=m;
 $("#meta").innerHTML=`${m.destinationCount}地点 / ${m.routeCount}ルート<br>DB ${m.generatedAt}`;
 [...new Set(spots.map(x=>(x.area||"").split("・")[0]).filter(Boolean))].sort().forEach(x=>$("#area").insertAdjacentHTML("beforeend",`<option>${esc(x)}</option>`));
 document.querySelectorAll(".controls input,.controls select").forEach(x=>x.addEventListener("input",render));
 document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>selectTab(b.dataset.tab)));
 $("#surprise").addEventListener("click",surprise);
 render();renderCurb();
}).catch(err=>document.body.insertAdjacentHTML("beforeend",`<p class="empty">データ読込に失敗しました。GitHub Pagesで開いてください。<br>${esc(err)}</p>`));

function selectTab(tab){
 document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.tab===tab));
 document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));
 $(`#${tab}-panel`).classList.add("active");
}
function filters(){return{q:$("#search").value.trim().toLowerCase(),area:$("#area").value,distance:$("#distance").value,usecase:$("#usecase").value,parking:$("#parking").value,sort:$("#sort").value}}
function filteredSpots(){
 const f=filters();
 let out=spots.filter(x=>{
  if(f.q&&!x.searchText.includes(f.q))return false;
  if(f.area&&!(x.area||"").startsWith(f.area))return false;
  if(f.distance&&x.distanceTier!==f.distance)return false;
  if(f.usecase&&!`${x.category} ${x.useCase} ${(x.tags||[]).join(" ")}`.includes(f.usecase))return false;
  if(f.parking==="curb"&&(!x.roadsideConfidence||x.roadsideConfidence==="-"))return false;
  if(f.parking==="offstreet"&&/なし|不可/.test(x.parking||""))return false;
  return true;
 });
 const sorters={
  recommended:(a,b)=>(score(b.night)+score(b.hidden)+score(b.rain)+score(b.carView))-(score(a.night)+score(a.hidden)+score(a.rain)+score(a.carView)),
  night:(a,b)=>score(b.night)-score(a.night),hidden:(a,b)=>score(b.hidden)-score(a.hidden),
  rain:(a,b)=>score(b.rain)-score(a.rain),name:(a,b)=>a.name.localeCompare(b.name,"ja")
 };
 out.sort(sorters[f.sort]);return out;
}
function render(){
 const f=filters(); visibleSpots=filteredSpots();
 $("#spot-count").textContent=`${visibleSpots.length}地点を表示`;
 $("#spots").innerHTML=visibleSpots.length?visibleSpots.map(spotCard).join(""):`<div class="empty">条件に合う候補がありません。</div>`;
 let rout=routes.filter(x=>{
  if(f.q&&!x.searchText.includes(f.q))return false;
  if(f.usecase&&!`${x.theme} ${x.type} ${x.family}`.includes(f.usecase))return false;
  return true;
 }).sort((a,b)=>(score(b.quality)+score(b.diversity))-(score(a.quality)+score(a.diversity)));
 $("#route-count").textContent=`${rout.length}ルートを表示`;
 $("#routes").innerHTML=rout.length?rout.map(routeCard).join(""):`<div class="empty">条件に合うルートがありません。</div>`;
}
function surprise(){
 if(!visibleSpots.length)return;
 const pool=visibleSpots.slice(0,Math.min(20,visibleSpots.length));
 const x=pool[Math.floor(Math.random()*pool.length)];
 document.querySelectorAll(".card").forEach(c=>c.classList.remove("highlight"));
 const el=document.querySelector(`[data-id="${CSS.escape(String(x.id))}"]`);
 if(el){el.classList.add("highlight");el.scrollIntoView({behavior:"smooth",block:"center"});}
}
function spotCard(x){
 const road=x.roadsideConfidence&&x.roadsideConfidence!=="-"?`<span class="badge warn">路上短時間 ${esc(x.roadsideConfidence)}</span>`:"";
 return `<article class="card" data-id="${esc(x.id)}"><div class="badges"><span class="badge">${esc(x.distanceTier)}</span><span class="badge">${esc(x.driveTime)}</span><span class="badge good">夜 ${esc(x.night)}/5</span>${road}</div><h2>${esc(x.name)}</h2><div class="sub">${esc(x.area)}｜${esc(x.category)}</div><div class="summary">${esc(x.reason)}</div><div class="details"><b>駐車</b> ${esc(x.parking)}<br><b>時間</b> ${esc(x.hours)}${road?`<br><b>路上短時間</b> ${esc(x.roadsideAccess)}／${esc(x.roadsideScope)}`:""}<br><b>注意</b> ${esc(x.caution)}</div><div class="actions"><a href="${esc(x.googleMaps)}" target="_blank" rel="noopener">Googleマップ</a>${x.source?`<a class="secondary" href="${esc(x.source)}" target="_blank" rel="noopener">公式情報</a>`:""}</div></article>`;
}
function routeCard(x){
 const line=[...(x.waypoints||[]),x.destination].filter(Boolean).map(esc).join(" → ");
 return `<article class="card"><div class="badges"><span class="badge">${esc(x.type)}</span><span class="badge">${esc(x.duration)}</span><span class="badge good">品質 ${esc(x.quality)}</span></div><h2>${esc(x.title)}</h2><div class="sub">${esc(x.theme)}｜${esc(x.family)}</div><div class="summary"><b>${line}</b></div><div class="details">${esc(x.intent)}<br><b>滞在</b> ${esc(x.dwell)}<br><b>注意</b> ${esc(x.caution)}</div><div class="actions"><a href="${esc(x.googleMaps)}" target="_blank" rel="noopener">ルート開始</a></div></article>`;
}
function renderCurb(){
 $("#curb-list").innerHTML=curb.map(x=>`<article class="card"><div class="badges"><span class="badge">${esc(x.ward)}</span><span class="badge ${x.confidence==="A"?"good":"warn"}">確度 ${esc(x.confidence)}</span></div><h2>${esc(x.location)}</h2><div class="sub">${esc(x.nearby)}</div><div class="summary">${esc(x.purpose)}</div><div class="details"><b>${esc(x.type)}</b><br>${esc(x.hours)}／${esc(x.limit)}／${esc(x.fee)}<br><b>条件</b> ${esc(x.days)}<br><b>確認</b> ${esc(x.check)}</div><div class="actions"><a href="${esc(x.googleMaps)}" target="_blank" rel="noopener">現地へ</a>${x.official?`<a class="secondary" href="${esc(x.official)}" target="_blank" rel="noopener">制度確認</a>`:""}</div></article>`).join("");
}
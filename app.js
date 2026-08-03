
(()=>{
'use strict';
const D=window.PC_DESTINATIONS||[];
const R=window.PC_ROUTES||[];
const $=(s)=>document.querySelector(s);
const $$=(s)=>[...document.querySelectorAll(s)];
const state={origin:'kamata',time:'90',active:null,draws:0,sessionRejected:new Set()};
const STORAGE='pc_v012_profile';
const HISTORY='pc_v012_history';
const VISUALS={
 airport:['airport-scene-1-1.webp','airport-scene-1-2.webp','airport-scene-1-3.webp','airport-scene-1-4.webp','airport-scene-2-1.webp','airport-scene-2-2.webp','airport-scene-2-3.webp','airport-scene-2-4.webp'],
 bridge:['bridge-scene-1-1.webp','bridge-scene-1-2.webp','bridge-scene-1-3.webp','bridge-scene-1-4.webp','bridge-scene-2-1.webp','bridge-scene-2-2.webp','bridge-scene-2-3.webp','bridge-scene-2-4.webp'],
 industry:['industry-scene-1-1.webp','industry-scene-1-2.webp','industry-scene-1-3.webp','industry-scene-1-4.webp','industry-scene-2-1.webp','industry-scene-2-2.webp','industry-scene-2-3.webp','industry-scene-2-4.webp'],
 city:['city-scene-1-1.webp','city-scene-1-2.webp','city-scene-1-3.webp','city-scene-1-4.webp','city-scene-2-1.webp','city-scene-2-2.webp','city-scene-2-3.webp','city-scene-2-4.webp']};
const profile=load(STORAGE,{routeStats:{},recent:[],accepted:[],version:'0.12.2'});
function load(k,f){try{return JSON.parse(localStorage.getItem(k))||f}catch{return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
function normalize(s){return String(s||'').replace(/[\s　]+/g,' ').trim().toLowerCase()}
function destMeta(route){return D.find(d=>normalize(d.name)===normalize(route.destination))||{}}
function sourceRole(r){return r.candidateSource==='canonical_route'?'検証済みルート':r.generatedFromDestination?'目的地直行':'探索候補'}
function category(r,d){const t=[r.theme,r.family,r.title,r.destination,d.category,d.useCase,(d.tags||[]).join(' ')].join(' ');if(/飛行機|空港|滑走路|羽田/.test(t))return'airport';if(/橋|高架|JCT|首都高|ベイブリッジ|海沿い|海岸|岬/.test(t))return'bridge';if(/工場|工業|港|物流|コンテナ|産業/.test(t))return'industry';return'city'}
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
const HERO_REGISTRY=(window.PC_HERO_REGISTRY&&window.PC_HERO_REGISTRY.destinations)||{};
function heroRecordFor(name){return HERO_REGISTRY[name]||null}
function preferredHeroVariant(){const h=new Date().getHours();return h>=18||h<5?'night':h>=15?'evening':'day'}
function visualFor(r){
  const record=heroRecordFor(r.destination);
  if(record){
    if(typeof record==='string')return record;
    const variant=preferredHeroVariant();
    return record[variant]||record.default||record.hero||Object.values(record)[0];
  }
  const d=destMeta(r),cat=category(r,d),a=VISUALS[cat]||VISUALS.city;
  return 'assets/visuals/'+a[hash(normalize(r.destination))%a.length];
}
function isOrdinaryCarDealerDestination(r){
  const t=[r.destination,r.title,r.theme,r.family,r.intent,r.type].join(' ');
  const dealer=/(BMW\s*GROUP\s*Tokyo\s*Bay|BMW|Mercedes|メルセデス|Porsche|ポルシェ|Audi|アウディ|LEXUS|レクサス|正規ディーラー|カーディーラー|中古車販売店|自動車販売店)/i.test(t);
  const experience=/(博物館|ミュージアム|ヘリテージ|コレクション|工場見学|モビリティリゾート|テーマパーク)/i.test(t);
  return dealer&&!experience;
}
function eligible(){
  return R.filter(r=>
    (r.timeBuckets||[r.timeBucket]).includes(state.time)&&
    !state.sessionRejected.has(r.id)&&
    !isOrdinaryCarDealerDestination(r)
  );
}
function score(r){const stat=profile.routeStats[r.id]||{};let s=Number(r.routeAssessment?.overallScore??r.quality??r.evaluation?.routeReadiness??58);s+=Number(r.feasibility?.score||60)*.12;s+=r.candidateSource==='canonical_route'?11:-3;s+=(stat.maps||0)*4+(stat.accepted||0)*5-(stat.rejected||0)*8;const recent=profile.recent.slice(-12);const pos=recent.lastIndexOf(r.destination);if(pos>=0)s-=26*(1-(recent.length-1-pos)/14);if(state.time==='90'&&Number(r.feasibility?.maxMinutes||999)>135)s-=16;if(state.time==='half'&&r.candidateSource==='canonical_route')s+=5;return Math.max(1,s)}
function weightedPick(items){const ranked=items.map(x=>({x,w:Math.pow(Math.max(1,score(x)),2.15)}));const total=ranked.reduce((a,b)=>a+b.w,0);let n=Math.random()*total;for(const e of ranked){n-=e.w;if(n<=0)return e.x}return ranked.at(-1)?.x}
function story(r,d){const base=d.reason||r.intent||`${r.destination}へ向かうドライブ。`;const categoryText=category(r,d);const tails={airport:'滑走路の灯りが、まだ夜の続きを残している。',bridge:'道路の高さが変わるたび、街の輪郭も少しずつ変わる。',industry:'役目のある光には、飾りとは違う温度がある。',city:'建物の灯りを追ううちに、自分の速度だけが静かに整っていく。'};return `${tails[categoryText]} ${base} 速さではなく、今夜に合う距離を選ぶ。`}
function mapsUrl(r){let url=r.googleMaps||destMeta(r).googleMaps||`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(r.destination)}&travelmode=driving`;if(state.origin==='kamata'&&!/[?&]origin=/.test(url))url+=`&origin=${encodeURIComponent('蒲田駅')}`;return url}
function timeLabel(){return state.time==='90'?'移動90分':state.time==='120'?'移動2時間':'移動半日'}
function tags(r,d){return[timeLabel(),r.family||d.category||'東京発',sourceRole(r),'NOIR / DEEP']}
function routeMinutes(r){
  const explicit=Number(r.durationMinutes||r.durationMin||r.feasibility?.medianMinutes);
  if(Number.isFinite(explicit)&&explicit>0)return Math.round(explicit);
  const text=[r.duration,r.timeBucket,r.originalDwellText].join(' ');
  const match=text.match(/(\d+)\s*分/);
  if(match)return Number(match[1]);
  return state.time==='90'?55:state.time==='120'?85:150;
}
function formatClock(date){
  return new Intl.DateTimeFormat('ja-JP',{hour:'2-digit',minute:'2-digit',hour12:false}).format(date);
}
function updateHeroTimes(r){
  const now=new Date();
  const departure=new Date(now.getTime()+3*60*1000);
  const arrival=new Date(departure.getTime()+routeMinutes(r)*60*1000);
  $('#hero-now').textContent=formatClock(now);
  $('#hero-departure').textContent=formatClock(departure);
  $('#hero-arrival').textContent=formatClock(arrival);
  $('#hero-drive-minutes').textContent=`約${routeMinutes(r)}分`;
}
function heroModeFor(r){
  return heroRecordFor(r.destination)?'destination':'category_fallback';
}
function buildProposalPayload(r){
  const now=new Date();
  const departure=new Date(now.getTime()+3*60*1000);
  const driveMinutes=routeMinutes(r);
  const arrival=new Date(departure.getTime()+driveMinutes*60*1000);
  return {
    routeId:String(r.id||''),
    destination:String(r.destination||''),
    title:String(r.title||''),
    timeBucket:state.time,
    origin:state.origin,
    mapsUrl:mapsUrl(r),
    hero:{src:visualFor(r),mode:heroModeFor(r),variant:preferredHeroVariant()},
    timing:{
      now:formatClock(now),
      departure:formatClock(departure),
      arrival:formatClock(arrival),
      driveMinutes
    },
    waypoints:[...(r.waypoints||[]),r.destination].filter(Boolean),
    selection:{score:Math.round(score(r)),sourceRole:sourceRole(r)}
  };
}
function emitNativeEvent(name,detail){
  window.dispatchEvent(new CustomEvent(name,{detail}));
}
function render(r){state.active=r;state.draws++;const d=destMeta(r);updateHeroTimes(r);$('#hero-image').src=visualFor(r);$('#hero-copy').textContent=story(r,d);$('#destination-name').textContent=r.destination;$('#hero-tags').innerHTML=tags(r,d).map(x=>`<span>${esc(x)}</span>`).join('');const url=mapsUrl(r);$('#maps-primary').href=url;$('#maps-atlas').href=url;$('#mobile-maps-primary').href=url;$('#route-role').textContent=sourceRole(r).toUpperCase();$('#detail-tags').innerHTML=tags(r,d).slice(0,3).map(x=>`<span>${esc(x)}</span>`).join('');$('#route-title').textContent=r.title||`${r.destination}へ直行`;$('#route-intent').textContent=r.intent||d.reason||'到着までの景観の変化を一本の体験として楽しむ。';const wp=[...(r.waypoints||[]),r.destination];$('#waypoint-list').innerHTML=wp.map((x,i)=>`<li><small>${i===wp.length-1?'DESTINATION':'STOP '+(i+1)}</small><br>${esc(x)}</li>`).join('');$('#fact-time').textContent=timeLabel().replace('移動','');$('#fact-stops').textContent=`${wp.length}地点`;$('#fact-score').textContent=`${Math.round(score(r))}%`;$('#caution-box').textContent=r.caution||d.caution||'営業時間・駐車条件・通行規制を出発前に確認してください。';$('#atlas-origin').textContent=state.origin==='kamata'?'蒲田駅':'現在地';$('#atlas-destination').textContent=r.destination;$('#atlas-stops').innerHTML=wp.map(x=>`<span>${esc(x)}</span>`).join('');$('#mission').classList.remove('hidden');$('#details').classList.remove('hidden');$('#mobile-action-dock').classList.remove('hidden');$('#desktop-reroll').classList.remove('hidden');remember(r);emitNativeEvent('pc:proposal',buildProposalPayload(r));setTimeout(()=>$('#mission').scrollIntoView({behavior:'smooth',block:'start'}),80)}
function draw({rejectCurrent=false}={}){if(rejectCurrent){emitNativeEvent('pc:reroll',{previousRouteId:state.active?.id||null});}if(rejectCurrent&&state.active){state.sessionRejected.add(state.active.id);bump(state.active.id,'rejected')}let pool=eligible();if(!pool.length){state.sessionRejected.clear();pool=eligible()}const r=weightedPick(pool);if(r)render(r)}
function bump(id,key){profile.routeStats[id]??={};profile.routeStats[id][key]=(profile.routeStats[id][key]||0)+1;save(STORAGE,profile)}
function remember(r){profile.recent.push(r.destination);if(profile.recent.length>40)profile.recent.splice(0,profile.recent.length-40);bump(r.id,'impressions');const history=load(HISTORY,[]);history.unshift({id:r.id,destination:r.destination,title:r.title,at:new Date().toISOString(),time:state.time});save(HISTORY,history.slice(0,20))}
function updatePool(){const p=eligible(),unique=new Set(p.map(r=>r.destination)).size,verified=p.filter(r=>r.candidateSource==='canonical_route').length;$('#pool-status').textContent=`現在時刻に成立する${unique}種類／${p.length}通り（検証済みルート${verified}件）。`}
function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function toast(s){const e=$('#toast');e.textContent=s;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1700)}
function history(){const h=load(HISTORY,[]);$('#history-list').innerHTML=h.length?h.map(x=>`<div class="history-entry"><b>${esc(x.destination)}</b><small>${esc(x.title||'')} / ${new Date(x.at).toLocaleString('ja-JP')}</small></div>`).join(''):'<p>まだ履歴はありません。</p>';$('#history-panel').classList.remove('hidden')}
$$('[data-origin]').forEach(b=>b.addEventListener('click',()=>{$$('[data-origin]').forEach(x=>x.classList.toggle('active',x===b));state.origin=b.dataset.origin;$('#origin-note').textContent=state.origin==='kamata'?'蒲田駅をスタート地点に設定しました。':'現在地を出発地点としてGoogle Mapsで補完します。'}));
$$('[data-time]').forEach(b=>b.addEventListener('click',()=>{$$('[data-time]').forEach(x=>x.classList.toggle('active',x===b));state.time=b.dataset.time;state.sessionRejected.clear();updatePool()}));
$('#launch-button').addEventListener('click',()=>draw());$('#hero-reroll').addEventListener('click',()=>draw({rejectCurrent:true}));$('#sticky-reroll').addEventListener('click',()=>draw({rejectCurrent:true}));$('#desktop-reroll').addEventListener('click',()=>draw({rejectCurrent:true}));function onMapsOpen(){if(state.active){bump(state.active.id,'maps');emitNativeEvent('pc:maps',buildProposalPayload(state.active));}}
$('#maps-primary').addEventListener('click',onMapsOpen);
$('#maps-atlas').addEventListener('click',onMapsOpen);
$('#mobile-maps-primary').addEventListener('click',onMapsOpen);$('#history-button').addEventListener('click',history);$('#history-close').addEventListener('click',()=>$('#history-panel').classList.add('hidden'));$('#reset-button').addEventListener('click',()=>{localStorage.removeItem(STORAGE);localStorage.removeItem(HISTORY);toast('端末内の学習履歴を初期化しました');setTimeout(()=>location.reload(),500)});
$$('[data-toggle-panel]').forEach(button=>button.addEventListener('click',()=>{
  const key=button.dataset.togglePanel;
  const body=$(`[data-panel-body="${key}"]`);
  const collapsed=body.classList.toggle('mobile-collapsed');
  button.setAttribute('aria-expanded',String(!collapsed));
  button.querySelector('b').textContent=collapsed?'＋':'−';
}));
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
}
$('#release-count').textContent=`PROJECT CRUISE v0.12.3｜${D.length}地点・${R.length}結果を読込済み`;updatePool();
})();

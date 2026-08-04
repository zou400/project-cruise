(()=>{
'use strict';
const PATHS={
  manifest:'data/public-bundle-manifest.json',
  destinations:'data/destinations.public.json',
  routes:'data/routes.public.json',
  app:'app.js'
};
function flattenDestination(d){
  const o=d.operations||{};
  return {...d,id:d.entityId,parking:o.parking||'',hours:o.hours||'',caution:o.caution||'',roadsideAccess:o.roadsideAccess||'',recommendedArrival:o.recommendedArrival||''};
}
function flattenRoute(r){
  const o=r.operations||{};
  return {...r,id:r.entityId,candidateSource:r.role==='verified_route'?'canonical_route':'public_route',caution:o.caution||'',parkingMode:o.parkingMode||'',skipRule:o.skipRule||'',timeConditions:o.timeConditions||{},stopOperations:o.stopOperations||[]};
}
async function getJson(url){
  const response=await fetch(url,{cache:'no-cache'});
  if(!response.ok)throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}
function loadScript(url){
  return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.defer=true;s.onload=resolve;s.onerror=()=>reject(new Error(`script load failed: ${url}`));document.head.appendChild(s);});
}
function fail(error){
  console.error('[Project Cruise bootstrap]',error);
  document.documentElement.dataset.runtime='failed';
  const box=document.createElement('div');box.id='runtime-error';box.setAttribute('role','alert');box.textContent='公開データを読み込めませんでした。通信状態を確認して再読み込みしてください。';
  Object.assign(box.style,{position:'fixed',left:'16px',right:'16px',bottom:'16px',zIndex:'99999',padding:'14px 16px',background:'#1b1b1b',color:'#fff',border:'1px solid #555',borderRadius:'10px'});document.body.appendChild(box);
}
async function boot(){
  document.documentElement.dataset.runtime='loading';
  const [manifest,destinations,routes]=await Promise.all([getJson(PATHS.manifest),getJson(PATHS.destinations),getJson(PATHS.routes)]);
  if(!Array.isArray(destinations)||!Array.isArray(routes))throw new Error('public bundle shape invalid');
  window.PC_PUBLIC_MANIFEST=manifest;
  window.PC_DESTINATIONS=destinations.map(flattenDestination);
  window.PC_ROUTES=routes.map(flattenRoute);
  await loadScript(`${PATHS.app}?v=${encodeURIComponent(manifest.version||manifest.generatedAt||'public')}`);
  document.documentElement.dataset.runtime='ready';
  window.dispatchEvent(new CustomEvent('pc:runtime-ready',{detail:{destinations:destinations.length,routes:routes.length}}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>boot().catch(fail),{once:true});else boot().catch(fail);
})();

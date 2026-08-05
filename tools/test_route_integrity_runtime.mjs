import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const destinations=JSON.parse(fs.readFileSync(new URL('data/destinations.public.json',root),'utf8'));
const routes=JSON.parse(fs.readFileSync(new URL('data/routes.public.json',root),'utf8'));
const app=fs.readFileSync(new URL('app.js',root),'utf8');

class ClassList{
  constructor(){this.values=new Set()}
  add(...v){v.forEach(x=>this.values.add(x))}
  remove(...v){v.forEach(x=>this.values.delete(x))}
  contains(v){return this.values.has(v)}
  toggle(v,force){
    if(force===true){this.values.add(v);return true}
    if(force===false){this.values.delete(v);return false}
    if(this.values.has(v)){this.values.delete(v);return false}
    this.values.add(v);return true
  }
}
class Element{
  constructor(id,dataset={}){this.id=id;this.dataset={...dataset};this.classList=new ClassList();this.listeners={};this.textContent='';this.innerHTML='';this.href='';this.disabled=false;this.attributes={};this.children={b:{textContent:''}}}
  addEventListener(name,fn){(this.listeners[name]??=[]).push(fn)}
  click(){for(const fn of this.listeners.click||[])fn({currentTarget:this,target:this,preventDefault(){},stopPropagation(){}})}
  setAttribute(k,v){this.attributes[k]=String(v)}
  getAttribute(k){return this.attributes[k]}
  querySelector(s){return s==='b'?this.children.b:new Element('child')}
  scrollIntoView(){}
}
const ids=['hero-now','hero-departure','hero-arrival','hero-drive-minutes','atlas-route-shadow','atlas-route-line','atlas-route-dots','hero-image','hero-copy','destination-name','hero-tags','maps-primary','maps-atlas','mobile-maps-primary','route-role','detail-tags','route-title','route-intent','waypoint-list','fact-time','fact-stops','fact-score','caution-box','atlas-origin','atlas-destination','atlas-stops','mission','details','mobile-action-dock','desktop-reroll','pool-status','toast','history-list','history-panel','origin-note','launch-button','hero-reroll','sticky-reroll','history-button','history-close','reset-button','release-count'];
const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
const originButtons=[new Element('origin-current',{origin:'current'}),new Element('origin-kamata',{origin:'kamata'})];
const timeButtons=[new Element('time-90',{time:'90'}),new Element('time-120',{time:'120'}),new Element('time-half',{time:'half'})];
const toggleButtons=[];
const panelBodies={};
const document={
  querySelector(selector){
    if(selector.startsWith('#'))return elements[selector.slice(1)]||new Element(selector);
    const match=selector.match(/^\[data-panel-body="(.+)"\]$/);if(match)return panelBodies[match[1]]??=new Element(`panel-${match[1]}`);
    return new Element(selector);
  },
  querySelectorAll(selector){if(selector==='[data-origin]')return originButtons;if(selector==='[data-time]')return timeButtons;if(selector==='[data-toggle-panel]')return toggleButtons;return[]}
};
const memory=new Map();
const localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
class MockImage{set src(value){this._src=value;queueMicrotask(()=>this.onload?.())}get src(){return this._src}}
class MockCustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail}}
const events=[];
const window={PC_RELEASE:{version:'3.6.0'},PC_DESTINATIONS:destinations,PC_ROUTES:routes,PC_HERO_REGISTRY:{destinations:{}},addEventListener(){},dispatchEvent:e=>events.push(e)};
const context={window,document,localStorage,navigator:{},location:{reload(){}},Image:MockImage,CustomEvent:MockCustomEvent,console,Intl,URLSearchParams,Date,Math,Set,Object,String,Number,Array,JSON,Promise,setTimeout,clearTimeout,setInterval:()=>1,clearInterval(){},queueMicrotask};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(app,context,{filename:'app.js'});

const expectations={90:{min:70,max:100,stops:2},120:{min:100,max:140,stops:3},half:{min:180,max:300,stops:4}};
const results=[];
for(const bucket of ['90','120','half']){
  timeButtons.find(x=>x.dataset.time===bucket).click();
  await window.PC_RUNTIME.draw();
  await new Promise(r=>setTimeout(r,5));
  const snapshot=window.PC_RUNTIME.snapshot();
  const url=new URL(elements['maps-primary'].href);
  const origin=url.searchParams.get('origin');
  const destination=url.searchParams.get('destination');
  const waypoints=(url.searchParams.get('waypoints')||'').split('|').filter(Boolean);
  const expected=expectations[bucket];
  assert.equal(url.pathname,'/maps/dir/');
  assert.equal(origin,destination,'round-trip URL must return to origin');
  assert.ok(waypoints.length>=expected.stops,`${bucket}: insufficient route stops`);
  assert.ok(snapshot.totalMinutes>=expected.min&&snapshot.totalMinutes<=expected.max,`${bucket}: total out of range`);
  assert.equal(snapshot.integrity,'route_integrity_v1');
  assert.match(elements['hero-drive-minutes'].textContent,/帰着まで約/);
  assert.match(elements['caution-box'].textContent,/リアルタイム渋滞はGoogle Mapsで最終確認/);
  results.push({bucket,routeId:snapshot.routeId,destination:snapshot.destination,totalMinutes:snapshot.totalMinutes,waypointCount:waypoints.length});
  await new Promise(r=>setTimeout(r,430));
}
console.log(JSON.stringify({status:'PASS',results},null,2));

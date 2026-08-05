import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';

const root=new URL('../',import.meta.url);
const destinations=JSON.parse(fs.readFileSync(new URL('data/destinations.public.json',root),'utf8'));
const routes=JSON.parse(fs.readFileSync(new URL('data/routes.public.json',root),'utf8'));
const app=fs.readFileSync(new URL('app.js',root),'utf8');
const css=fs.readFileSync(new URL('styles.css',root),'utf8');

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
  constructor(id,dataset={}){
    this.id=id;this.dataset={...dataset};this.classList=new ClassList();this.listeners={};this.textContent='';this.innerHTML='';this.href='';this.disabled=false;this.attributes={};this.children={b:{textContent:''}};this.scrollCount=0;
  }
  addEventListener(name,fn){(this.listeners[name]??=[]).push(fn)}
  dispatch(name,event={}){
    const e={currentTarget:this,target:this,defaultPrevented:false,propagationStopped:false,preventDefault(){this.defaultPrevented=true},stopPropagation(){this.propagationStopped=true},...event};
    for(const fn of this.listeners[name]||[])fn(e);
    return e;
  }
  click(){return this.dispatch('click')}
  setAttribute(k,v){this.attributes[k]=String(v)}
  getAttribute(k){return this.attributes[k]}
  querySelector(s){return s==='b'?this.children.b:new Element('child')}
  scrollIntoView(){this.scrollCount++}
}
const ids=['hero-now','hero-departure','hero-arrival','hero-drive-minutes','atlas-route-shadow','atlas-route-line','atlas-route-dots','hero-image','hero-copy','destination-name','hero-tags','maps-primary','maps-atlas','mobile-maps-primary','route-role','detail-tags','route-title','route-intent','waypoint-list','fact-time','fact-stops','fact-score','caution-box','atlas-origin','atlas-destination','atlas-stops','mission','details','mobile-action-dock','desktop-reroll','pool-status','toast','history-list','history-panel','origin-note','launch-button','hero-reroll','sticky-reroll','history-button','history-close','reset-button','release-count'];
const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
const originButtons=[new Element('origin-current',{origin:'current'}),new Element('origin-kamata',{origin:'kamata'})];
const timeButtons=[new Element('time-90',{time:'90'}),new Element('time-120',{time:'120'}),new Element('time-half',{time:'half'})];
const document={
  querySelector(selector){
    if(selector.startsWith('#'))return elements[selector.slice(1)]||new Element(selector);
    const match=selector.match(/^\[data-panel-body="(.+)"\]$/);if(match)return new Element(`panel-${match[1]}`);
    return new Element(selector);
  },
  querySelectorAll(selector){if(selector==='[data-origin]')return originButtons;if(selector==='[data-time]')return timeButtons;if(selector==='[data-toggle-panel]')return[];return[]}
};
const memory=new Map();
const localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
class MockImage{
  constructor(){this.timer=null;this.onload=null;this.onerror=null;this._src=''}
  set src(value){
    if(this.timer)clearTimeout(this.timer);
    this._src=value;
    if(value)this.timer=setTimeout(()=>this.onload?.(),25);
  }
  get src(){return this._src}
}
class MockCustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail}}
const events=[];
const window={PC_RELEASE:{version:'3.6.0'},PC_DESTINATIONS:destinations,PC_ROUTES:routes,PC_HERO_REGISTRY:{destinations:{}},addEventListener(){},dispatchEvent:e=>events.push(e)};
const context={window,document,localStorage,navigator:{},location:{reload(){}},Image:MockImage,CustomEvent:MockCustomEvent,console,Intl,URLSearchParams,Date,Math,Set,Object,String,Number,Array,JSON,Promise,performance,setTimeout,clearTimeout,setInterval:()=>1,clearInterval(){},queueMicrotask};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(app,context,{filename:'app.js'});

await window.PC_RUNTIME.draw();
await new Promise(r=>setTimeout(r,100));
const first=window.PC_RUNTIME.snapshot();
assert.equal(first.hotfix,'reroll_v1_0_1');
assert.equal(elements.mission.scrollCount,1,'initial draw should scroll once');

const durations=[];
for(let i=0;i<30;i++){
  const started=performance.now();
  const ok=await window.PC_RUNTIME.reroll();
  durations.push(performance.now()-started);
  assert.equal(ok,true,`reroll ${i+1} should produce a route`);
}
await new Promise(r=>setTimeout(r,80));
const last=window.PC_RUNTIME.snapshot();

assert.equal(last.draws,31,'initial draw plus 30 rerolls expected');
assert.equal(last.performance.candidateRebuilds,1,'candidate integrity pool must be cached across rerolls');
assert.equal(elements.mission.scrollCount,1,'rerolls must not retrigger smooth scrolling');
assert.equal(elements['sticky-reroll'].disabled,false,'mobile reroll button must stay enabled to absorb taps');
assert.equal(elements['hero-reroll'].disabled,false,'hero reroll button must stay enabled to absorb taps');
assert.ok(last.performance.heroLoadsCancelled>=20,'in-flight hero requests should be cancelled during rapid rerolls');
assert.ok(Math.max(...durations)<100,`reroll runtime unexpectedly slow: ${Math.max(...durations).toFixed(2)}ms`);

const firstTouch=elements['sticky-reroll'].dispatch('touchend',{touches:[],changedTouches:[{}]});
const secondTouch=elements['sticky-reroll'].dispatch('touchend',{touches:[],changedTouches:[{}]});
assert.equal(firstTouch.defaultPrevented,false,'first tap must remain a normal tap');
assert.equal(secondTouch.defaultPrevented,true,'second rapid tap must suppress double-tap zoom');
await new Promise(r=>setTimeout(r,5));
assert.equal(window.PC_RUNTIME.snapshot().draws,32,'second rapid tap should still request another Cruise');
const pinchLike=elements['sticky-reroll'].dispatch('touchend',{touches:[{}],changedTouches:[{}]});
assert.equal(pinchLike.defaultPrevented,false,'multi-touch/pinch flow must not be blocked');

assert.match(css,/touch-action\s*:\s*manipulation/);
assert.match(css,/z-index\s*:\s*2147483000/);

console.log(JSON.stringify({
  status:'PASS',
  rerolls:30,
  candidateRebuilds:last.performance.candidateRebuilds,
  heroLoadsCancelled:last.performance.heroLoadsCancelled,
  scrollCount:elements.mission.scrollCount,
  maxRerollMs:Number(Math.max(...durations).toFixed(2))
},null,2));

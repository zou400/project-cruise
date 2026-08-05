import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const destinations=JSON.parse(fs.readFileSync(new URL('data/destinations.public.json',root),'utf8'));
const routes=JSON.parse(fs.readFileSync(new URL('data/routes.public.json',root),'utf8'));
const app=fs.readFileSync(new URL('app.js',root),'utf8');
const index=fs.readFileSync(new URL('index.html',root),'utf8');
const css=fs.readFileSync(new URL('decision-ui.css',root),'utf8');

assert.match(index,/data-drive-style="auto"/);
assert.match(index,/data-drive-style="local"/);
assert.match(index,/data-drive-style="highway"/);
assert.match(index,/id="decision-reasons"/);
assert.match(index,/Google Mapsで出発する/);
assert.match(css,/\.decision-summary/);

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
    this.id=id;this.dataset={...dataset};this.classList=new ClassList();
    this.listeners={};this.textContent='';this.innerHTML='';this.href='';
    this.disabled=false;this.attributes={};this.children={b:{textContent:''}};
  }
  addEventListener(name,fn){(this.listeners[name]??=[]).push(fn)}
  click(){for(const fn of this.listeners.click||[])fn({currentTarget:this,target:this,preventDefault(){},stopPropagation(){}})}
  setAttribute(k,v){this.attributes[k]=String(v)}
  getAttribute(k){return this.attributes[k]}
  querySelector(s){return s==='b'?this.children.b:new Element('child')}
  scrollIntoView(){}
}
const ids=[
  'hero-now','hero-departure','hero-arrival','hero-drive-minutes',
  'atlas-route-shadow','atlas-route-line','atlas-route-dots','hero-image',
  'hero-copy','destination-name','hero-tags','maps-primary','maps-atlas',
  'mobile-maps-primary','route-role','detail-tags','route-title','route-intent',
  'waypoint-list','fact-time','fact-stops','fact-score','caution-box',
  'atlas-origin','atlas-destination','atlas-stops','mission','details',
  'mobile-action-dock','desktop-reroll','pool-status','toast','history-list',
  'history-panel','origin-note','launch-button','hero-reroll','sticky-reroll',
  'history-button','history-close','reset-button','release-count',
  'drive-style-note','decision-time','decision-waypoints','decision-style',
  'decision-toll','decision-reasons','decision-highway-note','decision-confidence'
];
const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
const originButtons=[new Element('origin-current',{origin:'current'}),new Element('origin-kamata',{origin:'kamata'})];
const timeButtons=[new Element('time-90',{time:'90'}),new Element('time-120',{time:'120'}),new Element('time-half',{time:'half'})];
const styleButtons=[
  new Element('style-auto',{driveStyle:'auto'}),
  new Element('style-local',{driveStyle:'local'}),
  new Element('style-highway',{driveStyle:'highway'})
];
styleButtons[0].classList.add('active');
const panelBodies={};
const document={
  querySelector(selector){
    if(selector.startsWith('#'))return elements[selector.slice(1)]||new Element(selector);
    const match=selector.match(/^\[data-panel-body="(.+)"\]$/);
    if(match)return panelBodies[match[1]]??=new Element(`panel-${match[1]}`);
    return new Element(selector);
  },
  querySelectorAll(selector){
    if(selector==='[data-origin]')return originButtons;
    if(selector==='[data-time]')return timeButtons;
    if(selector==='[data-drive-style]')return styleButtons;
    if(selector==='[data-toggle-panel]')return[];
    return[];
  }
};
const memory=new Map();
const localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
class MockImage{set src(value){this._src=value;queueMicrotask(()=>this.onload?.())}get src(){return this._src}}
class MockCustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail}}
const events=[];
const window={
  PC_RELEASE:{version:'3.6.0'},
  PC_DESTINATIONS:destinations,
  PC_ROUTES:routes,
  PC_HERO_REGISTRY:{destinations:{}},
  addEventListener(){},
  dispatchEvent:e=>events.push(e)
};
const context={
  window,document,localStorage,navigator:{},location:{reload(){}},
  Image:MockImage,CustomEvent:MockCustomEvent,console,Intl,URLSearchParams,
  Date,Math,Set,Object,String,Number,Array,JSON,Promise,
  setTimeout,clearTimeout,setInterval:()=>1,clearInterval(){},queueMicrotask
};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(app,context,{filename:'app.js'});

const expectedLabels={auto:'おまかせ',local:'下道の景色',highway:'高速の流れ'};
const results=[];
for(const style of Object.keys(expectedLabels)){
  styleButtons.find(x=>x.dataset.driveStyle===style).click();
  await window.PC_RUNTIME.draw();
  await new Promise(r=>setTimeout(r,8));
  const snapshot=window.PC_RUNTIME.snapshot();
  const url=new URL(elements['maps-primary'].href);
  assert.equal(snapshot.driveStyle,style);
  assert.equal(snapshot.decisionUi,'decision_ui_v1');
  assert.equal(elements['decision-style'].textContent,expectedLabels[style]);
  assert.match(elements['decision-time'].textContent,/約\d+分/);
  assert.match(elements['decision-waypoints'].textContent,/\d+経由/);
  assert.ok(elements['decision-toll'].textContent.length>0);
  assert.match(elements['decision-reasons'].innerHTML,/<li>/);
  assert.doesNotMatch(elements['atlas-destination'].textContent,/帰着/);
  assert.notEqual(url.searchParams.get('origin'),url.searchParams.get('destination'));
  assert.equal(url.searchParams.get('destination')?.length>0,true);
  results.push({
    style,
    destination:snapshot.destination,
    totalMinutes:snapshot.totalMinutes,
    toll:elements['decision-toll'].textContent,
    match:elements['decision-confidence'].textContent
  });
  await new Promise(r=>setTimeout(r,430));
}
console.log(JSON.stringify({status:'PASS',decisionUi:'decision_ui_v1',results},null,2));

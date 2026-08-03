(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ProjectCruiseHardeningMerge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const rank={V0:0,V1:1,V2:2,V3:3};
  const level=x=>String(x||'V0').match(/^V[0-3]/)?.[0]||'V0';
  function mergeOverlays(...overlays){
    const map=new Map();
    for(const overlay of overlays.flat()){
      for(const item of overlay?.routes||[]){
        const key=item.routePackId;
        const prior=map.get(key);
        if(!prior){map.set(key,item);continue;}
        // Later batch may tighten rules, never silently raise evidence level.
        const priorLevel=level(prior.vehicleFit?.level);
        const nextLevel=level(item.vehicleFit?.level);
        if(rank[nextLevel]>rank[priorLevel]&&!item.promotionEvidence){
          throw new Error(`UNSUPPORTED_VEHICLE_PROMOTION:${key}:${priorLevel}->${nextLevel}`);
        }
        map.set(key,Object.assign({},prior,item,{hardReject:[...new Set([...(prior.hardReject||[]),...(item.hardReject||[])])]}));
      }
    }
    return {schemaVersion:'0.37',routes:[...map.values()]};
  }
  function routeGate(context,patch,mode){
    if((patch.notSelectableModes||[]).includes(mode))return 'HARDENING_NOT_ENFORCEABLE';
    const width=Number(context.vehicle?.widthM||0);
    if(patch.legacyRouteId==='R006'&&width>=1.9)return 'DESTINATION_WIDTH_REJECT';
    if(patch.legacyRouteId==='R007'&&width>1.9)return 'OSANBASHI_WIDTH_REJECT';
    if(patch.legacyRouteId==='R009'&&context.nowLocalHHMM>'19:00')return 'FULL_ROUTE_TOO_LATE';
    if(patch.legacyRouteId==='R010'&&context.nowLocalHHMM>'17:15')return 'FULL_ROUTE_TOO_LATE';
    if(context.weather==='severe')return 'SEVERE_WEATHER';
    return null;
  }
  return {mergeOverlays,routeGate,level};
});
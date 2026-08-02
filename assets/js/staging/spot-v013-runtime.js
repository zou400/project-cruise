/* Spot Chat v0.13 staging loader. New candidates remain staging-only. */
(() => {
  "use strict";
  const params=new URLSearchParams(location.search);
  const base="data/staging/spot-chat-v0.13/";
  const files=["new-destination-candidates-batch2.v0.13.json","category-balance-policy.v0.13.json","wide-vehicle-compatibility-batch2.v0.13.json","staging-promotion-plan.v0.13.json","exploration-roadmap-to-public-implementation.v0.13.json","acceptance-tests.v0.13.json"];
  const state={version:"0.13",breadthEnabled:params.get("pcBreadth")!=="off",newDestinationsMode:params.get("pcNewDestinations")||"off",loaded:false,data:{}};
  window.ProjectCruiseSpotV013=state;
  Promise.all(files.map(async name=>{const r=await fetch(base+name,{cache:"no-store"});if(!r.ok)throw new Error(name);state.data[name]=await r.json();}))
    .then(()=>{state.loaded=true;document.dispatchEvent(new CustomEvent("pc:spot-v013-ready",{detail:state}));if(state.newDestinationsMode==="preview")showBadge();})
    .catch(error=>{state.error=String(error);console.warn("Spot v0.13 staging load failed",error);});
  function showBadge(){
    const a=document.createElement("a");a.href="spot-staging-v013.html";a.textContent="SPOT v0.13 STAGING / 22";a.setAttribute("aria-label","スポット探索v0.13のステージング候補を開く");
    Object.assign(a.style,{position:"fixed",right:"12px",top:"12px",zIndex:"9999",padding:"9px 12px",border:"1px solid rgba(236,141,55,.65)",borderRadius:"999px",background:"rgba(12,10,14,.88)",color:"#f0a45f",font:"700 11px/1.2 system-ui",textDecoration:"none",letterSpacing:".08em"});document.body.append(a);
  }
})();

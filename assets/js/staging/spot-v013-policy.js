/* Project Cruise Spot Chat v0.13 staging policy */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.ProjectCruiseSpotV013Policy=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const LANE_WEIGHTS={quality:.35,discovery:.25,breadth:.20,categoryRotation:.15,wildcard:.05};
  const DISTINCTIVE=/建築|港湾|産業|自動車|市場|温浴|体験|展示|夜景|工場|博物館|美術館|科学|空港|ターミナル/;
  const COMMERCIAL=/商業|ショッピング|モール|アウトレット|買い物|複合施設/;
  const INDOOR=/雨天|屋内|博物館|美術館|科学館|温浴|映画|市場|空港|ターミナル|ギャラリー|展示/;
  function laneFromRoll(roll,enabled=true){
    const r=Math.max(0,Math.min(.999999,Number(roll)||0));
    if(!enabled)return r<.52?"quality":r<.90?"discovery":"wildcard";
    if(r<.35)return"quality"; if(r<.60)return"discovery"; if(r<.80)return"breadth"; if(r<.95)return"categoryRotation"; return"wildcard";
  }
  function candidateText(c){return [c?.name,c?.primaryCategory,...(c?.secondaryCategories||[]),c?.experience,c?.condition].filter(Boolean).join(" ");}
  function isGenericCommercial(c){const t=candidateText(c);return COMMERCIAL.test(t)&&!DISTINCTIVE.test(t);}
  function rainMultiplier(c,rainMode){if(!rainMode)return 1;return INDOOR.test(candidateText(c))?1.7:.35;}
  function categoryPenalty(category,recent=[]){const last5=recent.slice(-5),count=last5.filter(x=>x===category).length;return count>=2?.08:count===1?.72:1.25;}
  function commercialPenalty(c,recent=[]){if(!isGenericCommercial(c))return 1;const count=recent.slice(-5).filter(x=>COMMERCIAL.test(String(x))).length;return count>=1?.12:1;}
  function vehicleResult(c,widthM=2.05,weightT=null){
    const lim=c?.parking?.limits||{};
    if(Number.isFinite(lim.widthM)&&widthM>lim.widthM)return"excluded_vehicle_width";
    if(Number.isFinite(lim.weightT)&&Number.isFinite(weightT)&&weightT>lim.weightT)return"select_compatible_anchor_or_exclude";
    if(String(c?.wideVehicleStatus||"").includes("pending")||String(c?.wideVehicleStatus||"").includes("required"))return"verification_required";
    return"eligible_if_other_dimensions_ok";
  }
  function evaluate(c,ctx={}){
    if(ctx.pcBreadth===false&&ctx.pcNewDestinations===false)return"existing_RC_selection_unchanged";
    const id=c?.candidateId,day=ctx.dayOfWeek,time=ctx.time||"",date=ctx.date||"";
    if(id==="N035"&&date>="2026-10-01"&&date<="2027-04-22")return"excluded_long_term_closure";
    if(id==="N036"&&ctx.eventRestriction)return"dynamic_exclude_or_alternate";
    if(id==="N037"&&!ctx.eventActive)return"event_lane_not_selected";
    if(id==="N032"&&!ctx.reservation)return"not_selected";
    if(id==="N032"&&ctx.driver)return"alcohol_tasting_warning";
    if(id==="N033"&&!ctx.legalParkingAnchor)return"not_selected";
    if(id==="N017"&&ctx.rain&&time==="19:00")return day==="Fri"?"intermediatheque_open_only_if_fri_or_other_applicable_schedule":"excluded_closed";
    if(id==="N018"&&day==="Mon")return"excluded_closed";
    if(id==="N019"&&!ctx.legalParkingAnchor)return"not_promoted";
    if(id==="N020"&&time>="21:00")return"parking_only_or_other_open_services_not_store_experience";
    if(id==="N025"&&ctx.restaurantOnly)return"onsite_parking_not_allowed";
    const vr=vehicleResult(c,Number(ctx.vehicleWidthM||2.05),ctx.vehicleWeightT==null?null:Number(ctx.vehicleWeightT));
    if(vr==="excluded_vehicle_width")return vr;
    if(id==="N022"&&vr==="select_compatible_anchor_or_exclude")return vr;
    return vr;
  }
  return{LANE_WEIGHTS,laneFromRoll,isGenericCommercial,rainMultiplier,categoryPenalty,commercialPenalty,vehicleResult,evaluate};
});

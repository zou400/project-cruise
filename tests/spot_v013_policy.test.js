const assert=require('assert');const fs=require('fs');const path=require('path');const P=require('../assets/js/staging/spot-v013-policy.js');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/staging/spot-chat-v0.13/new-destination-candidates-batch2.v0.13.json'),'utf8'));const byId=new Map(data.candidates.map(x=>[x.candidateId,x]));
const cases=[
['T01',()=>P.evaluate(byId.get('N016'),{vehicleWidthM:2.05}),'excluded_vehicle_width'],
['T02',()=>P.evaluate(byId.get('N021'),{vehicleWidthM:2.05}),'eligible_if_other_dimensions_ok'],
['T03',()=>P.evaluate(byId.get('N026'),{vehicleWidthM:2.05}),'excluded_vehicle_width'],
['T04',()=>P.evaluate(byId.get('N017'),{rain:true,time:'19:00',dayOfWeek:'Fri'}),'intermediatheque_open_only_if_fri_or_other_applicable_schedule'],
['T05',()=>P.evaluate(byId.get('N018'),{dayOfWeek:'Mon'}),'excluded_closed'],
['T06',()=>P.evaluate(byId.get('N019'),{legalParkingAnchor:false}),'not_promoted'],
['T07',()=>P.evaluate(byId.get('N020'),{time:'21:30'}),'parking_only_or_other_open_services_not_store_experience'],
['T08',()=>P.evaluate(byId.get('N022'),{vehicleWidthM:2.05,vehicleWeightT:2.1}),'select_compatible_anchor_or_exclude'],
['T09',()=>P.evaluate(byId.get('N025'),{restaurantOnly:true}),'onsite_parking_not_allowed'],
['T10',()=>P.evaluate(byId.get('N035'),{date:'2026-10-15'}),'excluded_long_term_closure'],
['T11',()=>P.evaluate(byId.get('N036'),{eventRestriction:true}),'dynamic_exclude_or_alternate'],
['T12',()=>P.evaluate(byId.get('N037'),{eventActive:false}),'event_lane_not_selected'],
['T13',()=>P.evaluate(byId.get('N032'),{reservation:false}),'not_selected'],
['T14',()=>P.evaluate(byId.get('N032'),{reservation:true,driver:true}),'alcohol_tasting_warning'],
['T15',()=>P.evaluate(byId.get('N033'),{legalParkingAnchor:false}),'not_selected'],
['T16',()=>P.commercialPenalty({name:'一般商業モール',primaryCategory:'食',secondaryCategories:[]},['食','商業施設']),.12],
['T17',()=>P.rainMultiplier(byId.get('N029'),true),1.7],
['T18',()=>P.evaluate(byId.get('N021'),{pcBreadth:false,pcNewDestinations:false}),'existing_RC_selection_unchanged']];
for(const [id,fn,expected] of cases){assert.deepStrictEqual(fn(),expected,id)}
assert.strictEqual(P.laneFromRoll(.10,true),'quality');assert.strictEqual(P.laneFromRoll(.50,true),'discovery');assert.strictEqual(P.laneFromRoll(.70,true),'breadth');assert.strictEqual(P.laneFromRoll(.90,true),'categoryRotation');assert.strictEqual(P.laneFromRoll(.98,true),'wildcard');
console.log(JSON.stringify({status:'PASS',tests:cases.length,stagedCandidates:data.candidates.length},null,2));
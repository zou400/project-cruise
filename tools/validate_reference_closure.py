#!/usr/bin/env python3
from pathlib import Path
import argparse,json,sys

def load(p): return json.loads(Path(p).read_text(encoding="utf-8"))
def main():
 ap=argparse.ArgumentParser(); ap.add_argument('--public-root',required=True); ap.add_argument('--report',required=True); a=ap.parse_args()
 root=Path(a.public_root); d=load(root/'data/destinations.public.json'); r=load(root/'data/routes.public.json'); reg=load(root/'data/reference-registry.public.json')
 names={x['name'] for x in d}; ids={x['referenceId'] for x in reg['references']}; issues=[]; resolved=0
 for route in r:
  wp={(x.get('position'),x.get('nameSnapshot')):x for x in route.get('waypointRefs',[])}
  for i,n in enumerate(route.get('waypoints') or []):
   if n not in names:
    x=wp.get((i,n));
    if not x: issues.append({'type':'missing_waypoint_ref','route':route.get('entityId'),'position':i,'name':n})
    elif x.get('referenceId') not in ids: issues.append({'type':'unknown_reference_id','route':route.get('entityId'),'referenceId':x.get('referenceId')})
    else: resolved+=1
  n=route.get('destination')
  if n and n not in names:
   xs=[x for x in route.get('destinationRefs',[]) if x.get('nameSnapshot')==n]
   if not xs: issues.append({'type':'missing_destination_ref','route':route.get('entityId'),'name':n})
   elif xs[0].get('referenceId') not in ids: issues.append({'type':'unknown_reference_id','route':route.get('entityId'),'referenceId':xs[0].get('referenceId')})
   else: resolved+=1
 result={'status':'PASS' if not issues else 'FAIL','issues':issues,'metrics':{'resolvedLegacyReferences':resolved,'registryEntries':len(ids)}}
 Path(a.report).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); print(json.dumps(result,ensure_ascii=False,indent=2)); return 0 if result['status']=='PASS' else 1
if __name__=='__main__': sys.exit(main())

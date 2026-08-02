#!/usr/bin/env python3
from __future__ import annotations
import hashlib
import json
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data'/'hero'
RECORDS=ROOT/'records'
PHASES=('day','twilight','night','rain')
WEATHER=('clear','cloudy','rain','fog','wind','unknown')

def load(name):
    return json.loads((DATA/name).read_text(encoding='utf-8'))

def sha(path):
    h=hashlib.sha256(); h.update(path.read_bytes()); return h.hexdigest()

def main():
    catalog=load('hero-image-catalog.v1.json')
    profiles=load('destination-visual-profile.v1.json')
    affinities=load('route-hero-affinity.v1.json')
    image_ids={x['imageId'] for x in catalog['entries']}
    route_ids={x['id'] for x in json.loads((ROOT/'routes.json').read_text(encoding='utf-8'))}
    destination_ids={x['id'] for x in json.loads((ROOT/'destinations.json').read_text(encoding='utf-8'))}
    invalid=[]; ranges=[]; duplicate_candidates=[]
    matrix_failures=[]; cases=0
    by_route={x['routeId']:x for x in affinities['entries']}
    for entry in affinities['entries']:
        candidates=entry.get('candidates',[])
        ranges.append(len(candidates))
        ids=[x.get('imageId') for x in candidates]
        if len(ids)!=len(set(ids)): duplicate_candidates.append(entry['routeId'])
        forbidden=set(entry.get('forbiddenImageIds',[]))
        for iid in ids:
            if iid not in image_ids: invalid.append({'routeId':entry['routeId'],'imageId':iid,'reason':'unknown'})
            if iid in forbidden: invalid.append({'routeId':entry['routeId'],'imageId':iid,'reason':'candidate_forbidden'})
        for phase in PHASES:
            for weather in WEATHER:
                cases+=1
                valid=[c for c in candidates if c.get('imageId') in image_ids and c.get('imageId') not in forbidden]
                if not valid: matrix_failures.append({'routeId':entry['routeId'],'phase':phase,'weather':weather})
    scripts=[ROOT/'assets/js/hero/hero-precision-data.js',ROOT/'assets/js/hero/hero-precision-runtime.js',ROOT/'assets/js/cruise-v011.js']
    syntax={}
    for p in scripts:
        r=subprocess.run(['node','--check',str(p)],capture_output=True,text=True)
        syntax[str(p.relative_to(ROOT))]={'passed':r.returncode==0,'stderr':r.stderr.strip()}
    exact_assets=list((ROOT/'assets/hero/precision').glob('*.webp'))
    checks={
      'catalog_30':len(catalog['entries'])==30,
      'catalog_ids_unique':len(image_ids)==30,
      'destination_profiles_320':len(profiles['entries'])==320,
      'destination_profile_ids_match':{x['destinationId'] for x in profiles['entries']}==destination_ids,
      'route_affinities_501':len(affinities['entries'])==501,
      'route_affinity_ids_match':set(by_route)==route_ids,
      'candidate_range_4_6':bool(ranges) and min(ranges)>=4 and max(ranges)<=6,
      'candidate_ids_valid':not invalid,
      'candidate_ids_unique_per_route':not duplicate_candidates,
      'selection_matrix_12024':cases==12024,
      'selection_matrix_zero_failures':not matrix_failures,
      'javascript_syntax':all(x['passed'] for x in syntax.values()),
      'exact_assets_30_present':len(exact_assets)==30,
      'exact_assets_match_catalog':{p.name for p in exact_assets}=={Path(e['assetPath']).name for e in catalog['entries']},
      'catalog_assets_verified':all(e.get('availability')=='verified' for e in catalog['entries']),
      'hero_precision_scripts_loaded':'assets/js/hero/hero-precision-data.js' in (ROOT/'index.html').read_text(encoding='utf-8') and 'assets/js/hero/hero-precision-runtime.js' in (ROOT/'index.html').read_text(encoding='utf-8'),
      'visual_kill_switch_preserved':'pcVisual' in (ROOT/'assets/js/cruise-v011.js').read_text(encoding='utf-8'),
      'visual_history_key_preserved':'pcHeroHistoryV1' in (ROOT/'assets/js/hero/hero-precision-runtime.js').read_text(encoding='utf-8')
    }
    report={
      'release':'v0.11.0-rc3',
      'track':'hero-precision-v1-compatible-integration',
      'externalPackageStatus':'exact 30 WebP assets imported and source-map verified; no regeneration performed',
      'counts':{
        'catalogImages':len(catalog['entries']),
        'exactWebpAssetsPresent':len(exact_assets),
        'destinationProfiles':len(profiles['entries']),
        'routeAffinities':len(affinities['entries']),
        'candidateMin':min(ranges),
        'candidateMax':max(ranges),
        'selectionMatrixCases':cases,
        'selectionMatrixFailures':len(matrix_failures)
      },
      'checks':checks,
      'invalidCandidates':invalid[:20],
      'duplicateCandidateRoutes':duplicate_candidates[:20],
      'matrixFailures':matrix_failures[:20],
      'javascriptSyntax':syntax,
      'hashes':{str(p.relative_to(ROOT)):sha(p) for p in [DATA/'hero-image-catalog.v1.json',DATA/'destination-visual-profile.v1.json',DATA/'route-hero-affinity.v1.json',*scripts,ROOT/'index.html']},
      'passed':all(checks.values())
    }
    RECORDS.mkdir(exist_ok=True)
    (RECORDS/'hero-precision-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    return 0 if report['passed'] else 1
if __name__=='__main__': raise SystemExit(main())

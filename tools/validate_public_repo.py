#!/usr/bin/env python3
from pathlib import Path
import argparse, json, hashlib, subprocess, shutil, re, sys

REQUIRED = [
    'index.html','bootstrap.js','app.js','styles.css','hero-registry.js',
    'service-worker.js','release.js','manifest.webmanifest',
    'data/destinations.public.json','data/routes.public.json',
    'data/public-bundle-manifest.json','data/hero-assets.public.json','data/reference-registry.public.json','data/release-attestation.json'
]
FORBIDDEN_PATH_PARTS = {
    'canonical','discovery','review','audit','field-tests','field_test','prompts','prompt',
    'negative-prompt','negative_prompt','generation-history','generation_history','rejected',
    'experimental','contact-sheet','contact_sheet','source-image','source_image',
    'private-canonical','private_release','registries','phase1','phase2','phase3','phase4',
    'phase5','phase6','phase7','phase8','phase9','phase10','phase11','phase12'
}
FORBIDDEN_JSON_KEYS = {
    'candidateSource','candidateScope','verificationStatus','routeQualityV2',
    'canonicalStatus','publicationStatus','checkedAt','checkedDate','officialSources',
    'editorialDecision','internalScore','reviewNotes','legacyIds','supersedes'
}
SECRET_PATTERNS = [
    ('github_token', re.compile(r'gh[pousr]_[A-Za-z0-9_]{20,}')),
    ('openai_key', re.compile(r'sk-[A-Za-z0-9_-]{20,}')),
    ('google_api_key', re.compile(r'AIza[0-9A-Za-z_-]{30,}')),
    ('stripe_secret', re.compile(r'sk_(?:live|test)_[0-9A-Za-z]{16,}')),
    ('private_key', re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')),
]
TEXT_EXTS={'.html','.js','.json','.css','.md','.txt','.xml','.webmanifest','.yml','.yaml'}

def walk_keys(obj,path='$'):
    if isinstance(obj,dict):
        for k,v in obj.items():
            yield k,f'{path}.{k}'
            yield from walk_keys(v,f'{path}.{k}')
    elif isinstance(obj,list):
        for i,v in enumerate(obj): yield from walk_keys(v,f'{path}[{i}]')

def load_json(path):
    with path.open(encoding='utf-8') as f: return json.load(f)

def validate(root:Path):
    issues=[]; warnings=[]; metrics={}
    root=root.resolve()
    for rel in REQUIRED:
        if not (root/rel).is_file(): issues.append({'type':'missing_required','path':rel})
    for p in root.rglob('*'):
        if not p.is_file(): continue
        rel=p.relative_to(root).as_posix()
        low=rel.lower()
        # CI config and validator are allowed; data/runtime paths are strictly checked.
        if not low.startswith('.github/') and not low.startswith('tools/') and not low.startswith('docs/'):
            parts=set(re.split(r'[/._-]+',low))
            hit=sorted(FORBIDDEN_PATH_PARTS & parts)
            if hit: issues.append({'type':'forbidden_path','path':rel,'matched':hit})
        if p.suffix.lower() in TEXT_EXTS and p.stat().st_size <= 20_000_000:
            text=p.read_text(encoding='utf-8',errors='ignore')
            for name,pat in SECRET_PATTERNS:
                if pat.search(text): issues.append({'type':'secret_pattern','path':rel,'pattern':name})
    try:
        dests=load_json(root/'data/destinations.public.json')
        routes=load_json(root/'data/routes.public.json')
        heroes=load_json(root/'data/hero-assets.public.json')
        metrics.update(destinations=len(dests),routes=len(routes),heroDestinations=len(heroes.get('published',[])))
        for label,obj in [('destinations',dests),('routes',routes),('heroes',heroes)]:
            bad=[{'key':k,'path':path} for k,path in walk_keys(obj) if k in FORBIDDEN_JSON_KEYS]
            if bad: issues.append({'type':'forbidden_json_keys','dataset':label,'matches':bad[:30]})
        names={d.get('name') for d in dests}
        refreg=load_json(root/'data/reference-registry.public.json')
        refids={x.get('referenceId') for x in refreg.get('references',[])}
        unresolved=[]; resolved_refs=0
        for r in routes:
            rid=r.get('entityId') or r.get('id') or r.get('title')
            wprefs={(x.get('position'),x.get('nameSnapshot')):x for x in r.get('waypointRefs',[])}
            for i,name in enumerate(r.get('waypoints') or []):
                if name and name not in names:
                    x=wprefs.get((i,name))
                    if not x or x.get('referenceId') not in refids: unresolved.append({'route':rid,'role':'waypoint','position':i,'name':name})
                    else: resolved_refs+=1
            name=r.get('destination')
            if name and name not in names:
                xs=[x for x in r.get('destinationRefs',[]) if x.get('nameSnapshot')==name]
                if not xs or xs[0].get('referenceId') not in refids: unresolved.append({'route':rid,'role':'destination','name':name})
                else: resolved_refs+=1
        metrics['displayOnlyUnresolvedReferences']=len(unresolved)
        metrics['stableReferenceResolutions']=resolved_refs
        metrics['referenceRegistryEntries']=len(refids)
        if unresolved: issues.append({'type':'unresolved_route_references','count':len(unresolved),'sample':unresolved[:20]})
        referenced={v['path'] for item in heroes.get('published',[]) for v in item.get('variants',[]) if v.get('path')}
        hero_dir=root/'assets/heroes'
        actual={p.relative_to(root).as_posix() for p in hero_dir.rglob('*') if p.is_file()} if hero_dir.exists() else set()
        missing=sorted(referenced-actual); extra=sorted(actual-referenced)
        if missing: issues.append({'type':'missing_hero_assets','paths':missing[:30]})
        if extra: issues.append({'type':'unreferenced_hero_assets','paths':extra[:30]})
        metrics['heroAssetFiles']=len(actual)

        manifest=load_json(root/'data/public-bundle-manifest.json')
        attest=load_json(root/'data/release-attestation.json')
        expected=manifest.get('counts',{})
        if expected.get('destinations')!=len(dests) or expected.get('routes')!=len(routes):
            issues.append({'type':'manifest_count_mismatch','expected':expected,'actual':{'destinations':len(dests),'routes':len(routes)}})
        if attest.get('releaseId')!=manifest.get('releaseId'):
            issues.append({'type':'release_id_mismatch','manifest':manifest.get('releaseId'),'attestation':attest.get('releaseId')})
        normalized=lambda obj:(json.dumps(obj,ensure_ascii=False,separators=(',',':'),sort_keys=True)+'\n').encode()
        hh=hashlib.sha256(); hh.update(normalized(dests)); hh.update(normalized(routes)); hh.update((root/'data/hero-assets.public.json').read_bytes()); hh.update((root/'data/reference-registry.public.json').read_bytes())
        if attest.get('publicContentSha256')!=hh.hexdigest():
            issues.append({'type':'public_content_hash_mismatch','expected':attest.get('publicContentSha256'),'actual':hh.hexdigest()})
    except Exception as e:
        issues.append({'type':'json_validation_error','message':str(e)})
    node=shutil.which('node')
    if node:
        for p in root.rglob('*.js'):
            if '.github' in p.parts: continue
            cp=subprocess.run([node,'--check',str(p)],capture_output=True,text=True)
            if cp.returncode: issues.append({'type':'js_syntax','path':p.relative_to(root).as_posix(),'message':cp.stderr.strip()})
    else: warnings.append({'type':'node_unavailable'})
    combined='\n'.join((root/p).read_text(encoding='utf-8',errors='ignore') for p in ['index.html','service-worker.js'] if (root/p).exists())
    if 'data.js' in combined: issues.append({'type':'legacy_dependency','value':'data.js'})
    return {'status':'PASS' if not issues else 'FAIL','issues':issues,'warnings':warnings,'metrics':metrics}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--root',default='.')
    ap.add_argument('--report',default='validation-report.json')
    args=ap.parse_args()
    result=validate(Path(args.root))
    Path(args.report).write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))
    return 0 if result['status']=='PASS' else 1
if __name__=='__main__': raise SystemExit(main())

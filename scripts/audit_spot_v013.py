import json,re,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]; base=root/'data/staging/spot-chat-v0.13'
files=['new-destination-candidates-batch2.v0.13.json','category-balance-policy.v0.13.json','wide-vehicle-compatibility-batch2.v0.13.json','staging-promotion-plan.v0.13.json','exploration-roadmap-to-public-implementation.v0.13.json','acceptance-tests.v0.13.json']
assert all((base/f).exists() for f in files)
c=json.loads((base/files[0]).read_text(encoding='utf-8')); assert len(c['candidates'])==22
a=json.loads((base/files[-1]).read_text(encoding='utf-8')); assert len(a['tests'])==18
idx=(root/'index.html').read_text(encoding='utf-8'); assert 'pcBreadth' in idx and 'categoryRotation' in idx
d=json.loads((root/'destinations.json').read_text(encoding='utf-8')); r=json.loads((root/'routes.json').read_text(encoding='utf-8')); completed=sum(1 for x in r if x.get('candidateSource')=='canonical_route'); assert len(d)==320 and len(r)==501 and completed==181
print(json.dumps({'status':'PASS','stagedCandidates':22,'tests':18,'canonicalDestinations':320,'canonicalRoutes':181,'selectableResults':501},ensure_ascii=False,indent=2))

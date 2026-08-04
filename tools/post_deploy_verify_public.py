#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, urllib.request
from pathlib import Path

def fetch_json(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        if r.status != 200: raise RuntimeError(f"HTTP {r.status}: {url}")
        return json.loads(r.read().decode("utf-8"))

def normalized(obj): return (json.dumps(obj,ensure_ascii=False,separators=(",",":"),sort_keys=True)+"\n").encode()

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--base-url",required=True); ap.add_argument("--expected",default="data/release-attestation.json"); ap.add_argument("--output",default="post-deploy-verification.json"); a=ap.parse_args()
    base=a.base_url.rstrip("/")+"/"; expected=json.loads(Path(a.expected).read_text(encoding="utf-8")); issues=[]
    remote=fetch_json(base+"data/release-attestation.json"); dests=fetch_json(base+"data/destinations.public.json"); routes=fetch_json(base+"data/routes.public.json")
    heroes=urllib.request.urlopen(base+"data/hero-assets.public.json",timeout=30).read(); refs=urllib.request.urlopen(base+"data/reference-registry.public.json",timeout=30).read()
    if remote.get("releaseId")!=expected.get("releaseId"): issues.append("release ID mismatch")
    if remote.get("canonicalBaseSha256")!=expected.get("canonicalBaseSha256"): issues.append("canonical hash mismatch")
    actual_counts={"destinations":len(dests),"routes":len(routes)}
    if actual_counts!=expected.get("counts"): issues.append("count mismatch")
    h=hashlib.sha256(); h.update(normalized(dests)); h.update(normalized(routes)); h.update(heroes); h.update(refs)
    if h.hexdigest()!=expected.get("publicContentSha256"): issues.append("public content hash mismatch")
    result={"status":"PASS" if not issues else "FAIL","baseUrl":base,"releaseId":remote.get("releaseId"),"counts":actual_counts,"publicContentSha256":h.hexdigest(),"issues":issues}
    Path(a.output).write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8"); print(json.dumps(result,ensure_ascii=False,indent=2)); return 0 if not issues else 2
if __name__=="__main__": raise SystemExit(main())

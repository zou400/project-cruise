const CACHE='project-cruise-03600-navigation-endpoint-hotfix-102';
const APP_SHELL=["./", "./index.html", "./styles.css", "./release.js", "./app.js", "./bootstrap.js", "./hero-registry.js", "./manifest.webmanifest", "./data/public-bundle-manifest.json", "./data/release-attestation.json", "./data/reference-registry.public.json", "./data/destinations.public.json", "./data/routes.public.json", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

async function networkFirst(request){
  try{
    const response=await fetch(request);
    if(response&&response.ok){
      const cache=await caches.open(CACHE);
      await cache.put(request,response.clone());
    }
    return response;
  }catch(error){
    const cached=await caches.match(request);
    if(cached)return cached;
    return new Response('Resource unavailable offline',{status:503,statusText:'Offline'});
  }
}

async function cacheFirstAsset(request){
  const cached=await caches.match(request);
  if(cached)return cached;
  try{
    const response=await fetch(request);
    if(response&&response.ok){
      const cache=await caches.open(CACHE);
      await cache.put(request,response.clone());
    }
    return response;
  }catch(error){
    return new Response('Resource unavailable offline',{status:503,statusText:'Offline'});
  }
}

async function navigationResponse(request){
  try{
    const response=await fetch(request);
    if(response&&response.ok){
      const cache=await caches.open(CACHE);
      await cache.put('./index.html',response.clone());
    }
    return response;
  }catch(error){
    return (await caches.match('./index.html')) || new Response('PROJECT CRUISE is unavailable offline',{status:503,statusText:'Offline'});
  }
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  const isHero=url.pathname.includes('/assets/heroes/by-id/');
  if(isHero){
    event.respondWith(networkFirst(event.request));
    return;
  }
  if(event.request.mode==='navigate'){
    event.respondWith(navigationResponse(event.request));
    return;
  }
  event.respondWith(cacheFirstAsset(event.request));
});

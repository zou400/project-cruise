const $=s=>document.querySelector(s);
let routes=[], selectedTime="90", lastId=null;

fetch("data/routes.json")
  .then(r=>r.json())
  .then(data=>{routes=data})
  .catch(()=>alert("ルートデータを読み込めませんでした。"));

document.querySelectorAll(".time-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".time-btn").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    selectedTime=btn.dataset.time;
  });
});

$("#draw").addEventListener("click",draw);
$("#redraw").addEventListener("click",draw);
$("#about-toggle").addEventListener("click",()=>$("#about").classList.toggle("hidden"));

function draw(){
  const pool=routes.filter(r=>r.timeBucket===selectedTime);
  if(!pool.length){ alert("この時間帯のルートは準備中です。"); return; }
  let choices=pool.filter(r=>r.id!==lastId);
  if(!choices.length) choices=pool;
  const route=weightedPick(choices);
  lastId=route.id;
  show(route);
}

function weightedPick(pool){
  const weighted=[];
  pool.forEach(r=>{
    const quality=Number(r.quality)||70;
    const copies=Math.max(1,Math.round((quality-60)/8));
    for(let i=0;i<copies;i++) weighted.push(r);
  });
  return weighted[Math.floor(Math.random()*weighted.length)];
}

function show(r){
  $("#duration").textContent=r.duration||timeLabel(selectedTime);
  $("#theme").textContent=r.theme||r.type||"近距離ドライブ";
  $("#destination").textContent=r.destination||"目的地未設定";
  $("#goal").textContent=r.destination||"";
  $("#title").textContent=r.title||"";
  $("#intent").textContent=r.intent||"大田区から無理なく戻れるルートです。";
  $("#caution").textContent=r.caution?`注意：${r.caution}`:"";
  $("#caution").style.display=r.caution?"block":"none";
  $("#gmap").href=r.googleMaps||"#";
  $("#waypoints").innerHTML=(r.waypoints||[]).map((x,i)=>`<div><span>STOP ${i+1}</span><strong>${escapeHtml(x)}</strong></div>`).join("");
  $("#result").classList.remove("hidden");
  $("#result").scrollIntoView({behavior:"smooth",block:"start"});
}

function timeLabel(v){return v==="90"?"90分":v==="120"?"2時間":"半日"}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
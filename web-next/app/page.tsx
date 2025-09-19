"use client";
import { useEffect, useState } from "react";

/** --------- MOCK DATA (Phase 1) --------- */
type Window = [string,string];
type Schedule = Record<"sun"|"mon"|"tue"|"wed"|"thu"|"fri"|"sat", Window[]>;
type Item = { name: string; hh: number; reg: number | null };
type Venue = {
  id: string; name: string; slug: string;
  lat: number; lng: number; cuisines: string[];
  schedule: Schedule; items: Item[]; bookingUrl?: string;
};
const MOCK: Venue[] = [
  {
    id:"juniper", name:"Juniper", slug:"juniper",
    lat:37.79, lng:-122.4, cuisines:["american","cocktail"],
    bookingUrl:"https://www.opentable.com/r/juniper",
    schedule:{mon:[["15:00","18:00"],["21:00","23:00"]],tue:[["15:00","18:00"]],wed:[["15:00","18:00"]],thu:[["15:00","18:00"]],fri:[],sat:[],sun:[["14:00","17:00"]]},
    items:[{name:"House Lager (pint)",hh:5,reg:8},{name:"Margarita",hh:9,reg:14},{name:"Wings (6 pc)",hh:7,reg:12}]
  },
  {
    id:"harbor-vine", name:"Harbor & Vine", slug:"harbor-and-vine",
    lat:37.802, lng:-122.41, cuisines:["seafood","wine bar"],
    bookingUrl:"https://www.opentable.com/r/harbor-vine",
    schedule:{mon:[],tue:[["16:00","18:30"]],wed:[["16:00","18:30"]],thu:[["16:00","18:30"]],fri:[["16:00","18:00"]],sat:[],sun:[]},
    items:[{name:"Oysters (half-dozen)",hh:16,reg:24},{name:"House White (glass)",hh:8,reg:13},{name:"Calamari",hh:10,reg:15}]
  }
];

/** --------- helpers --------- */
function distanceKm(a:{lat:number,lng:number}, b:{lat:number,lng:number}){
  const R=6371, dLat=((b.lat-a.lat)*Math.PI)/180, dLng=((b.lng-a.lng)*Math.PI)/180;
  const s1=Math.sin(dLat/2)**2, s2=Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(s1+s2));
}
const toMin=(s:string)=>{ const [h,m]=s.split(":").map(Number); return h*60+m };
function isActiveNow(s:Schedule, now=new Date()){
  const key = ["sun","mon","tue","wed","thu","fri","sat"][now.getDay()] as keyof Schedule;
  const cur = toMin(now.toTimeString().slice(0,5));
  return (s[key]||[]).some(([a,b])=> cur>=toMin(a) && cur<=toMin(b));
}
function nextToday(s:Schedule, now=new Date()): Window | null {
  const key = ["sun","mon","tue","wed","thu","fri","sat"][now.getDay()] as keyof Schedule;
  const cur = toMin(now.toTimeString().slice(0,5));
  const wins = (s[key]||[]).sort((x,y)=>toMin(x[0])-toMin(y[0]));
  for (const w of wins) if (cur <= toMin(w[1])) return w;
  return null;
}

/** --------- tiny UI bits --------- */
function Card({children}:{children:any}) {
  return <div style={{border:"1px solid #e5e7eb",borderRadius:16,padding:16,boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>{children}</div>;
}
function ButtonLink({href, children}:{href:string; children:any}){
  return <a href={href} target="_blank" style={{fontSize:14}}> {children} </a>;
}

/** --------- page --------- */
export default function Home(){
  const [coords,setCoords]=useState<{lat:number;lng:number}|null>(null);
  const [err, setErr] = useState<string|null>(null);

  useEffect(()=>{
    if (!navigator.geolocation){ setErr("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      e => setErr(e.message),
      { enableHighAccuracy:true, timeout:8000 }
    );
  },[]);

  const here = coords ?? { lat: 37.79, lng: -122.4 }; // fallback = SF
  const rows = MOCK.map(v=>{
      const active = isActiveNow(v.schedule);
      const nextWin = nextToday(v.schedule);
      const dist = distanceKm(here, {lat:v.lat,lng:v.lng});
      const topSavings = v.items.reduce((a,i)=> i.reg ? Math.max(a, i.reg - i.hh) : a, 0);
      return { v, active, nextWin, dist, topSavings };
    })
    .filter(r=> r.dist <= 30) // 30km radius so you see *something* first time
    .sort((a,b)=> a.dist - b.dist);

  return (
    <main style={{maxWidth:800, margin:"32px auto", padding:"0 16px"}}>
      <h1 style={{fontSize:28, fontWeight:700}}>Keystone Happy Hour</h1>
      {!coords && <p style={{color:"#6b7280", fontSize:14, marginTop:8}}>
        {err ? `Location error: ${err}` : "Getting your location… (we’ll use a default city if blocked)"} </p>}
      <div style={{display:"grid", gap:12, marginTop:16}}>
        {rows.map(r=>(
          <Card key={r.v.id}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"start"}}>
              <div>
                <div style={{fontSize:18, fontWeight:600}}>{r.v.name}</div>
                <div style={{fontSize:12, color:"#6b7280"}}>{r.dist.toFixed(2)} km • {r.v.cuisines.join(", ")}</div>
              </div>
              {r.topSavings>0 && (
                <span style={{fontSize:12, padding:"2px 8px", borderRadius:9999, background:"#dcfce7"}}>
                  Save up to ${r.topSavings.toFixed(2)}
                </span>
              )}
            </div>
            <div style={{fontSize:14, marginTop:8}}>
              {r.active ? <b>Happening now</b> : (r.nextWin ? `Next: ${r.nextWin[0]}–${r.nextWin[1]}` : "No window today")}
            </div>
            <ul style={{fontSize:14, marginTop:8, paddingLeft:18}}>
              {r.v.items.slice(0,3).map((it,i)=>(
                <li key={i}>
                  {it.name}: ${it.hh.toFixed(2)} {it.reg && <span style={{color:"#6b7280"}}>(was ${it.reg.toFixed(2)})</span>}
                </li>
              ))}
            </ul>
            <div style={{marginTop:8, display:"flex", gap:12}}>
              {/* details page later */}
              {r.v.bookingUrl && <ButtonLink href={r.v.bookingUrl}>Book</ButtonLink>}
            </div>
          </Card>
        ))}
        {rows.length===0 && <p style={{fontSize:14, color:"#6b7280"}}>No results nearby.</p>}
      </div>
    </main>
  );
}

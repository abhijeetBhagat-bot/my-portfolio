import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";

function Rain({count=400}){const mesh=useRef();const positions=useMemo(()=>new Float32Array(Array.from({length:count*3},()=> (Math.random()-0.5)*10)),[count]);const vel=useMemo(()=>Array.from({length:count},()=>0.1+Math.random()*0.6),[count]);useFrame((_,delta)=>{for(let i=0;i<count;i++){positions[i*3+1]-=vel[i]*delta*60;if(positions[i*3+1]<-2)positions[i*3+1]=5+Math.random()*2}mesh.current.geometry.attributes.position.needsUpdate=true});return (<points ref={mesh}><bufferGeometry><bufferAttribute attach="attributes-position" array={positions} count={positions.length/3} itemSize={3} /></bufferGeometry><pointsMaterial size={0.03} sizeAttenuation transparent opacity={0.7} /></points>)}

function Sun(){return (<mesh position={[2,3,-2]}><sphereGeometry args={[0.6,32,32]} /><meshStandardMaterial emissive="#ffdd55" emissiveIntensity={1.6} color="#ffcc33" /></mesh>)}

function Scene({mode}){return (<><ambientLight intensity={0.6} /><directionalLight position={[4,6,3]} intensity={0.8} />{mode==='rain' && <Rain count={600} />}{mode==='clear' && <Sun /> }<Stars radius={50} depth={20} count={2000} factor={4} fade /><OrbitControls enablePan={false} minDistance={4} maxDistance={14} /></>)}

async function geocode(q){if(!q) return[];const url=`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`;const r=await fetch(url);const j=await r.json();return (j?.results||[]).map(x=>({name:x.name,lat:x.latitude,lon:x.longitude,admin1:x.admin1,country:x.country}))}
async function fetchWeather(lat,lon){const params=new URLSearchParams({latitude:String(lat),longitude:String(lon),current_weather:'true',daily:'temperature_2m_max,temperature_2m_min,precipitation_sum',timezone:'auto'});const url=`https://api.open-meteo.com/v1/forecast?${params.toString()}`;const r=await fetch(url);return r.json()}

export default function App(){const [q,setQ]=useState('');const [sugs,setSugs]=useState([]);const [sel,setSel]=useState(null);const [data,setData]=useState(null);const [loading,setLoading]=useState(false);const [unit,setUnit]=useState('C');
useEffect(()=>{const t=setTimeout(async()=>{if(q.length<2){setSugs([]);return}try{const res=await geocode(q);setSugs(res)}catch(e){setSugs([])}},300);return()=>clearTimeout(t)},[q]);
useEffect(()=>{(async()=>{const del={name:'Delhi',lat:28.6139,lon:77.2090,country:'India'};setSel(del);setLoading(true);try{const w=await fetchWeather(del.lat,del.lon);setData(w)}catch(e){}setLoading(false)})()},[]);
const temp=data?.current_weather?.temperature;const tempDisplay=unit==='C'?temp:typeof temp==='number'?Math.round((temp*9)/5+32):'--';const mode = data?.current_weather?.temperature>0? 'clear':'rain';
const pick=async(p)=>{setSel(p);setQ(`${p.name}${p.admin1? ', '+p.admin1:''}`);setSugs([]);setLoading(true);try{const w=await fetchWeather(p.lat,p.lon);setData(w)}catch(e){}setLoading(false)};
return (<div className="app"><div className="card"><div className="header"><div><h2>3D Weather Explorer</h2><div className="small">Live Open-Meteo data no API key</div></div><div className="row"><input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search city" /><button className="btn" onClick={()=>pick({name:q,lat:data?.latitude||0,lon:data?.longitude||0})}>Search</button></div></div>
{sugs.length>0 && <div style={{marginTop:10}}>{sugs.map((s,i)=>(<button key={i} style={{display:'block',padding:8,background:'transparent',border:0,color:'inherit',textAlign:'left'}} onClick={()=>pick(s)}>{s.name}{s.admin1? ', '+s.admin1:''} • {s.country}</button>))}</div>}
<div style={{display:'flex',gap:12,marginTop:16,alignItems:'center'}}>
  <div style={{flex:1}}>
    <div style={{fontSize:36,fontWeight:700}}>{typeof tempDisplay==='number'?tempDisplay:tempDisplay}°{unit}</div>
    <div className="small">{sel? sel.name+' • '+(sel.country||'') : '—'}</div>
    <div style={{marginTop:10,display:'flex',gap:8}}><button className="btn" onClick={()=>setUnit('C')}>°C</button><button className="btn ghost" onClick={()=>setUnit('F')}>°F</button></div>
  </div>
  <div style={{width:380,height:220}}>
    <Canvas camera={{position:[0,2,8],fov:60}}>
      <Scene mode={mode} />
    </Canvas>
  </div>
</div>
<div className="outlook">{(data?.daily?.time||[]).slice(0,3).map((d,i)=>(<div className="day" key={d}><div className="small">{new Date(d).toLocaleDateString(undefined,{weekday:'short'})}</div><div style={{marginTop:6,fontWeight:700}}>{Math.round(data.daily.temperature_2m_max[i])}°</div><div className="small">Min {Math.round(data.daily.temperature_2m_min[i])}°</div></div>))}</div>
</div></div>)}

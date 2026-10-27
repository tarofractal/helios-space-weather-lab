import { env } from 'cloudflare:workers';
import snapshotData from '../data/snapshot.json';
import auroraSnapshot from '../data/aurora-snapshot.json';
import { normalizeFeed } from './normalize';
import type { AuroraData, CME, FeedStatus, Flare, Sample, Series, WeatherBundle } from './types';
const memory=new Map<string,{payload:unknown;fetchedAt:string}>();
export const SOURCES:Record<string,{label:string;url:string}>={
 wind:{label:'太陽風 · NOAA RTSW',url:'https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json'},
 mag:{label:'磁場 · NOAA RTSW',url:'https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json'},
 kp:{label:'Kp · NOAA',url:'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json'},
 forecast:{label:'Kp予報 · NOAA',url:'https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json'},
 xray:{label:'X線 · GOES',url:'https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json'},
 proton:{label:'陽子 · GOES',url:'https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json'},
 cme:{label:'CME · NASA DONKI',url:'https://ccmc.gsfc.nasa.gov/DONKI-API/get/CME'},
 flare:{label:'フレア · NASA DONKI',url:'https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR'},
};
function fallback(id:string):unknown{
 const s=snapshotData as unknown as WeatherBundle;
 if(id==='cme')return s.cmes;if(id==='flare')return s.flares;if(id==='forecast')return s.forecast;
 const keys:Record<string,string[]>={wind:['speed','density'],mag:['bz','bt'],kp:['kp'],xray:['xray'],proton:['proton']};
 return Object.fromEntries((keys[id]??[]).map(k=>[k,s.series[k as keyof Series]??[]]));
}
async function cached(id:string){
 if(memory.has(id))return memory.get(id)!;
 try{if(env.DB){const row=await env.DB.prepare('SELECT payload,fetched_at FROM feed_cache WHERE id=?').bind(id).first<{payload:string;fetched_at:string}>();if(row)return {payload:JSON.parse(row.payload),fetchedAt:row.fetched_at};}}catch{}
 return null;
}
async function save(id:string,payload:unknown,fetchedAt:string){
 memory.set(id,{payload,fetchedAt});
 try{if(env.DB)await env.DB.prepare('INSERT INTO feed_cache(id,payload,fetched_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,fetched_at=excluded.fetched_at').bind(id,JSON.stringify(payload),fetchedAt).run();}catch{}
}
export async function fetchJSON(url:string,timeout=14000){
 const response=await fetch(url,{signal:AbortSignal.timeout(timeout),headers:{Accept:'application/json','User-Agent':'HELIOS-SpaceWeatherLab/1.0'}});
 if(!response.ok)throw new Error(`HTTP ${response.status}`);
 return response.json();
}
export async function getBundle(force=false):Promise<WeatherBundle>{
 const b:WeatherBundle={fetchedAt:new Date().toISOString(),mode:'live',series:{},cmes:[],flares:[],forecast:[],feeds:[]};
 const results=await Promise.all(Object.entries(SOURCES).map(async([id,source])=>{
  const prev=await cached(id);let payload:unknown,stamp='',state:FeedStatus['state']='live',error:string|undefined;
  const ttl=id==='cme'||id==='flare'?600000:90000;
  let url=source.url;
  if(id==='cme'||id==='flare'){
   const end=new Date(),start=new Date(end.getTime()-21*86400000);
   url+=`?startDate=${start.toISOString().slice(0,10)}&endDate=${end.toISOString().slice(0,10)}`;
  }
  try{
   if(!force&&prev&&Date.now()-Date.parse(prev.fetchedAt)<ttl){payload=prev.payload;stamp=prev.fetchedAt;}
   else{payload=normalizeFeed(id,await fetchJSON(url));stamp=new Date().toISOString();await save(id,payload,stamp);}
  }catch(e){state='snapshot';error=e instanceof Error?e.message:'取得失敗';payload=prev?.payload??fallback(id);stamp=prev?.fetchedAt??snapshotData.feeds.find(f=>f.id===id)?.fetchedAt??snapshotData.fetchedAt;}
  const items=(Array.isArray(payload)?payload:Object.values(payload as object).flat()) as Array<{t?:number;start?:number}>;
  const times=items.map(x=>x.t??x.start??0).filter(t=>t>0);
  const status:FeedStatus={id,label:source.label,sourceUrl:url,fetchedAt:stamp,lastObserved:times.length?Math.max(...times):null,count:items.length,state,error,timeReference:id==='wind'||id==='mag'?'L1観測時刻 · 地球到達時刻へのシフトなし':'各製品のUTC対象時刻'};
  return {id,payload,status};
 }));
 for(const r of results){b.feeds.push(r.status);if(r.id==='cme')b.cmes=r.payload as CME[];else if(r.id==='flare')b.flares=r.payload as Flare[];else if(r.id==='forecast')b.forecast=r.payload as Sample[];else Object.assign(b.series,r.payload);}
 if(b.feeds.every(f=>f.state!=='live'))b.mode='snapshot';
 return b;
}
export async function getAurora():Promise<AuroraData>{
 const url='https://services.swpc.noaa.gov/json/ovation_aurora_latest.json';
 const prev=await cached('aurora');
 if(prev&&Date.now()-Date.parse(prev.fetchedAt)<180000)return prev.payload as AuroraData;
 try{
  const raw=await fetchJSON(url) as Record<string,unknown>;
  if(!Array.isArray(raw.coordinates))throw new Error('Invalid OVATION data');
  const payload:AuroraData={observationTime:String(raw['Observation Time']),forecastTime:String(raw['Forecast Time']),coordinates:raw.coordinates as number[][],mode:'live',fetchedAt:new Date().toISOString(),sourceUrl:url};
  await save('aurora',payload,payload.fetchedAt);return payload;
 }catch{return {...(prev?.payload??auroraSnapshot) as AuroraData,mode:'snapshot'};}
}

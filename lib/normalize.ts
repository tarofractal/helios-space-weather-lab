import type { CME, Flare, MetricKey, Sample, Series } from './types';
type Row = Record<string, unknown>;
export function numeric(x:unknown):number|null{
 if(x===null||x===undefined||x==='')return null;
 const n=Number(x);return Number.isFinite(n)&&Math.abs(n)<1e25&&n!==-9999?n:null;
}
export function utc(x:unknown):number|null{
 if(typeof x!=='string'||!x)return null;
 const n=Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(x)?x:x+'Z');return Number.isFinite(n)?n:null;
}
function rows(data:unknown):Row[]{
 if(!Array.isArray(data))throw new Error('Expected a JSON array');
 if(Array.isArray(data[0])){const names=data[0] as string[];return data.slice(1).map(v=>Object.fromEntries(names.map((k,i)=>[k,v[i]])));}
 return data as Row[];
}
function normalizeSeries(data:unknown,field:string,filter?:(r:Row)=>boolean,positive=false):Sample[]{
 const map=new Map<number,Sample>();
 for(const r of rows(data)){
  if(filter&&!filter(r))continue;
  const t=utc(r.time_tag);if(t===null)continue;
  const q=numeric(r.overall_quality);let v=numeric(r[field]);
  if((positive&&v!==null&&v<0)||(q!==null&&q>0))v=null;
  const sample:Sample={t,v,source:String(r.source??(r.satellite?'GOES-'+r.satellite:'NOAA')),quality:q};
  if(r.electron_contaminaton===true)sample.flag='electron-contamination';
  map.set(t,sample);
 }
 return [...map.values()].sort((a,b)=>a.t-b.t);
}
export function normalizeFeed(id:string,data:unknown):Series|Sample[]|CME[]|Flare[]{
 switch(id){
  case 'wind':return {speed:normalizeSeries(data,'proton_speed',r=>r.active===true,true),density:normalizeSeries(data,'proton_density',r=>r.active===true,true)};
  case 'mag':return {bz:normalizeSeries(data,'bz_gsm',r=>r.active===true),bt:normalizeSeries(data,'bt',r=>r.active===true,true)};
  case 'kp':return {kp:normalizeSeries(rows(data).map(r=>({...r,value:r.Kp??r.kp})),'value',undefined,true)};
  case 'forecast':return normalizeSeries(data,'kp',r=>r.observed==='predicted',true);
  case 'xray':return {xray:normalizeSeries(data,'flux',r=>r.energy==='0.1-0.8nm',true)};
  case 'proton':return {proton:normalizeSeries(data,'flux',r=>r.energy==='>=10 MeV',true)};
  case 'cme':case 'historicalCme':return normalizeCMEs(data);
  case 'flare':return normalizeFlares(data);
  default:throw new Error('Unsupported data product');
 }
}
export function normalizeCMEs(data:unknown):CME[]{
 return rows(data).map(r=>{
  const analyses=Array.isArray(r.cmeAnalyses)?r.cmeAnalyses as Row[]:[];
  const a=analyses.find(a=>a.isMostAccurate===true)??analyses[0]??{};
  const enlils=Array.isArray(a.enlilList)?a.enlilList as Row[]:[];
  const earth=enlils.find(e=>e.estimatedShockArrivalTime);
  return {id:String(r.activityID),start:utc(r.startTime)??0,t0:utc(a.time21_5),speed:numeric(a.speed),lat:numeric(a.latitude),lon:numeric(a.longitude),halfAngle:numeric(a.halfAngle),type:String(a.type??''),source:String(r.sourceLocation??''),region:numeric(r.activeRegionNum),note:String(r.note??''),link:String(r.link??''),analysisLink:String(a.link??''),officialArrival:utc(earth?.estimatedShockArrivalTime),analysisAt:utc(a.submissionTime),related:(Array.isArray(r.linkedEvents)?r.linkedEvents as Row[]:[]).map(x=>String(x.activityID))};
 }).filter(c=>c.start>0).sort((a,b)=>b.start-a.start);
}
export function normalizeFlares(data:unknown):Flare[]{
 return rows(data).map(r=>({id:String(r.flrID),start:utc(r.beginTime)??0,peak:utc(r.peakTime)??0,end:utc(r.endTime)??0,class:String(r.classType??''),region:numeric(r.activeRegionNum),location:String(r.sourceLocation??''),link:String(r.link??''),related:(Array.isArray(r.linkedEvents)?r.linkedEvents as Row[]:[]).map(x=>String(x.activityID))})).sort((a,b)=>b.start-a.start);
}
export function seriesExtent(series:Series){
 const samples=Object.values(series).flat().filter(Boolean) as Sample[];
 return samples.length?[Math.min(...samples.map(s=>s.t)),Math.max(...samples.map(s=>s.t))]:[Date.now()-86400000,Date.now()];
}
export const feedMetrics:Record<string,MetricKey[]>={wind:['speed','density'],mag:['bz','bt'],kp:['kp'],xray:['xray'],proton:['proton']};

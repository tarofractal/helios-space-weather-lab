import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root=process.cwd();
const src=ts.transpileModule(fs.readFileSync('lib/normalize.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {normalizeFeed,normalizeFlares}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const snapshot={fetchedAt:new Date().toISOString(),mode:'snapshot',series:{},cmes:[],flares:[],forecast:[],feeds:[]};
const labels={wind:'太陽風 · NOAA RTSW',mag:'惑星間磁場 · NOAA RTSW',kp:'地磁気 Kp · NOAA',forecast:'Kp予報 · NOAA',xray:'X線 · GOES',proton:'陽子 · GOES',cme:'CME · NASA DONKI',flare:'フレア · NASA DONKI'};
for(const id of Object.keys(labels)){
 const p=`data/raw-${id}.json`;if(!fs.existsSync(p))continue;
 const raw=JSON.parse(fs.readFileSync(p,'utf8')),normalized=normalizeFeed(id,raw.data);
 if(id==='cme')snapshot.cmes=normalized;else if(id==='flare')snapshot.flares=normalized;else if(id==='forecast')snapshot.forecast=normalized;else Object.assign(snapshot.series,normalized);
 const items=Array.isArray(normalized)?normalized:Object.values(normalized).flat();
 const times=items.map(x=>x.t??x.start).filter(Number.isFinite);
 snapshot.feeds.push({id,label:labels[id],sourceUrl:raw.sourceUrl,fetchedAt:raw.retrievedAt,lastObserved:times.length?Math.max(...times):null,count:items.length,state:'snapshot',timeReference:id==='wind'||id==='mag'?'L1 spacecraft observation time':'Product time in UTC'});
}
for(const dest of ['data/snapshot.json','public/data/snapshot.json'])fs.writeFileSync(dest,JSON.stringify(snapshot));
const historical=JSON.parse(fs.readFileSync('data/raw-historicalCme.json','utf8'));
fs.writeFileSync('data/historical-cmes.json',JSON.stringify(normalizeFeed('historicalCme',historical.data)));
fs.writeFileSync('public/data/historical-cmes.json',JSON.stringify(normalizeFeed('historicalCme',historical.data)));
const raw=JSON.parse(fs.readFileSync('data/raw-aurora.json','utf8'));
const aurora={observationTime:raw.data['Observation Time'],forecastTime:raw.data['Forecast Time'],coordinates:raw.data.coordinates,fetchedAt:raw.retrievedAt,mode:'snapshot',sourceUrl:raw.sourceUrl};
fs.writeFileSync('data/aurora-snapshot.json',JSON.stringify(aurora));
fs.writeFileSync('public/data/aurora-snapshot.json',JSON.stringify(aurora));
const research=path.join(root,'data/archive');
if(fs.existsSync(path.join(research,'historical_may2024.json'))){
 const h=JSON.parse(fs.readFileSync(path.join(research,'historical_may2024.json'),'utf8'));
 const m=JSON.parse(fs.readFileSync(path.join(research,'historical_may2024_manifest.json'),'utf8'));
 const series={};
 for(const [key,field]of Object.entries({speed:'proton_speed',density:'proton_density',bz:'bz_gsm',bt:'bt',pressure:'dynamic_pressure'}))series[key]=h.solarWind.map(r=>({t:Date.parse(r.time_tag),v:r[field],source:'NASA OMNI · bow shock'}));
 series.kp=h.kp.map(r=>({t:Date.parse(r.time_tag),v:r.kp,source:'GFZ · definitive'}));
 series.dst=h.dst.map(r=>({t:Date.parse(r.time_tag),v:r.dst,source:'WDC Kyoto / NASA OMNI'}));
 const feeds=m.sources.map(s=>({id:s.id,label:s.organization,sourceUrl:s.dataUrl,fetchedAt:m.retrievedAt,lastObserved:Date.parse(h.stopExclusive)-300000,count:s.rows,state:'snapshot',timeReference:s.timeReference}));
 for(const [filename,key,field,source]of [['goes16_xray_may2024','xray','xrsb','GOES-16 · NCEI science v2-2-2'],['goes_rt_protons_may2024','proton','gt10','NOAA primary GOES / NASA CLEAR archive']]){
  const file=path.join(research,filename+'.json');if(!fs.existsSync(file))continue;
  const d=JSON.parse(fs.readFileSync(file,'utf8')),manifest=JSON.parse(fs.readFileSync(path.join(research,filename+'_manifest.json'),'utf8'));
  series[key]=d.series.map(r=>({t:Date.parse(r.time_tag),v:r[field],source}));
  feeds.push({id:key,label:source,sourceUrl:manifest.dataUrl??manifest.files?.[0]?.url??'https://www.ncei.noaa.gov/products/space-weather',fetchedAt:manifest.retrievedAt,lastObserved:series[key].at(-1).t,count:series[key].length,state:'snapshot',timeReference:d.timeReference});
  m.additionalSources??=[];m.additionalSources.push(manifest);
  fs.copyFileSync(path.join(research,filename+'_manifest.json'),'public/data/'+filename+'_manifest.json');
  if(key==='xray')fs.writeFileSync('public/data/xray-may2024.json',JSON.stringify({source,series:d.series.map(r=>[Date.parse(r.time_tag),r.xrsa,r.xrsb])}));
 }
 const flares=fs.existsSync('data/raw-historicalFlare.json')?normalizeFlares(JSON.parse(fs.readFileSync('data/raw-historicalFlare.json','utf8')).data):[];
 fs.writeFileSync('public/data/flares-may2024.json',JSON.stringify(flares));
 const replay={fetchedAt:m.retrievedAt,mode:'replay',title:'2024年5月 Gannon storm',description:'NASA OMNI・GFZ・WDC Kyoto・NOAA GOESの実観測。太陽風はバウショック到達時刻へシフト済み。',series,cmes:normalizeFeed('historicalCme',historical.data),flares,forecast:[],feeds};
 fs.writeFileSync('public/data/replay-gannon.json',JSON.stringify(replay));
 fs.writeFileSync('data/replay-gannon.json',JSON.stringify(replay));
 fs.writeFileSync('public/data/replay-provenance.json',JSON.stringify(m,null,2));
}
console.log(JSON.stringify({snapshotKB:Math.round(fs.statSync('data/snapshot.json').size/1024),cmes:snapshot.cmes.length,series:Object.fromEntries(Object.entries(snapshot.series).map(([k,v])=>[k,v.length]))}));

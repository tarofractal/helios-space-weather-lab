'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, FlaskConical, RotateCcw, Info, Download, CheckCircle2 } from 'lucide-react';
import { AU, RSUN, HOUR, arrival, formatTime, formatValue, parameters, propagate } from '@/lib/physics';
import type { CME, ModelParams, Sample } from '@/lib/types';
import { Panel, SourceLink, downloadText } from './UI';
import { Plot } from './Charts';
import { SpaceScene } from './SpaceScene';
export const VALIDATION_PARAMS:ModelParams={v0:920,w:450,gamma:.2e-7,r0:20*RSUN,t0:Date.parse('2010-04-03T13:24Z'),target:AU};
export function ModelLab({seed,cmes,tz}:{seed:CME|null;cmes:CME[];tz:string}){
 const [p,setP]=useState<ModelParams>(VALIDATION_PARAMS),[elapsed,setElapsed]=useState(30),[model,setModel]=useState<'dbm'|'ballistic'>('dbm'),[preset,setPreset]=useState('2010'),[showTheory,setShowTheory]=useState(false);
 useEffect(()=>{if(seed){const next=parameters(seed);if(next){setP(next);setPreset(seed.id);}}},[seed]);
 const a=arrival(p),b=arrival(p,'ballistic'),state=propagate(p,elapsed*3600,model);
 const synthetic:CME={id:'model',start:p.t0,t0:p.t0,speed:p.v0,lat:seed&&preset===seed.id?seed.lat:0,lon:seed&&preset===seed.id?seed.lon:0,halfAngle:seed&&preset===seed.id?seed.halfAngle:35,type:'MODEL',source:'',note:'',link:'',analysisLink:'',region:null,officialArrival:null,analysisAt:null,related:[]};
 const curves=useMemo(()=>{
  const dbm:Sample[]=[],ballistic:Sample[]=[],velocity:Sample[]=[],constant:Sample[]=[];
  for(let h=0;h<=120;h+=.25){const s=propagate(p,h*3600),c=propagate(p,h*3600,'ballistic'),t=p.t0+h*HOUR;dbm.push({t,v:s.r/AU});ballistic.push({t,v:c.r/AU});velocity.push({t,v:s.v});constant.push({t,v:c.v});}
  return {dbm,ballistic,velocity,constant};
 },[p]);
 const sensitivity=useMemo(()=>[
  {label:'初速度 −20%',params:{...p,v0:p.v0*.8}},
  {label:'初速度 +20%',params:{...p,v0:p.v0*1.2}},
  {label:'背景速度 −20%',params:{...p,w:p.w*.8}},
  {label:'背景速度 +20%',params:{...p,w:p.w*1.2}},
  {label:'抗力係数 ×0.5',params:{...p,gamma:p.gamma*.5}},
  {label:'抗力係数 ×2',params:{...p,gamma:p.gamma*2}},
 ].map(x=>({...x,result:arrival(x.params)})),[p]);
 const choose=(id:string)=>{setPreset(id);if(id==='2010'){setP(VALIDATION_PARAMS);setElapsed(30);}else{const c=cmes.find(c=>c.id===id);if(c){const n=parameters(c);if(n)setP(n);}}};
 const exportModel=()=>{const rows=['hours,distance_dbm_au,distance_ballistic_au,speed_dbm_km_s,speed_ballistic_km_s'];curves.dbm.forEach((v,i)=>rows.push([i*.25,v.v,curves.ballistic[i].v,curves.velocity[i].v,curves.constant[i].v].join(',')));downloadText('helios-dbm-model.csv',rows.join('\n'),'text/csv');};
 return <>
  <div className="workspace-intro"><span className="eyebrow">COMPUTATIONAL EXPERIMENT</span><h2>仮定を動かして、伝播を調べる。</h2><p>等速モデルとDrag-Based Modelを同じ初期条件で計算します。パラメータを変えると、軌跡・到達時刻・感度分析が更新されます。</p></div>
  <div className="lab-layout"><Panel title="初期条件" kicker="MODEL PARAMETERS" className="parameter-panel" action={<button className="icon-button" title="初期条件を戻す" onClick={()=>choose(preset)}><RotateCcw size={14}/></button>}>
   <label className="field-label">イベント / 検算用ケース<select value={preset} onChange={e=>choose(e.target.value)}><option value="2010">2010-04-03 · 論文の検算ケース</option>{cmes.filter(c=>c.speed&&c.t0).slice(0,40).map(c=><option key={c.id} value={c.id}>{formatTime(c.start,tz)} · {c.speed} km/s</option>)}</select></label>
   {[
    {key:'v0',label:'CME 初速度 v₀',min:200,max:3000,step:10,value:p.v0,unit:'km/s'},
    {key:'w',label:'背景太陽風速度 w',min:200,max:900,step:5,value:p.w,unit:'km/s'},
    {key:'gamma',label:'抗力係数 γ',min:0,max:2,step:.01,value:p.gamma*1e7,unit:'×10⁻⁷ km⁻¹'},
    {key:'r0',label:'基準距離 r₀',min:10,max:40,step:.5,value:p.r0/RSUN,unit:'R☉'},
   ].map(c=><div className="parameter" key={c.key}><div><label htmlFor={'model-'+c.key}>{c.label}</label><span><input id={'number-'+c.key} aria-label={c.label+' 数値'} type="number" min={c.min} max={c.max} step={c.step} value={Math.round(c.value*1000)/1000} onChange={e=>{const n=Math.min(c.max,Math.max(c.min,Number(e.target.value)));setP(q=>({...q,[c.key]:c.key==='gamma'?n*1e-7:c.key==='r0'?n*RSUN:n}));}}/><small>{c.unit}</small></span></div><input id={'model-'+c.key} type="range" min={c.min} max={c.max} step={c.step} value={c.value} onChange={e=>{const v=Number(e.target.value);setP(q=>({...q,[c.key]:c.key==='gamma'?v*1e-7:c.key==='r0'?v*RSUN:v}));}}/><div className="range-labels"><span>{c.min}</span><span>{c.max}</span></div></div>)}
   <label className="field-label">基準時刻 t₀ · UTC<input type="datetime-local" value={new Date(p.t0).toISOString().slice(0,16)} onChange={e=>{const t=Date.parse(e.target.value+'Z');if(Number.isFinite(t))setP(q=>({...q,t0:t}));}}/></label>
   <div className="formula-box"><span>DRAG-BASED MODEL</span><p>dv/dt = −γ(v − w)|v − w|</p><small>距離 km · 速度 km/s · 時間 s</small></div><SourceLink href="https://ccmc.gsfc.nasa.gov/models/DBM~cdbm_201510/">NASA CCMC · モデル定義</SourceLink>
  </Panel>
  <div className="lab-main"><div className="model-results"><div><span className="eyebrow">DRAG-BASED MODEL</span><strong className="mint-text">{formatTime(a?.time,tz)}</strong><small>1 AU到達 · {a?(a.seconds/3600).toFixed(1):'—'} h · {formatValue(a?.speed,0)} km/s</small></div><div><span className="eyebrow">CONSTANT SPEED</span><strong>{formatTime(b?.time,tz)}</strong><small>1 AU到達 · {b?(b.seconds/3600).toFixed(1):'—'} h</small></div><div><span className="eyebrow">MODEL DIFFERENCE</span><strong className="orange-text">{a&&b?((a.time-b.time)/HOUR).toFixed(1):'—'}<em> h</em></strong><small>DBM − 等速モデル</small></div></div>
   <Panel title="伝播シミュレーション" kicker="SAME INPUTS · DIFFERENT ASSUMPTIONS" className="model-scene" action={<div className="segmented"><button className={model==='dbm'?'active':''} onClick={()=>setModel('dbm')}>DBM</button><button className={model==='ballistic'?'active':''} onClick={()=>setModel('ballistic')}>等速</button></div>}><SpaceScene cmes={[synthetic]} selected="model" time={p.t0+elapsed*HOUR} onSelect={()=>{}} w={p.w} gamma={p.gamma} model={model}/><div className="model-time-control"><label>経過時間 <b>{elapsed.toFixed(1)} h</b></label><input aria-label="モデルの経過時間" type="range" min="0" max="120" step="0.2" value={elapsed} onChange={e=>setElapsed(Number(e.target.value))}/><span>{(state.r/AU).toFixed(3)} AU · {state.v.toFixed(0)} km/s</span></div></Panel>
  </div></div>
  <div className="two-column"><Panel title="距離と時間" kicker="HELIOCENTRIC DISTANCE" action={<button className="icon-button" title="モデル計算をCSV保存" onClick={exportModel}><Download size={14}/></button>}><div className="plot-key"><span><i className="dot mint"/>DBM</span><span><i className="dot orange"/>等速</span></div><Plot points={curves.dbm} color="#64d7c2" overlay={{points:curves.ballistic,color:'#f5b66b',label:'等速'}} start={p.t0} end={p.t0+96*HOUR} cursor={p.t0+elapsed*HOUR} onCursor={t=>setElapsed((t-p.t0)/HOUR)} unit="AU" threshold={1} thresholdLabel="Earth · 1 AU" height={235} range={[0,2.5]} tz={tz}/></Panel><Panel title="速度と時間" kicker="CME APEX SPEED"><div className="plot-key"><span><i className="dot mint"/>DBM</span><span><i className="dot orange"/>等速</span></div><Plot points={curves.velocity} color="#64d7c2" overlay={{points:curves.constant,color:'#f5b66b',label:'等速'}} start={p.t0} end={p.t0+96*HOUR} cursor={p.t0+elapsed*HOUR} onCursor={t=>setElapsed((t-p.t0)/HOUR)} threshold={p.w} thresholdLabel="background wind" unit="km/s" height={235} tz={tz}/></Panel></div>
  <Panel title="入力の不確かさは、結果をどれだけ動かす？" kicker="SENSITIVITY ANALYSIS" action={<span className="subtle-tag">PARAMETER SWEEP</span>}><p className="panel-description">1つの入力だけを変えて再計算します。ここでの広がりは感度分析で、校正済みの予測区間ではありません。</p><div className="table-scroll"><table className="data-table"><thead><tr><th>変化させる条件</th><th>到達時刻</th><th>基準との差</th><th>到達速度</th><th>時刻の変化</th></tr></thead><tbody>{sensitivity.map(s=>{const delta=s.result&&a?(s.result.time-a.time)/HOUR:0;return <tr key={s.label}><td>{s.label}</td><td>{formatTime(s.result?.time,tz)}</td><td className={delta<0?'mint-text':'orange-text'}>{delta>0?'+':''}{delta.toFixed(1)} h</td><td>{formatValue(s.result?.speed,0)} km/s</td><td><div className="sensitivity-bar"><i style={{width:Math.min(100,Math.abs(delta)*4)+'%',background:delta<0?'#64d7c2':'#f5b66b'}}/></div></td></tr>;})}</tbody></table></div></Panel>
  <Panel title="式・前提・検算" kicker="OPEN THE MODEL" action={<button className="text-button" onClick={()=>setShowTheory(x=>!x)}>{showTheory?'閉じる':'詳細を読む'} <ArrowRight size={13}/></button>}><div className="assumptions-grid"><div><b>01 · 背景風は一定</b><p>空間・時間によらず、wとγを一定としたモデルです。</p></div><div><b>02 · 基準距離と時刻</b><p>通常は20〜21.5 R☉付近から計算。r₀に対応するt₀を使います。</p></div><div><b>03 · 到着と命中は別</b><p>1 AUへの先端到達と、地球がコーンに入るかは別の判定です。</p></div></div>{showTheory&&<div className="theory-detail"><div className="formula-box large"><p>u = v₀ − w,　q = 1 + γ|u|τ</p><p>v(τ) = w + u/q</p><p>r(τ) = r₀ + wτ + sgn(u) ln(q)/γ</p></div><p>γ = 0またはv₀ = wの極限では等速式へ分岐します。到着時刻はr(τ) = 1 AUの解を二分法で求めています。CME同士の相互作用や磁場構造は解いていません。</p><SourceLink href="https://www.frontiersin.org/journals/astronomy-and-space-sciences/articles/10.3389/fspas.2021.639986/full">Dumbović et al. (2021)</SourceLink></div>}</Panel>
 </>;
}

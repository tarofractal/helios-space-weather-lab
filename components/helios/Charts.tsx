'use client';
import { useMemo, useRef, useState } from 'react';
import { formatTime, formatValue, nearest, intervalSample, HOUR } from '@/lib/physics';
import type { Sample } from '@/lib/types';

export function Sparkline({points,color}:{points:Sample[];color:string}){
 const p=points.filter(x=>x.v!==null).slice(-90);if(p.length<2)return <span className="spark-empty"/>;
 const lo=Math.min(...p.map(x=>x.v!)),hi=Math.max(...p.map(x=>x.v!)),range=hi-lo||1;
 const line=p.map((s,i)=>`${i?'L':'M'}${(i/(p.length-1)*110).toFixed(1)},${(31-(s.v!-lo)/range*25).toFixed(1)}`).join(' ');
 return <svg className="spark" viewBox="0 0 112 36" aria-hidden="true"><path d={line} fill="none" stroke={color} strokeWidth="1.5"/></svg>;
}
type PlotProps={points:Sample[];color:string;start:number;end:number;cursor?:number;onCursor?:(t:number)=>void;log?:boolean;threshold?:number;thresholdLabel?:string;stepped?:boolean;height?:number;tz?:string;overlay?:{points:Sample[];color:string;label:string};unit?:string;label?:string;range?:[number,number];markers?:{t:number;label:string;color?:string}[]};
export function Plot({points,color,start,end,cursor,onCursor,log=false,threshold,thresholdLabel,stepped=false,height=180,tz='UTC',overlay,unit='',label='',range,markers=[]}:PlotProps){
 const [hover,setHover]=useState<number|null>(null),drag=useRef(false);
 const W=900,H=height,L=49,R=12,T=16,B=27;
 const x=(t:number)=>L+(t-start)/Math.max(1,end-start)*(W-L-R);
 const {values,min,max,y,paths,overlayPaths,ticks}=useMemo(()=>{
  const selected=points.filter(s=>s.t>=start&&s.t<=end);
  const others=overlay?.points.filter(s=>s.t>=start&&s.t<=end)??[];
  const values=[...selected,...others].map(p=>p.v).filter((v):v is number=>v!==null&&Number.isFinite(v)&&(!log||v>0));
  const tr=(v:number)=>log?Math.log10(v):v;
  let min=range?tr(range[0]):values.length?Math.min(...values.map(tr)):log?-2:0;
  let max=range?tr(range[1]):values.length?Math.max(...values.map(tr)):log?2:1;
  if(!range){if(threshold!==undefined&&(!log||threshold>0)){min=Math.min(min,tr(threshold));max=Math.max(max,tr(threshold));}if(!log&&min>=0)min=0;const pad=(max-min||1)*0.12;max+=pad;if(min<0||log)min-=pad;}
  if(max===min)max=min+1;
  const y=(v:number)=>T+(max-tr(v))/(max-min)*(H-T-B);
  const build=(samples:Sample[])=>{
   const diffs=samples.slice(1,100).map((s,i)=>s.t-samples[i].t).filter(x=>x>0).sort((a,b)=>a-b),cadence=diffs[Math.floor(diffs.length/2)]??300000;
   const paths:string[]=[];let d='',prev:Sample|null=null;
   for(const s of samples){
    if(s.t<start-cadence||s.t>end)continue;
    if(s.v===null||!Number.isFinite(s.v)||(log&&s.v<=0)){if(d)paths.push(d);d='';prev=null;continue;}
    if(prev&&s.t-prev.t>cadence*2.1){if(d)paths.push(d);d='';prev=null;}
    const xx=x(s.t),yy=y(s.v);
    if(!prev)d=`M${xx.toFixed(2)},${yy.toFixed(2)}`;
    else d+=stepped?`H${xx.toFixed(2)}V${yy.toFixed(2)}`:`L${xx.toFixed(2)},${yy.toFixed(2)}`;
    prev=s;
   }
   if(prev&&stepped)d+=`H${Math.min(x(prev.t+cadence),W-R).toFixed(2)}`;
   if(d)paths.push(d);return paths;
  };
  return {values,min,max,y,paths:build(points),overlayPaths:overlay?build(overlay.points):[],ticks:Array.from({length:4},(_,i)=>min+(max-min)*i/3)};
 // x follows start/end and is deliberately derived in the memo.
 },[points,overlay,start,end,threshold,log,range,stepped,height]);
 const display=hover??cursor,hit=display!==undefined&&display!==null?(stepped?intervalSample(points,display,3*HOUR):nearest(points,display)):null;
 const displayValue=(v:number)=>log||Math.abs(v)>=10000||Math.abs(v)<.01&&v!==0?v.toExponential(0):Math.abs(v)>100?v.toFixed(0):v.toFixed(1);
 const pointer=(event:React.PointerEvent<SVGSVGElement>)=>{const box=event.currentTarget.getBoundingClientRect();return Math.max(start,Math.min(end,start+((event.clientX-box.left)/box.width*W-L)/(W-L-R)*(end-start)));};
 return <div className="plot-wrap">
  <svg role="img" aria-label={label||'観測時系列。欠測区間は線を接続しません。'} viewBox={`0 0 ${W} ${H}`} className="plot" onPointerMove={e=>{const t=pointer(e);setHover(t);if(drag.current)onCursor?.(t);}} onPointerLeave={()=>setHover(null)} onPointerDown={e=>{drag.current=true;e.currentTarget.setPointerCapture(e.pointerId);onCursor?.(pointer(e));}} onPointerUp={()=>{drag.current=false;}}>
   <defs><clipPath id={'clip-'+color.replace('#','')+H}><rect x={L} y={T} width={W-L-R} height={H-T-B}/></clipPath></defs>
   {ticks.map((tick,i)=>{const v=log?10**tick:tick,yy=T+(max-tick)/(max-min)*(H-T-B);return <g key={i}><line x1={L} x2={W-R} y1={yy} y2={yy} stroke="#ffffff0c"/><text x={L-8} y={yy+4} textAnchor="end" fill="#6b7b8e" fontSize="10">{displayValue(v)}</text></g>;})}
   {Array.from({length:6},(_,i)=>{const t=start+(end-start)*i/5;return <g key={i}><line x1={x(t)} x2={x(t)} y1={T} y2={H-B} stroke="#ffffff05"/><text x={x(t)} y={H-6} textAnchor={i===0?'start':i===5?'end':'middle'} fill="#6b7b8e" fontSize="10">{formatTime(t,tz,end-start>48*3600000)}</text></g>;})}
   {threshold!==undefined&&(!log||threshold>0)&&<g><line x1={L} x2={W-R} y1={y(threshold)} y2={y(threshold)} stroke="#f5b66b66" strokeDasharray="4 5"/>{thresholdLabel&&<text x={W-R-5} y={y(threshold)-6} textAnchor="end" fill="#af916d" fontSize="10">{thresholdLabel}</text>}</g>}
   {markers.filter(m=>m.t>=start&&m.t<=end).map(m=><g key={m.label}><line x1={x(m.t)} x2={x(m.t)} y1={T} y2={H-B} stroke={m.color??'#ffffff35'} strokeDasharray="3 5"/><text x={x(m.t)+5} y={T+8} fill={m.color??'#aaa'} fontSize="9">{m.label}</text></g>)}
   <g clipPath={`url(#clip-${color.replace('#','')+H})`}>
    {paths.map((d,i)=><path key={i} d={d} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke"/>)}
    {overlayPaths.map((d,i)=><path key={'o'+i} d={d} fill="none" stroke={overlay?.color} strokeWidth="1.2" strokeDasharray="5 4" vectorEffect="non-scaling-stroke"/>)}
   </g>
   {!values.length&&<text x={W/2} y={H/2} textAnchor="middle" fill="#798a9b" fontSize="13">この期間の観測値がありません</text>}
   {display!==undefined&&display!==null&&display>=start&&display<=end&&<g><line x1={x(display)} x2={x(display)} y1={T} y2={H-B} stroke="#d5e4e770" strokeDasharray="2 3"/>{hit?.v!==null&&hit?.v!==undefined&&(!log||hit.v>0)&&<circle cx={x(hit.t)} cy={y(hit.v)} r="3" fill={color} stroke="#111b27" strokeWidth="2"/>}</g>}
  </svg>
  {hover!==null&&hit&&<div className="plot-tooltip" style={{left:`${Math.min(78,Math.max(7,(hover-start)/(end-start)*100))}%`}}><span>{formatTime(hit.t,tz)}</span><b style={{color}}>{formatValue(hit.v,2,log)} <small>{unit}</small></b>{hit.flag&&<small>品質フラグあり</small>}</div>}
 </div>;
}

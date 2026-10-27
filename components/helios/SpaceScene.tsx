'use client';
import { useEffect, useRef, useState } from 'react';
import { Layers3, RotateCcw, Move, Maximize2 } from 'lucide-react';
import { AU, DAY, DEG, parameters, propagate, coneIntersection } from '@/lib/physics';
import type { CME } from '@/lib/types';
type V=[number,number,number];
const add=(a:V,b:V):V=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const scale=(a:V,k:number):V=>[a[0]*k,a[1]*k,a[2]*k];
export function SpaceScene({cmes,selected,time,onSelect,w=450,gamma=.2e-7,model='dbm'}:{cmes:CME[];selected:string|null;time:number;onSelect:(id:string)=>void;w?:number;gamma?:number;model?:'dbm'|'ballistic'}){
 const canvas=useRef<HTMLCanvasElement>(null),box=useRef<HTMLDivElement>(null);
 const [view,setView]=useState<'3d'|'top'>('3d'),[showWind,setShowWind]=useState(true),[showAll,setShowAll]=useState(true),[zoom,setZoom]=useState(1);
 const camera=useRef({yaw:-.18,pitch:.70}),drag=useRef<{x:number;y:number;moved:boolean}|null>(null),hits=useRef<{x:number;y:number;id:string}[]>([]);
 const props=useRef({cmes,selected,time,w,gamma,model,view,showWind,showAll,zoom});props.current={cmes,selected,time,w,gamma,model,view,showWind,showAll,zoom};
 useEffect(()=>{
  const el=canvas.current,container=box.current;if(!el||!container)return;const ctx=el.getContext('2d');if(!ctx)return;
  let W=900,H=430,frame=0;
  const resize=new ResizeObserver(entries=>{W=entries[0].contentRect.width;H=entries[0].contentRect.height;const d=Math.min(devicePixelRatio||1,2);el.width=W*d;el.height=H*d;ctx.setTransform(d,0,0,d,0,0);});resize.observe(container);
  const draw=(now:number)=>{
   const p=props.current;ctx.clearRect(0,0,W,H);
   const cx=W*.47,cy=H*.49,unit=Math.min(W*.34,H*.55)*p.zoom;
   const yaw=camera.current.yaw,pitch=p.view==='top'?0:camera.current.pitch;
   const project=(a:V):[number,number,number]=>{const xx=a[0]*Math.cos(yaw)-a[1]*Math.sin(yaw),yy=a[0]*Math.sin(yaw)+a[1]*Math.cos(yaw);return [cx+xx*unit,cy+(yy*Math.cos(pitch)-a[2]*Math.sin(pitch))*unit,yy*Math.sin(pitch)+a[2]*Math.cos(pitch)];};
   const line=(points:V[],color:string,width=1,dash:number[]=[])=>{ctx.beginPath();points.forEach((v,i)=>{const q=project(v);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);};
   // Fixed decorative star field, never used as a particle measurement.
   for(let i=0;i<100;i++){const xx=((Math.sin(i*127.1)*43758.5453)%1+1)%1*W,yy=((Math.sin(i*311.7)*19341.412)%1+1)%1*H;ctx.fillStyle=i%9===0?'#b8d0e34a':'#a9c3d51b';ctx.fillRect(xx,yy,i%9===0?1.5:1,1);}
   for(const r of [.25,.5,.75,1,1.25]){
    line(Array.from({length:145},(_,i)=>[r*Math.cos(i/144*Math.PI*2),r*Math.sin(i/144*Math.PI*2),0] as V),r===1?'#6b9eaa35':'#768ca21a',1,r===1?[]:[2,5]);
    const at=project([r*.70,r*.714,0]);ctx.fillStyle='#63778a';ctx.font='10px ui-monospace,monospace';ctx.fillText(`${r.toFixed(2)} AU`,at[0]+4,at[1]+10);
   }
   for(let a=0;a<12;a++){const t=a*Math.PI/6;line([[0,0,0],[Math.cos(t)*1.3,Math.sin(t)*1.3,0]],'#73859b0c');}
   if(p.showWind){
    const omega=2*Math.PI/(25.38*86400),phase=(now/1000)*.018;
    for(let j=0;j<10;j++){
     const base=j/10*Math.PI*2+phase;
     const arr=Array.from({length:85},(_,i)=>{const r=.12+i/84*1.23,a=base-omega*r*AU/p.w;return [r*Math.cos(a),r*Math.sin(a),0] as V;});
     line(arr,'#61b2a51b',.7);
     for(let k=0;k<3;k++){const r=.12+((now/13000+k/3+j*.091)%1)*1.18,a=base-omega*r*AU/p.w,q=project([r*Math.cos(a),r*Math.sin(a),0]);ctx.fillStyle='#7ce4c47a';ctx.beginPath();ctx.arc(q[0],q[1],1.1,0,Math.PI*2);ctx.fill();}
    }
   }
   hits.current=[];
   const events=p.cmes.filter(c=>c.speed&&c.t0&&c.lat!==null&&c.lon!==null&&c.halfAngle!==null&&(p.showAll||c.id===p.selected)).filter(c=>p.time>=c.t0!&&p.time-c.t0!<8*DAY).sort((a,b)=>a.id===p.selected?1:b.id===p.selected?-1:0);
   for(const c of events){
    const params=parameters(c,p.w,p.gamma)!;const rr=propagate(params,(p.time-c.t0!)/1000,p.model).r/AU;if(rr>1.75||rr<.09)continue;
    const lat=c.lat!*DEG,lon=c.lon!*DEG,angle=Math.min(c.halfAngle!,89)*DEG;
    const axis:V=[Math.cos(lat)*Math.cos(lon),Math.cos(lat)*Math.sin(lon),Math.sin(lat)],u:V=[-Math.sin(lon),Math.cos(lon),0],v:V=[-Math.sin(lat)*Math.cos(lon),-Math.sin(lat)*Math.sin(lon),Math.cos(lat)];
    const at=(r:number,theta:number):V=>scale(add(scale(axis,Math.cos(angle)),add(scale(u,Math.sin(angle)*Math.cos(theta)),scale(v,Math.sin(angle)*Math.sin(theta)))),r);
    const chosen=c.id===p.selected,earth=coneIntersection(c),rgb=chosen?'245,177,107':earth?'94,205,182':'125,150,190';
    const cap=Array.from({length:73},(_,i)=>at(rr,i/72*Math.PI*2));
    ctx.beginPath();cap.forEach((v,i)=>{const q=project(v);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});ctx.closePath();ctx.fillStyle=`rgba(${rgb},${chosen?.09:.025})`;ctx.fill();
    line(cap,`rgba(${rgb},${chosen?.8:.23})`,chosen?1.3:.7);
    for(let k=0;k<12;k++)line([at(Math.max(.1,rr*.25),k/12*Math.PI*2),at(rr,k/12*Math.PI*2)],`rgba(${rgb},${chosen?.22:.065})`,.7);
    for(let j=1;j<5;j++)line(Array.from({length:49},(_,i)=>at(rr*(.25+j*.15),i/48*Math.PI*2)),`rgba(${rgb},${chosen?.13:.04})`,.7);
    line([[0,0,0],scale(axis,rr)],`rgba(${rgb},${chosen?.28:.06})`,.8,[3,5]);
    const tip=project(scale(axis,rr));hits.current.push({x:tip[0],y:tip[1],id:c.id});
    if(chosen){ctx.fillStyle='#edbc8b';ctx.font='10px ui-monospace,monospace';ctx.fillText(`${c.speed} km/s · ${rr.toFixed(2)} AU`,tip[0]+9,tip[1]-9);ctx.beginPath();ctx.arc(tip[0],tip[1],3,0,Math.PI*2);ctx.fill();}
   }
   const sun=project([0,0,0]),glow=ctx.createRadialGradient(sun[0],sun[1],2,sun[0],sun[1],52);glow.addColorStop(0,'#ffcb6fa0');glow.addColorStop(.25,'#f99a353b');glow.addColorStop(1,'#f0871c00');ctx.fillStyle=glow;ctx.fillRect(sun[0]-55,sun[1]-55,110,110);
   const disc=ctx.createRadialGradient(sun[0]-4,sun[1]-4,1,sun[0],sun[1],14);disc.addColorStop(0,'#ffe6a3');disc.addColorStop(.5,'#fac467');disc.addColorStop(1,'#dc6d25');ctx.fillStyle=disc;ctx.beginPath();ctx.arc(sun[0],sun[1],13,0,2*Math.PI);ctx.fill();
   ctx.fillStyle='#b18d63';ctx.font='10px ui-monospace,monospace';ctx.fillText('SUN',sun[0]-10,sun[1]+30);
   const earth=project([1,0,0]),earthGlow=ctx.createRadialGradient(earth[0],earth[1],2,earth[0],earth[1],23);earthGlow.addColorStop(0,'#6ac8ef50');earthGlow.addColorStop(1,'#6ac8ef00');ctx.fillStyle=earthGlow;ctx.fillRect(earth[0]-24,earth[1]-24,48,48);
   const ed=ctx.createRadialGradient(earth[0]-2,earth[1]-2,1,earth[0],earth[1],7);ed.addColorStop(0,'#91d5e5');ed.addColorStop(.6,'#438dc2');ed.addColorStop(1,'#132f54');ctx.fillStyle=ed;ctx.beginPath();ctx.arc(earth[0],earth[1],7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a6d9f158';ctx.lineWidth=.8;ctx.stroke();
   ctx.fillStyle='#c8d6df';ctx.font='10px ui-monospace,monospace';ctx.fillText('EARTH',earth[0]+13,earth[1]+4);ctx.fillStyle='#5c7b8b';ctx.fillText('1.000 AU',earth[0]+13,earth[1]+18);
   const l1=project([.99,0,0]);line([[.99,0,0],[.99,0,.18]],'#7196a14a',.8,[2,3]);const l1label=project([.99,0,.18]);ctx.fillStyle='#7ca5ad';ctx.fillText('L1',l1label[0]-4,l1label[1]-5);
   const ax=project([1.28,0,0]);ctx.fillStyle='#46576b';ctx.fillText('Earthward +X',ax[0]-45,ax[1]+34);
   frame=requestAnimationFrame(draw);
  };
  frame=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(frame);resize.disconnect();};
 },[]);
 return <div className="space-scene" ref={box}>
  <canvas ref={canvas} aria-label="CME伝播の操作可能な3次元模式図。太陽と地球の大きさは誇張。" onPointerDown={e=>{drag.current={x:e.clientX,y:e.clientY,moved:false};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(!drag.current)return;const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y;if(Math.abs(dx)+Math.abs(dy)>2)drag.current.moved=true;camera.current.yaw+=dx*.007;camera.current.pitch=Math.max(.1,Math.min(1.35,camera.current.pitch+dy*.005));drag.current.x=e.clientX;drag.current.y=e.clientY;}} onPointerUp={e=>{if(!drag.current?.moved){const rect=e.currentTarget.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;const hit=hits.current.map(h=>({...h,d:Math.hypot(h.x-x,h.y-y)})).sort((a,b)=>a.d-b.d)[0];if(hit&&hit.d<50)onSelect(hit.id);}drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onWheel={e=>setZoom(z=>Math.max(.6,Math.min(1.6,z-e.deltaY*.0007)))}/>
  <div className="scene-toolbar"><div className="segmented"><button className={view==='3d'?'active':''} onClick={()=>setView('3d')}><Layers3 size={12}/> 3D</button><button className={view==='top'?'active':''} onClick={()=>setView('top')}>TOP</button></div><button className="icon-button" title="視点をリセット" onClick={()=>{camera.current={yaw:-.18,pitch:.70};setZoom(1);}}><RotateCcw size={14}/></button></div>
  <div className="scene-legend"><span><i className="dot orange"/>選択中のCME</span><span><i className="dot mint"/>地球方向のコーン</span></div>
  <div className="scene-bottom"><span><Move size={11}/>ドラッグで回転 · スクロールで拡大</span><div><button className={showWind?'layer active':'layer'} onClick={()=>setShowWind(x=>!x)}>Parker spiral</button><button className={showAll?'layer active':'layer'} onClick={()=>setShowAll(x=>!x)}>全CME</button></div></div>
  <span className="scene-disclaimer">HEE方向の模式表示 · 天体サイズ誇張 · コーン間の相互作用なし</span>
 </div>;
}

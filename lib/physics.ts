import type { CME, ModelParams, Sample } from './types';
export const AU = 149_597_870.7;
export const RSUN = 695_700;
export const DEG = Math.PI / 180;
export const HOUR = 3_600_000;
export const DAY = 24*HOUR;

export function propagate(p: ModelParams, seconds: number, model: 'dbm'|'ballistic'='dbm') {
 if(seconds<0) return {r:p.r0,v:p.v0,started:false};
 const u=p.v0-p.w;
 if(model==='ballistic'||p.gamma===0||Math.abs(u)<1e-12) return {r:p.r0+p.v0*seconds,v:p.v0,started:true};
 const z=p.gamma*Math.abs(u)*seconds;
 return {r:p.r0+p.w*seconds+Math.sign(u)*Math.log1p(z)/p.gamma,v:p.w+u/(1+z),started:true};
}
export function arrival(p: ModelParams, model: 'dbm'|'ballistic'='dbm') {
 if(![p.v0,p.w,p.gamma,p.r0,p.target,p.t0].every(Number.isFinite)||p.v0<=0||p.w<=0||p.gamma<0||p.target<p.r0) return null;
 let low=0,high=3600;
 while(propagate(p,high,model).r<p.target&&high<120*86400)high*=2;
 if(propagate(p,high,model).r<p.target)return null;
 for(let i=0;i<80;i++){const mid=(low+high)/2;if(propagate(p,mid,model).r<p.target)low=mid;else high=mid;}
 const seconds=(low+high)/2;
 return {seconds,time:p.t0+seconds*1000,speed:propagate(p,seconds,model).v};
}
export function parameters(cme:CME,w=450,gamma=0.2e-7):ModelParams|null {
 return cme.speed&&cme.t0?{v0:cme.speed,w,gamma,r0:21.5*RSUN,t0:cme.t0,target:AU}:null;
}
export function coneSeparation(cme: CME) {
 if(cme.lon===null||cme.lat===null)return null;
 return Math.acos(Math.max(-1,Math.min(1,Math.cos(cme.lat*DEG)*Math.cos(cme.lon*DEG))))/DEG;
}
export function coneIntersection(cme:CME){
 const sep=coneSeparation(cme);
 return sep===null||cme.halfAngle===null?null:sep<=cme.halfAngle;
}
export function nearest(samples: Sample[]|undefined,t:number,maxGap=Infinity):Sample|null {
 if(!samples?.length)return null;
 let lo=0,hi=samples.length-1;
 while(lo<hi){const m=(lo+hi)>>1;if(samples[m].t<t)lo=m+1;else hi=m;}
 const a=samples[lo],b=samples[Math.max(0,lo-1)];const item=Math.abs(a.t-t)<Math.abs(b.t-t)?a:b;
 return Math.abs(item.t-t)<=maxGap?item:null;
}
export function latest(samples:Sample[]|undefined){return samples?.findLast(s=>s.v!==null)??null;}
export function intervalSample(samples:Sample[]|undefined,t:number,duration:number):Sample|null{
 if(!samples?.length)return null;let lo=0,hi=samples.length;
 while(lo<hi){const m=(lo+hi)>>1;if(samples[m].t<=t)lo=m+1;else hi=m;}
 const item=samples[lo-1];return item&&t<item.t+duration?item:null;
}
export function solarAltitude(lat:number,lon:number,time:number){
 const jd=time/86400000+2440587.5,n=jd-2451545;
 const L=(280.460+0.9856474*n)*DEG,g=(357.528+0.9856003*n)*DEG;
 const lambda=L+(1.915*Math.sin(g)+0.020*Math.sin(2*g))*DEG,epsilon=(23.439-0.0000004*n)*DEG;
 const dec=Math.asin(Math.sin(epsilon)*Math.sin(lambda)),ra=Math.atan2(Math.cos(epsilon)*Math.sin(lambda),Math.cos(lambda));
 const sidereal=(280.46061837+360.98564736629*(jd-2451545)+lon)*DEG;
 return Math.asin(Math.sin(lat*DEG)*Math.sin(dec)+Math.cos(lat*DEG)*Math.cos(dec)*Math.cos(sidereal-ra))/DEG;
}
export function greatCircle(a:[number,number],b:[number,number],fraction:number):[number,number]{
 const v=([lat,lon]:[number,number])=>[Math.cos(lat*DEG)*Math.cos(lon*DEG),Math.cos(lat*DEG)*Math.sin(lon*DEG),Math.sin(lat*DEG)];
 const u=v(a),w=v(b),omega=Math.acos(Math.max(-1,Math.min(1,u.reduce((s,x,i)=>s+x*w[i],0))));
 if(omega<1e-9)return a;
 const c=Math.sin((1-fraction)*omega)/Math.sin(omega),d=Math.sin(fraction*omega)/Math.sin(omega);
 const p=u.map((x,i)=>x*c+w[i]*d);
 return [Math.atan2(p[2],Math.hypot(p[0],p[1]))/DEG,Math.atan2(p[1],p[0])/DEG];
}
export function formatTime(t:number|undefined|null,tz='UTC',withDate=true){
 if(t===null||t===undefined||!Number.isFinite(t))return '—';
 return new Intl.DateTimeFormat('ja-JP',{timeZone:tz,month:withDate?'2-digit':undefined,day:withDate?'2-digit':undefined,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(t);
}
export function iso(t:number){return new Date(t).toISOString();}
export function formatValue(v:number|null|undefined,decimals=1,scientific=false){
 if(v===null||v===undefined||!Number.isFinite(v))return '—';
 return scientific?v.toExponential(1):v.toLocaleString('en-US',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
}
export function flareClass(flux:number|null|undefined){
 if(!flux||flux<=0)return '—';
 for(const [label,base]of [['X',1e-4],['M',1e-5],['C',1e-6],['B',1e-7],['A',1e-8]] as const)if(flux>=base)return `${label}${(flux/base).toFixed(1)}`;
 return '< A1';
}

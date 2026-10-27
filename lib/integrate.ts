/** Integrate measured flux only over covered, adjacent intervals. No gap filling. */
export function integrateFlux(series:[number,number|null,number|null][],channel:1|2,start:number,end:number){
 if(end<=start||!Number.isFinite(start)||!Number.isFinite(end))return {value:null,coverage:0};
 let area=0,covered=0;
 for(let i=1;i<series.length;i++){
  const a=series[i-1],b=series[i];if(b[0]<start||a[0]>end)continue;
  if(a[channel]===null||b[channel]===null||b[0]-a[0]>90000||b[0]<=a[0])continue;
  const lo=Math.max(start,a[0]),hi=Math.min(end,b[0]);if(hi<=lo)continue;
  const ya=a[channel]!,yb=b[channel]!;
  const vlo=ya+(yb-ya)*(lo-a[0])/(b[0]-a[0]),vhi=ya+(yb-ya)*(hi-a[0])/(b[0]-a[0]);
  area+=(vlo+vhi)/2*(hi-lo)/1000;covered+=hi-lo;
 }
 const coverage=covered/(end-start);
 return {value:coverage>=.999?area:null,coverage};
}

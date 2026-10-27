import { getAurora, fetchJSON } from '@/lib/server-data';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const q=new URL(request.url).searchParams;
 if(q.has('lat')){
  const lat=Number(q.get('lat')),lon=Number(q.get('lon'));
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return Response.json({error:'Invalid coordinates'},{status:400});
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high&forecast_days=3&timezone=UTC`;
  try{return Response.json({data:await fetchJSON(url,12000),sourceUrl:url,fetchedAt:new Date().toISOString()});}
  catch{return Response.json({error:'雲量データを取得できません',sourceUrl:url},{status:503});}
 }
 return Response.json(await getAurora(),{headers:{'Cache-Control':'private, no-store'}});
}

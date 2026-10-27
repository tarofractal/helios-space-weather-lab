import { getBundle } from '@/lib/server-data';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{return Response.json(await getBundle(new URL(request.url).searchParams.get('refresh')==='1'),{headers:{'Cache-Control':'private, no-store'}});}
 catch{return Response.json({error:'現在データを取得できません。保存済み観測をお使いください。'},{status:503});}
}

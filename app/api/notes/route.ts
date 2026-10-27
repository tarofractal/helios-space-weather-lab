import { env } from 'cloudflare:workers';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const owner=request.headers.get('oai-authenticated-user-id');
 if(!owner)return Response.json({notes:[],authenticated:false});
 try{
  const rows=await env.DB!.prepare('SELECT id,title,body,tags,created_at AS createdAt,updated_at AS updatedAt FROM research_notes WHERE owner=? ORDER BY updated_at DESC').bind(owner).all();
  return Response.json({notes:rows.results,authenticated:true});
 }catch{return Response.json({error:'ノートを読み込めませんでした。再試行してください。',authenticated:true},{status:503});}
}
export async function POST(request:Request){
 const owner=request.headers.get('oai-authenticated-user-id');
 if(!owner)return Response.json({error:'保存にはサインインが必要です。'},{status:401});
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Invalid origin'},{status:403});
 try{
  const data=await request.json() as {title?:string;body?:string;tags?:string};
  if(typeof data.title!=='string'||typeof data.body!=='string'||!data.title.trim()||data.title.length>180||data.body.length>64000||typeof(data.tags??'')!=='string'||(data.tags?.length??0)>500)return Response.json({error:'タイトル・本文の長さを確認してください。'},{status:400});
  const note={id:crypto.randomUUID(),title:data.title.trim(),body:data.body,tags:data.tags??'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  await env.DB!.prepare('INSERT INTO research_notes(id,owner,title,body,tags,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(note.id,owner,note.title,note.body,note.tags,note.createdAt,note.updatedAt).run();
  return Response.json({note},{status:201});
 }catch{return Response.json({error:'保存できませんでした。本文を残したまま再試行できます。'},{status:503});}
}

import { env } from 'cloudflare:workers';
export const dynamic='force-dynamic';
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){
 const owner=request.headers.get('oai-authenticated-user-id');if(!owner)return Response.json({error:'サインインが必要です。'},{status:401});
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Invalid origin'},{status:403});
 const {id}=await params;
 try{
  const d=await request.json() as {title?:string;body?:string;tags?:string};
  if(typeof d.title!=='string'||!d.title.trim()||d.title.length>180||typeof d.body!=='string'||d.body.length>64000||typeof(d.tags??'')!=='string'||(d.tags?.length??0)>500)return Response.json({error:'入力の長さを確認してください。'},{status:400});
  const updatedAt=new Date().toISOString();
  const r=await env.DB!.prepare('UPDATE research_notes SET title=?,body=?,tags=?,updated_at=? WHERE id=? AND owner=?').bind(d.title.trim(),d.body,d.tags??'',updatedAt,id,owner).run();
  if(!r.meta.changes)return Response.json({error:'ノートが見つかりません。'},{status:404});
  return Response.json({note:{id,title:d.title.trim(),body:d.body,tags:d.tags??'',updatedAt}});
 }catch{return Response.json({error:'保存できませんでした。再試行してください。'},{status:503});}
}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){
 const owner=request.headers.get('oai-authenticated-user-id');if(!owner)return Response.json({error:'サインインが必要です。'},{status:401});
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Invalid origin'},{status:403});
 const {id}=await params;
 try{const r=await env.DB!.prepare('DELETE FROM research_notes WHERE id=? AND owner=?').bind(id,owner).run();return Response.json({deleted:!!r.meta.changes});}
 catch{return Response.json({error:'削除できませんでした。'},{status:503});}
}

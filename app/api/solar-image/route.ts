export const dynamic='force-dynamic';
export async function GET(request:Request){
 const ch=new URL(request.url).searchParams.get('channel')==='304'?'0304':'0193';
 try{const r=await fetch(`https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_${ch}.jpg`,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error();return new Response(r.body,{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, max-age=600','X-Image-Source':'NASA SDO','Last-Modified':r.headers.get('Last-Modified')??new Date().toUTCString()}});}
 catch{return Response.redirect(new URL(`/images/sun-${ch==='0193'?'193':'304'}.jpg`,request.url),302);}
}

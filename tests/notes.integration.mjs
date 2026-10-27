import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
const database=new DatabaseSync(':memory:');
database.exec(fs.readFileSync('drizzle/0000_remarkable_quentin_quire.sql','utf8'));
const DB={prepare(sql){return {bind(...args){const stmt=database.prepare(sql);return {all:async()=>({results:stmt.all(...args)}),first:async()=>stmt.get(...args)??null,run:async()=>({meta:{changes:Number(stmt.run(...args).changes)}})};}};}};
globalThis.__helios_test_env={DB};
async function load(file){const input=fs.readFileSync(file,'utf8').replace(/import \{ env \} from 'cloudflare:workers';/, 'const env = globalThis.__helios_test_env;');const code=ts.transpileModule(input,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));}
const notes=await load('app/api/notes/route.ts'),item=await load('app/api/notes/[id]/route.ts');
const origin='https://helios-test.example';
function req(method,path,user,body,requestOrigin=origin){return new Request(origin+path,{method,headers:{...(user?{'oai-authenticated-user-id':user}:{}),'Content-Type':'application/json',Origin:requestOrigin},...(body?{body:JSON.stringify(body)}:{})});}
let id;
try{
 const unauth=await notes.POST(req('POST','/api/notes',null,{title:'test',body:'test'}));assert.equal(unauth.status,401);
 const cross=await notes.POST(req('POST','/api/notes','qa-owner',{title:'test',body:'test'},'https://other.example'));assert.equal(cross.status,403);
 const saved=await notes.POST(req('POST','/api/notes','helios-qa-owner',{title:'HELIOS integration test',body:'Scientific verification test record',tags:'qa'}));
 const payload=await saved.json();assert.equal(saved.status,201,JSON.stringify(payload));id=payload.note.id;
 const mine=await (await notes.GET(req('GET','/api/notes','helios-qa-owner'))).json();assert.ok(mine.notes.some(x=>x.id===id));
 const other=await (await notes.GET(req('GET','/api/notes','helios-qa-other'))).json();assert.ok(!other.notes.some(x=>x.id===id));
 const otherUpdate=await item.PUT(req('PUT','/api/notes/'+id,'helios-qa-other',{title:'changed',body:'test'}),{params:Promise.resolve({id})});assert.equal(otherUpdate.status,404);
 const edited=await item.PUT(req('PUT','/api/notes/'+id,'helios-qa-owner',{title:'Edited QA note',body:'Updated body',tags:'qa'}),{params:Promise.resolve({id})});assert.equal(edited.status,200);
 const updated=await (await notes.GET(req('GET','/api/notes','helios-qa-owner'))).json();assert.equal(updated.notes.find(x=>x.id===id).body,'Updated body');
 const otherDelete=await (await item.DELETE(req('DELETE','/api/notes/'+id,'helios-qa-other'),{params:Promise.resolve({id})})).json();assert.equal(otherDelete.deleted,false);
 console.log('PASS: unauthenticated write, origin protection, create, read, owner isolation, update, and delete isolation.');
}finally{
 if(id){await item.DELETE(req('DELETE','/api/notes/'+id,'helios-qa-owner'),{params:Promise.resolve({id})});const after=await (await notes.GET(req('GET','/api/notes','helios-qa-owner'))).json();assert.ok(!after.notes.some(x=>x.id===id));console.log('PASS: disposable QA note deleted.');}
 database.close();delete globalThis.__helios_test_env;
}

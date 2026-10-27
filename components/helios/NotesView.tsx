'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Check, Download, Edit3, FileText, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { STARTER_NOTES } from '@/lib/science';
import type { Note } from '@/lib/types';
import { formatTime } from '@/lib/physics';
import { Modal, Panel, downloadText } from './UI';

function NoteBody({text}:{text:string}){
 return <div className="note-body">{text.split('\n\n').map((block,i)=>{
  if(block.startsWith('## ')){const [head,...rest]=block.split('\n');return <section key={i}><h3>{head.slice(3)}</h3>{rest.length>0&&<p>{rest.join('\n')}</p>}</section>;}
  if(/^https?:\/\//.test(block)&&!block.includes('\n'))return <a key={i} href={block} target="_blank" rel="noreferrer">{block}<ArrowRight size={12}/></a>;
  if(block.startsWith('# '))return <h2 key={i}>{block.slice(2)}</h2>;
  if(block.startsWith('- '))return <ul key={i}>{block.split('\n').map((s,j)=><li key={j}>{s.replace(/^- /,'')}</li>)}</ul>;
  return <p key={i}>{block}</p>;
 })}</div>;
}
const template='## 問い\n何を知りたい？\n\n## 理論と式\n使った式・変数・単位を書く。\n\n## 操作して確かめたこと\nパラメータと結果を記録する。\n\n## 実データとの比較\n観測時刻・出典・確認できたことを書く。\n\n## 仮定と限界\nどこまで言える？\n\n## 次の問い\n次に何を試す？\n\n## 出典\nhttps://';
export function NotesView({onLab}:{onLab:()=>void}){
 const [notes,setNotes]=useState<Note[]>([]),[selected,setSelected]=useState<Note>(STARTER_NOTES[0]),[editing,setEditing]=useState(false),[draft,setDraft]=useState<Note|null>(null),[authenticated,setAuthenticated]=useState<boolean|null>(null),[saving,setSaving]=useState(false),[notice,setNotice]=useState(''),[confirmDelete,setConfirmDelete]=useState(false);
 useEffect(()=>{fetch('/api/notes').then(r=>r.json()).then(raw=>{const d=raw as {authenticated?:boolean;notes?:Note[];error?:string};setAuthenticated(d.authenticated??false);if(Array.isArray(d.notes))setNotes(d.notes);if(d.error)setNotice(d.error);}).catch(()=>setNotice('ノートを取得できません。再読み込みしてください。'));},[]);
 const current=draft??selected;
 const edit=(note:Note)=>{setDraft({...note,reference:false,id:note.reference?'new':note.id});setEditing(true);setNotice('');};
 const create=()=>{let saved:Note|null=null;try{const x=localStorage.getItem('helios-unsaved-note');if(x)saved=JSON.parse(x);}catch{}setDraft(saved??{id:'new',title:'新しい研究ノート',body:template,tags:'',updatedAt:new Date().toISOString()});setEditing(true);setNotice(saved?'この端末に残っていた下書きを復元しました。':'');};
 const change=(patch:Partial<Note>)=>{setDraft(d=>{const next={...(d??current),...patch};try{localStorage.setItem('helios-unsaved-note',JSON.stringify(next));}catch{}return next;});};
 const save=async()=>{
  if(!draft)return;setSaving(true);setNotice('');
  try{const r=await fetch(draft.id==='new'?'/api/notes':`/api/notes/${encodeURIComponent(draft.id)}`,{method:draft.id==='new'?'POST':'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:draft.title,body:draft.body,tags:draft.tags})});const d=await r.json() as {note:Note;error?:string};if(!r.ok)throw new Error(d.error??'保存できませんでした。');setNotes(n=>[d.note,...n.filter(x=>x.id!==d.note.id)]);setSelected(d.note);setDraft(null);setEditing(false);setNotice('保存しました。');try{localStorage.removeItem('helios-unsaved-note');}catch{}}
  catch(e){setNotice(e instanceof Error?e.message:'保存できませんでした。');}finally{setSaving(false);}
 };
 const remove=async()=>{setSaving(true);try{const r=await fetch(`/api/notes/${selected.id}`,{method:'DELETE'});if(!r.ok)throw new Error();setNotes(n=>n.filter(x=>x.id!==selected.id));setSelected(STARTER_NOTES[0]);setConfirmDelete(false);setNotice('削除しました。');}catch{setNotice('削除できませんでした。');}finally{setSaving(false);}};
 return <>
  <div className="workspace-intro notes-intro"><div><span className="eyebrow">RESEARCH NOTEBOOK</span><h2>学んだことを、自分の言葉で。</h2><p>問い・数式・実験・観測をつなぐノート。保存したノートは同じアカウントで読み返せます。</p></div><button className="primary-button" onClick={create}><Plus size={15}/>ノートを書く</button></div>
  <div className="notebook-layout"><aside className="notebook-list"><div className="eyebrow">YOUR NOTES <span>{notes.length}</span></div>{notes.length===0&&<p className="notebook-empty">最初の発見を記録してみましょう。</p>}{notes.map(n=><button key={n.id} className={selected.id===n.id&&!editing?'active':''} onClick={()=>{setSelected(n);setDraft(null);setEditing(false);}}><FileText size={15}/><div><b>{n.title}</b><small>{formatTime(Date.parse(n.updatedAt),'UTC')}</small></div></button>)}<div className="eyebrow reference-label">STARTER NOTES</div>{STARTER_NOTES.map((n,i)=><button key={n.id} className={selected.id===n.id&&!editing?'active':''} onClick={()=>{setSelected(n);setDraft(null);setEditing(false);}}><span className="note-index">0{i+1}</span><div><b>{n.title}</b><small>{n.tags}</small></div></button>)}<div className="notebook-lab-link"><BookOpen size={20}/><h3>式を、動かしてみる。</h3><p>パラメータの変化をノートの考察につなげましょう。</p><button className="text-button" onClick={onLab}>モデル実験室へ <ArrowRight size={13}/></button></div></aside>
  <Panel className="note-sheet"><div className="note-sheet-toolbar"><span className="eyebrow">{editing?'DRAFT':selected.reference?'REFERENCE NOTE':'SAVED NOTE'}</span><div className="heading-actions"><button className="icon-button" title="Markdownを書き出す" onClick={()=>downloadText((current.title||'research-note').replace(/[^\p{L}\p{N}._-]/gu,'_')+'.md',`# ${current.title}\n\n${current.body}\n`,'text/markdown')}><Download size={15}/></button>{editing?<><button className="small-button" onClick={()=>{setEditing(false);setDraft(null);}}>閉じる</button><button className="primary-button" onClick={save} disabled={saving||!current.title.trim()}>{saving?<Loader2 size={14} className="spinning"/>:<Save size={14}/>}保存</button></>:<><button className="small-button" onClick={()=>edit(selected)}><Edit3 size={14}/>{selected.reference?'コピーして編集':'編集'}</button>{!selected.reference&&<button className="icon-button" title="このノートを削除" onClick={()=>setConfirmDelete(true)}><Trash2 size={14}/></button>}</>}</div></div>
   {notice&&<div role="status" className="note-notice">{notice}</div>}
   {editing?<div className="note-editor"><label className="field-label">タイトル<input value={current.title} maxLength={180} onChange={e=>change({title:e.target.value})}/></label><label className="field-label">タグ · カンマ区切り<input value={current.tags} maxLength={500} placeholder="CME, DBM, 実験" onChange={e=>change({tags:e.target.value})}/></label><label className="field-label">本文 · Markdown<textarea aria-label="研究ノート本文" value={current.body} maxLength={64000} onChange={e=>change({body:e.target.value})}/></label><p className="fine-print">保存前の下書きはこの端末に残ります。保存ボタンを押すとアカウントに保存します。</p>{authenticated===false&&<a className="small-button" target="_top" href="/signin-with-chatgpt?return_to=%2F%3Fview%3Dnotes">サインインして保存する <ArrowRight size={12}/></a>}</div>:<article><div className="note-tags">{selected.tags.split(',').filter(Boolean).map(t=><span key={t}>{t}</span>)}</div><h1>{selected.title}</h1><div className="note-byline">{selected.reference?'HELIOS · 学習用の参考ノート':'Your research note'}<span>更新 {formatTime(Date.parse(selected.updatedAt),'UTC')} UTC</span></div><NoteBody text={selected.body}/></article>}
  </Panel></div>
  {confirmDelete&&<Modal title="このノートを削除しますか？" onClose={()=>setConfirmDelete(false)}><p className="paragraph">「{selected.title}」を削除します。必要なら先にMarkdownで書き出してください。</p><div className="modal-actions"><button className="small-button" onClick={()=>setConfirmDelete(false)}>キャンセル</button><button className="danger-button" disabled={saving} onClick={remove}>削除する</button></div></Modal>}
 </>;
}

'use client';
import { X, ExternalLink, ArrowUpRight, Download } from 'lucide-react';
import type { ReactNode } from 'react';
export function Panel({title,kicker,action,children,className=''}:{title?:ReactNode;kicker?:string;action?:ReactNode;children:ReactNode;className?:string}){
 return <section className={'panel '+className}>{(title||action)&&<div className="panel-heading"><div>{kicker&&<div className="eyebrow">{kicker}</div>}<h2>{title}</h2></div>{action}</div>}{children}</section>;
}
export function SourceLink({href,children}:{href:string;children?:ReactNode}){return <a className="source-link" href={href} target="_blank" rel="noreferrer">{children??'出典を開く'}<ArrowUpRight size={12}/></a>;}
export function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){
 return <div className="modal-backdrop" onClick={onClose}><div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={e=>e.stopPropagation()}><div className="modal-header"><h2>{title}</h2><button className="icon-button" aria-label="閉じる" onClick={onClose}><X size={18}/></button></div>{children}</div></div>;
}
export function Empty({children}:{children:ReactNode}){return <div className="empty-state">{children}</div>;}
export function downloadText(name:string,content:string,mime='text/plain'){
 const url=URL.createObjectURL(new Blob([content],{type:mime})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
export function formatAge(t:number|null){if(!t)return '時刻不明';const m=Math.max(0,Math.floor((Date.now()-t)/60000));return m<1?'1分以内':m<60?`${m}分前`:m<1440?`${Math.floor(m/60)}時間前`:`${Math.floor(m/1440)}日前`;}

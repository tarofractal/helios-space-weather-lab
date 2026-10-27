import type { Note } from './types';
export const PAPER_URL='https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2025SW004635';
export type FeatureKey='bDecay'|'aDecay'|'aPre'|'bPre'|'bRise'|'aRise'|'density'|'speed';
export const FEATURES:Record<FeatureKey,{code:string;label:string;unit:string;min:number;max:number;log:boolean;when:string}>={
 bDecay:{code:'F-xrsb_decay',label:'XRS-B 減衰区間の積分',unit:'J/m²',min:-6,max:-2,log:true,when:'フレアのピーク → 終了'},
 aDecay:{code:'F-xrsa_decay',label:'XRS-A 減衰区間の積分',unit:'J/m²',min:-7,max:-3,log:true,when:'フレアのピーク → 終了'},
 aPre:{code:'F-xrsa_4h',label:'XRS-A フレア前4時間',unit:'J/m²',min:-8,max:-3,log:true,when:'フレア開始前の4時間'},
 bPre:{code:'F-xrsb_4h',label:'XRS-B フレア前4時間',unit:'J/m²',min:-6,max:-1,log:true,when:'フレア開始前の4時間'},
 bRise:{code:'F-xrsb_rise',label:'XRS-B 上昇区間の積分',unit:'J/m²',min:-6,max:-2,log:true,when:'フレア開始 → ピーク'},
 aRise:{code:'F-xrsa_rise',label:'XRS-A 上昇区間の積分',unit:'J/m²',min:-7,max:-3,log:true,when:'フレア開始 → ピーク'},
 density:{code:'W-Density',label:'フレア後の太陽風密度',unit:'cm⁻³',min:0,max:30,log:false,when:'SOHO/CELIAS · フレア終了後1時間平均'},
 speed:{code:'W-Spd',label:'フレア後の太陽風速度',unit:'km/s',min:200,max:1000,log:false,when:'SOHO/CELIAS · フレア終了後1時間平均'},
};
export type Rule={id:string;target:0|1|2;weight:number;positive:number;positiveTotal:number;negative:number;negativeTotal:number;terms:{key:FeatureKey;op:'<'|'>=';threshold:number}[]};
export const RULES:Rule[]=[
 {id:'KC-01',target:0,weight:0.3732,positive:1249,positiveTotal:1800,negative:2,negativeTotal:62,terms:[{key:'bDecay',op:'<',threshold:3.97e-4},{key:'aDecay',op:'<',threshold:4.43e-5},{key:'aPre',op:'>=',threshold:2.43e-6}]},
 {id:'KC-02',target:1,weight:1.2089,positive:28,positiveTotal:39,negative:107,negativeTotal:1823,terms:[{key:'bDecay',op:'>=',threshold:3.97e-4},{key:'bPre',op:'<',threshold:1.05e-3},{key:'density',op:'>=',threshold:2.69},{key:'density',op:'<',threshold:9.15}]},
 {id:'KC-03',target:1,weight:0.1874,positive:29,positiveTotal:39,negative:156,negativeTotal:1823,terms:[{key:'bDecay',op:'>=',threshold:3.97e-4},{key:'aPre',op:'>=',threshold:2.43e-6},{key:'density',op:'<',threshold:9.15}]},
 {id:'KC-04',target:2,weight:1.6476,positive:22,positiveTotal:23,negative:176,negativeTotal:1839,terms:[{key:'bRise',op:'>=',threshold:3.01e-4},{key:'aRise',op:'>=',threshold:4.68e-5},{key:'aDecay',op:'>=',threshold:4.43e-5}]},
 {id:'KC-05',target:2,weight:1.0411,positive:20,positiveTotal:23,negative:122,negativeTotal:1839,terms:[{key:'bRise',op:'>=',threshold:3.01e-4},{key:'aDecay',op:'>=',threshold:4.43e-5},{key:'speed',op:'>=',threshold:367}]},
];
export function evaluateRule(rule:Rule,values:Partial<Record<FeatureKey,number|null>>):boolean|null{
 let missing=false;
 for(const term of rule.terms){const v=values[term.key];if(v===null||v===undefined){missing=true;continue;}if(term.op==='<'?v>=term.threshold:v<term.threshold)return false;}
 return missing?null:true;
}
export const DEFAULT_FEATURES:Record<FeatureKey,number>={bDecay:5e-4,aDecay:6e-5,aPre:3e-6,bPre:8e-4,bRise:4e-4,aRise:6e-5,density:5.5,speed:450};
export const CITIES=[
 {id:'fairbanks',name:'フェアバンクス',en:'Fairbanks, Alaska',lat:64.8378,lon:-147.7164},
 {id:'tromso',name:'トロムソ',en:'Tromsø, Norway',lat:69.6492,lon:18.9553},
 {id:'reykjavik',name:'レイキャビク',en:'Reykjavík, Iceland',lat:64.1466,lon:-21.9426},
 {id:'yellowknife',name:'イエローナイフ',en:'Yellowknife, Canada',lat:62.454,lon:-114.377},
 {id:'sapporo',name:'札幌',en:'Sapporo, Japan',lat:43.0618,lon:141.3545},
 {id:'ushuaia',name:'ウシュアイア',en:'Ushuaia, Argentina',lat:-54.8019,lon:-68.303},
];
export const STARTER_NOTES:Note[]=[
 {id:'reference-1',title:'CME・フレア・SEPは、何が違う？',tags:'基礎,太陽活動',updatedAt:'2026-10-27T00:00:00Z',reference:true,body:'## 問い\n太陽で一つの爆発が起きたら、地球ではすべてが同時に起きるのだろうか。\n\n## 物理の見方\nフレアで増える電磁放射、放出された磁場を伴うプラズマのCME、加速された高エネルギー粒子のSEPは、それぞれ違うものを観測している。時間スケールも、地球への影響も一致するとは限らない。\n\n## このサイトで確かめる\n「過去イベント」でX線、陽子、太陽風、Bz、Kpを同じ時間軸で見る。ピークの時刻を比べ、対応関係を推測する前に観測の場所と対象を確認する。\n\n## 注意する仮定\n時刻が近いことだけでは、同じ原因によると確定できない。複数CMEが重なるイベントでは、関連付けを公的な記録と照合する。\n\n## 次の問い\n磁気的につながる方向は、SEPの観測にどう影響するのか。\n\n## 出典\nhttps://www.spaceweather.gov/phenomena/coronal-mass-ejections'},
 {id:'reference-2',title:'速いCMEは、ずっと速いまま進む？',tags:'モデル,DBM',updatedAt:'2026-10-27T00:00:00Z',reference:true,body:'## 問い\nコロナグラフで測った速度を、そのまま地球まで使ってよいのだろうか。\n\n## モデル\n等速モデル：r(t) = r₀ + v₀(t − t₀)\n抗力モデル：dv/dt = −γ(v − w)|v − w|\n\n## 変数と単位\nv はCME速度、w は背景太陽風速度（km/s）。γ は km⁻¹。時刻差は秒、距離はkmで計算する。t₀は基準距離r₀に対応した時刻を使う。\n\n## このサイトで確かめる\n「モデル実験室」で初速度と抗力係数を変える。v₀ > wなら減速し、v₀ < wなら加速する。γ = 0なら等速モデルに一致する。\n\n## 限界\n一定の背景風速と抗力係数を仮定している。CME同士の相互作用や、複雑な磁場を直接解くものではない。\n\n## 次の問い\n到着時刻のずれは、入力速度と背景風速のどちらに敏感だろうか。\n\n## 出典\nhttps://ccmc.gsfc.nasa.gov/models/DBM~cdbm_201510/'},
 {id:'reference-3',title:'「22 / 23」が予測確率ではない理由',tags:'SEP,検証',updatedAt:'2026-10-27T00:00:00Z',reference:true,body:'## 問い\nある条件が高リスク事例の多くに当てはまったら、その条件で高リスクと予測できるのだろうか。\n\n## 見るべきもの\n対象クラスの中でどれだけ条件に該当するかと、条件に該当した集団の中で対象クラスがどれだけあるかは、分母が違う。非対象クラスが同じ条件に当てはまる件数も見る必要がある。\n\n## このサイトで確かめる\n「論文エクスプローラー」で各条件式の対象クラスと他クラスの成立件数を比較する。スライダーは条件の論理構造を調べるための仮想入力で、現在のSEP予測ではない。\n\n## 予測に進むために\n学習に使っていない事例で、見逃しと誤警報を評価する。確率を出すなら、その確率と実際の発生率が整合するかを確認する。\n\n## 次の問い\nフレア終了後にしか得られない特徴量を使ったとき、予測の先行時間はどれくらい残るのか。\n\n## 出典\n'+PAPER_URL},
];

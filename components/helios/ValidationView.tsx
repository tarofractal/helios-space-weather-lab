'use client';
import { CheckCircle2, Info, ShieldCheck } from 'lucide-react';
import { AU, HOUR, RSUN, arrival, formatTime, formatValue, propagate } from '@/lib/physics';
import type { WeatherBundle, MetricKey } from '@/lib/types';
import { METRICS } from '@/lib/types';
import { VALIDATION_PARAMS } from './ModelLab';
import { Panel, SourceLink } from './UI';
export function ValidationView({live,replay,tz}:{live:WeatherBundle;replay:WeatherBundle|null;tz:string}){
 const p=VALIDATION_PARAMS,a=arrival(p)!,b=arrival(p,'ballistic')!,observed=Date.parse('2010-04-05T12:00Z');
 const equal={...p,v0:450,w:450},slow={...p,v0:300,w:500};
 const checks=[
  {label:'初期位置がr₀に一致',value:propagate(p,0).r,expected:p.r0,tolerance:1e-8,unit:'km'},
  {label:'初期速度がv₀に一致',value:propagate(p,0).v,expected:p.v0,tolerance:1e-8,unit:'km/s'},
  {label:'γ = 0で等速に一致',value:propagate({...p,gamma:0},86400).r,expected:p.r0+p.v0*86400,tolerance:1e-6,unit:'km'},
  {label:'v₀ = wで速度は一定',value:propagate(equal,86400).v,expected:450,tolerance:1e-8,unit:'km/s'},
  {label:'低速CMEは背景へ加速',value:propagate(slow,86400).v,expected:null,tolerance:0,unit:'km/s',pass:propagate(slow,86400).v>300&&propagate(slow,86400).v<500},
  {label:'到達点が1 AUに一致',value:propagate(p,a.seconds).r/AU,expected:1,tolerance:1e-10,unit:'AU'},
  {label:'既知入力の到達時間',value:a.seconds/3600,expected:52.30830956194,tolerance:1e-7,unit:'h'},
  {label:'既知入力の到達速度',value:a.speed,expected:619.6681567925,tolerance:1e-6,unit:'km/s'},
 ];
 return <>
  <div className="workspace-intro"><span className="eyebrow">VALIDATION & PROVENANCE</span><h2>計算の正しさと、予測の精度を分ける。</h2><p>数値の検算、観測とのずれ、元データの欠測を確認します。評価件数と対象の定義を常に一緒に表示します。</p></div>
  <div className="validation-summary"><div><ShieldCheck size={22}/><div><strong>{checks.filter(c=>c.pass??Math.abs(c.value-c.expected!)<=c.tolerance).length} / {checks.length}</strong><span>数値・極限の検算</span></div><span className="badge mint">PASS</span></div><div><span className="validation-n">01</span><div><strong>1 event</strong><span>観測到着との比較ケース</span></div><span className="badge neutral">CASE STUDY</span></div><div><span className="validation-n">06</span><div><strong>6 days</strong><span>再生用の実観測データ</span></div><span className="badge purple">ARCHIVE</span></div></div>
  <Panel title="DBMの数値検算" kicker="IMPLEMENTATION CHECKS" action={<SourceLink href="https://www.frontiersin.org/journals/astronomy-and-space-sciences/articles/10.3389/fspas.2021.639986/full">入力例の原典</SourceLink>}><p className="panel-description">2010年4月3日：r₀=20 R☉、t₀=13:24 UTC、v₀=920 km/s、w=450 km/s、γ=0.2×10⁻⁷ km⁻¹。1 AU=149,597,870.7 km、R☉=695,700 kmで計算します。</p><div className="table-scroll"><table className="data-table"><thead><tr><th>確認する性質</th><th>計算結果</th><th>期待値・判定</th><th>状態</th></tr></thead><tbody>{checks.map(c=>{const pass=c.pass??Math.abs(c.value-c.expected!)<=c.tolerance;return <tr key={c.label}><td>{c.label}</td><td>{formatValue(c.value,c.unit==='AU'?10:5)} {c.unit}</td><td>{c.expected===null?'300 < v < 500':formatValue(c.expected,c.unit==='AU'?10:5)+' '+c.unit}</td><td><span className={'check-state '+(pass?'mint-text':'orange-text')}><CheckCircle2 size={14}/>{pass?'PASS':'FAIL'}</span></td></tr>;})}</tbody></table></div></Panel>
  <Panel title="観測到着と比較する" kicker="2010-04-03 CME · ICME ARRIVAL"><div className="arrival-comparison"><div><span>観測 ICME到着</span><strong>{formatTime(observed,tz)}</strong><small>Dumbović et al. (2021) の記載</small></div><div><span>DBMによる1 AU到達</span><strong className="mint-text">{formatTime(a.time,tz)}</strong><small>{((a.time-observed)/HOUR).toFixed(2)} h 遅い</small></div><div><span>等速による1 AU到達</span><strong className="orange-text">{formatTime(b.time,tz)}</strong><small>{((b.time-observed)/HOUR).toFixed(2)} h の符号付き誤差</small></div></div><div className="context-strip compact"><Info size={14}/><p>評価はこの1件です。論文の丸めたDBM出力17:39 UTC・620 km/sとは、採用した定数等により約3.5分差があります。複数イベントでの平均的な予測精度は、まだ評価していません。</p></div></Panel>
  <Panel title="観測データの品質を確認する" kicker="MISSING VALUES ARE NOT ZERO"><div className="table-scroll"><table className="data-table"><thead><tr><th>データセット</th><th>系列</th><th>点数</th><th>欠測点</th><th>欠測率</th><th>表示上の処理</th></tr></thead><tbody>{[{name:'最新観測',data:live},{name:'2024年5月',data:replay}].flatMap(({name,data})=>data?(Object.keys(data.series) as MetricKey[]).map(k=>{const points=data.series[k]??[],missing=points.filter(s=>s.v===null).length;return <tr key={name+k}><td>{name}</td><td>{METRICS[k]?.label??k}</td><td>{points.length.toLocaleString()}</td><td>{missing.toLocaleString()}</td><td>{points.length?(missing/points.length*100).toFixed(1):'—'}%</td><td className="muted">null保持 · 線を接続しない</td></tr>;}):[])}</tbody></table></div><p className="panel-description">行自体が存在しない時間と、値がnullの行は異なります。この表はnullの件数を数え、グラフでは長い時間の空白も接続しません。Kpの3時間値を1分観測に変換していません。</p></Panel>
  <Panel title="時刻と出典のルール" kicker="REPRODUCIBILITY"><div className="assumptions-grid"><div><b>観測場所を保持</b><p>ライブ太陽風はL1観測。再生用OMNIは地球近傍到達時刻へシフト済みで、同じ時刻基準ではありません。</p></div><div><b>研究用の過去データ</b><p>GOES X線は後日再処理されたscience版です。当日に利用できた速報と同一ではありません。</p></div><div><b>SEPモデルの評価</b><p>正式モデルは未接続。TSS・見逃し・誤警報・確率校正は、未知事例による検証が必要です。</p></div></div><div className="source-row"><SourceLink href="https://omniweb.gsfc.nasa.gov/html/omni_min_data.html">OMNIの時刻定義</SourceLink><SourceLink href="/data/replay-provenance.json">履歴データの処理記録</SourceLink><SourceLink href="/data/replay-gannon.json">再生用データ JSON</SourceLink></div></Panel>
 </>;
}

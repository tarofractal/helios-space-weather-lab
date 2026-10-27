export type Sample = { t: number; v: number | null; source?: string; quality?: number | null; flag?: string };
export type MetricKey = 'speed'|'density'|'bz'|'bt'|'kp'|'xray'|'proton'|'dst'|'pressure';
export type Series = Partial<Record<MetricKey, Sample[]>>;
export type CME = {
 id: string; start: number; t0: number | null; speed: number | null; lat: number | null;
 lon: number | null; halfAngle: number | null; type: string; source: string; note: string;
 link: string; analysisLink: string; region: number | null; officialArrival: number | null;
 analysisAt: number | null; related: string[];
};
export type Flare = { id: string; start: number; peak: number; end: number; class: string; region: number | null; location: string; link: string; related: string[] };
export type FeedStatus = { id: string; label: string; sourceUrl: string; fetchedAt: string; lastObserved: number | null; count: number; state: 'live'|'snapshot'|'unavailable'; error?: string; timeReference?: string };
export type WeatherBundle = { fetchedAt: string; series: Series; cmes: CME[]; flares: Flare[]; forecast: Sample[]; feeds: FeedStatus[]; mode: 'live'|'snapshot'|'replay'; title?: string; description?: string };
export type AuroraData = { observationTime: string; forecastTime: string; coordinates: number[][]; fetchedAt: string; mode: 'live'|'snapshot'; sourceUrl: string };
export type Note = { id: string; title: string; body: string; tags: string; updatedAt: string; createdAt?: string; reference?: boolean };
export type View = 'overview'|'replay'|'models'|'paper'|'aurora'|'notes'|'validation';
export type ModelParams = { v0: number; w: number; gamma: number; r0: number; t0: number; target: number };

export const METRICS: Record<MetricKey,{label:string;en:string;unit:string;color:string;decimals:number;log?:boolean;threshold?:number;hint:string}> = {
 speed:{label:'太陽風速度',en:'Solar wind',unit:'km/s',color:'#64d7c2',decimals:0,hint:'L1上流で観測された陽子の速度'},
 density:{label:'陽子密度',en:'Proton density',unit:'cm⁻³',color:'#8f9fff',decimals:1,hint:'単位体積あたりの太陽風陽子数'},
 bz:{label:'南北磁場 Bz',en:'IMF · GSM',unit:'nT',color:'#f5b66b',decimals:1,threshold:0,hint:'GSM座標の磁場南北成分。負は南向き'},
 bt:{label:'磁場強度 Bt',en:'Total magnetic field',unit:'nT',color:'#99b7d1',decimals:1,hint:'惑星間磁場の大きさ'},
 kp:{label:'地磁気 Kp',en:'Planetary K-index',unit:'',color:'#b89bff',decimals:2,threshold:5,hint:'3時間ごとの惑星規模の地磁気活動指数'},
 xray:{label:'太陽X線',en:'GOES · 0.1–0.8 nm',unit:'W/m²',color:'#ff9e6d',decimals:2,log:true,threshold:1e-5,hint:'GOES長波長チャンネルのX線フラックス'},
 proton:{label:'高エネルギー陽子',en:'GOES · ≥10 MeV',unit:'pfu',color:'#f08daf',decimals:2,log:true,threshold:10,hint:'10 MeV以上の陽子の積分フラックス。線量とは異なる'},
 dst:{label:'地磁気 Dst / SYM-H',en:'Storm-time disturbance',unit:'nT',color:'#a498e8',decimals:0,hint:'出典に記したDstまたはSYM-H。時間分解能は異なる'},
 pressure:{label:'動圧',en:'Dynamic pressure',unit:'nPa',color:'#84c7fa',decimals:2,hint:'太陽風の運動量流束'},
};

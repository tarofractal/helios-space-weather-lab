"""Fetch actual public observations and retain a compact, attributed snapshot."""
import concurrent.futures as cf
import datetime as dt
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
now = dt.datetime.now(dt.timezone.utc)
start = (now - dt.timedelta(days=21)).strftime('%Y-%m-%d')
end = now.strftime('%Y-%m-%d')
feeds = {
 'wind':'https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json',
 'mag':'https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json',
 'kp':'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
 'forecast':'https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json',
 'xray':'https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json',
 'proton':'https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json',
 'cme':f'https://ccmc.gsfc.nasa.gov/DONKI-API/get/CME?startDate={start}&endDate={end}',
 'flare':f'https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate={start}&endDate={end}',
 'historicalCme':'https://ccmc.gsfc.nasa.gov/DONKI-API/get/CME?startDate=2024-05-07&endDate=2024-05-12',
 'historicalFlare':'https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=2024-05-08&endDate=2024-05-13',
 'aurora':'https://services.swpc.noaa.gov/json/ovation_aurora_latest.json',
}

def fetch(item):
 name,url=item
 try:
  req=urllib.request.Request(url, headers={'User-Agent':'HELIOS-SpaceWeatherLab/1.0'})
  with urllib.request.urlopen(req,timeout=35) as r: data=json.load(r)
  out={'sourceUrl':url,'retrievedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'data':data}
  (ROOT/'data'/f'raw-{name}.json').write_text(json.dumps(out,separators=(',',':')))
  preview=data[0] if isinstance(data,list) and data else list(data)[:5] if isinstance(data,dict) else str(data)[:100]
  return {'feed':name,'ok':True,'length':len(data),'first':preview}
 except Exception as exc:
  return {'feed':name,'ok':False,'error':str(exc)}

if __name__=='__main__':
 with cf.ThreadPoolExecutor(max_workers=7) as pool:
  for result in pool.map(fetch,feeds.items()): print(json.dumps(result,ensure_ascii=False),flush=True)

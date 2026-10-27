from pathlib import Path
import urllib.request
import concurrent.futures as cf
assets={
 'public/images/sun-193.jpg':'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_0193.jpg',
 'public/images/sun-304.jpg':'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_0304.jpg',
 'public/data/land.json':'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson',
}
def download(item):
 name,url=item
 try:
  r=urllib.request.urlopen(url,timeout=25)
  body=r.read();Path(name).write_bytes(body)
  return {'file':name,'bytes':len(body),'source':url,'lastModified':r.headers.get('Last-Modified')}
 except Exception as e:return {'file':name,'error':str(e)}
if __name__=='__main__':
 import json
 with cf.ThreadPoolExecutor(max_workers=3) as p:result=list(p.map(download,assets.items()))
 Path('public/data/image-sources.json').write_text(json.dumps(result))
 print(json.dumps(result))

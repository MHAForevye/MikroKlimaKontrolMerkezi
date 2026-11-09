"""Türkiye METAR'larını (LT***) aviationweather.gov'dan çekip tek küçük JSON'a birleştirir. Son 72 saati tutar."""
import json, os, sys, time, urllib.request

SRC = os.environ.get('METAR_SRC', 'https://aviationweather.gov/api/data/metar?bbox=35.5,25.5,42.5,45.0&format=json&hours=3')
OUT = 'out/metar-tr.json'
KEEP = 72 * 3600
now = int(time.time())

req = urllib.request.Request(SRC, headers={'User-Agent': 'mikro-klima-kontrol-merkezi-metar/1.0'})
with urllib.request.urlopen(req, timeout=60) as r:
    body = r.read()
new = json.loads(body) if body.strip() else []   # boş cevap = veri yok (204)

st = {}
if os.path.exists(OUT):
    try:
        st = json.load(open(OUT, encoding='utf-8')).get('st', {})
    except Exception as e:
        # bozuk dosyayı yok sayıp 72 saatlik geçmişi sıfırlamak yerine işi hatayla bitir
        sys.exit('önceki metar-tr.json okunamadı, geçmiş korunsun diye durduruldu: %r' % (e,))

for m in new:
    i = m.get('icaoId') or ''
    if not i.startswith('LT') or m.get('temp') is None or not m.get('obsTime'):
        continue
    s = st.setdefault(i, {'n': m.get('name', ''), 'lat': m.get('lat'), 'lon': m.get('lon'), 'el': m.get('elev'), 'o': []})
    row = [m['obsTime'], m['temp'], m.get('wdir'), m.get('wspd'), m.get('wgst'), m.get('altim'), m.get('wxString') or '']
    if all(x[0] != row[0] for x in s['o']):
        s['o'].append(row)

for s in st.values():
    s['o'] = sorted([x for x in s['o'] if x[0] > now - KEEP], key=lambda x: x[0])
st = {k: v for k, v in st.items() if v['o'] and v.get('lat') is not None}

os.makedirs('out', exist_ok=True)
json.dump({'upd': now, 'st': st}, open(OUT, 'w', encoding='utf-8'), separators=(',', ':'), ensure_ascii=False)
print(len(st), 'istasyon,', sum(len(v['o']) for v in st.values()), 'ölçüm')

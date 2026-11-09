import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { catOf, scoreOf, MEAN, MED, wmed, escHtml, rtWhen, sadeText } = createRequire(import.meta.url)('../js/core.js');

const dry = { hum: 40, temp: 25, dew: 5, cloud: 0, pop: 0, cape: 0, precip: 0, code: 0 };

test('scoreOf: açık ve kuru gün 0', () => assert.equal(scoreOf(dry), 0));
test('scoreOf: tam doygun, kapalı, yağışlı hava 10 (üst sınır)', () =>
  assert.equal(scoreOf({ hum: 100, temp: 10, dew: 10, cloud: 100, pop: 100, cape: 3000 }), 10));
test('scoreOf: eksik alanlar NaN üretmez', () => {
  const v = scoreOf({});
  assert.ok(Number.isFinite(v) && v >= 0 && v <= 10);
});
test('scoreOf: nem arttıkça skor azalmaz', () => {
  let prev = -1;
  for (let hum = 40; hum <= 100; hum += 10) { const v = scoreOf({ ...dry, hum, dew: 20 }); assert.ok(v >= prev); prev = v; }
});
test('scoreOf: model yağış veriyorsa alt sınırlar uygulanır', () => {
  assert.ok(scoreOf({ ...dry, precip: 0.1 }) >= 6);
  assert.ok(scoreOf({ ...dry, precip: 1 }) >= 7.5);
  assert.ok(scoreOf({ ...dry, precip: 4 }) >= 9);
  assert.ok(scoreOf({ ...dry, code: 95 }) >= 9);
});
test('scoreOf: hızlı basınç düşüşü skoru artırır', () =>
  assert.ok(scoreOf({ ...dry, hum: 80, dew: 15, ptr: -4 }) > scoreOf({ ...dry, hum: 80, dew: 15, ptr: 0 })));
test('scoreOf: her zaman 0-10 arası ve tek ondalık', () => {
  for (const h of [dry, { hum: 100, temp: 5, dew: 5, cloud: 100, pop: 100, cape: 9999, precip: 50, code: 99 }, { hum: -5, cloud: -3 }]) {
    const v = scoreOf(h); assert.ok(v >= 0 && v <= 10); assert.equal(v, +v.toFixed(1));
  }
});

test('catOf: kategori sınırları README ile aynı', () => {
  assert.match(catOf(0), /^Açık/); assert.match(catOf(1.9), /^Açık/);
  assert.match(catOf(2), /^Sakin/); assert.match(catOf(4), /^Sınırda/);
  assert.match(catOf(6), /^Yüksek/); assert.match(catOf(7.9), /^Yüksek/);
  assert.match(catOf(8), /^Kritik/); assert.match(catOf(10), /^Kritik/);
});

test('MEAN / MED', () => {
  assert.equal(MEAN([]), null); assert.equal(MEAN([1, 2, 6]), 3);
  assert.equal(MED([]), null); assert.equal(MED([3, 1, 2]), 2); assert.equal(MED([4, 1, 3, 2]), 2.5);
  assert.equal(MED([1, 2, 1000]), 2, 'aykırı değer medyanı bozmaz');
});
test('wmed: ağırlıklı medyan', () => {
  assert.equal(wmed([]), null);
  assert.equal(wmed([[1, 1], [2, 1], [3, 1]]), 2);
  assert.equal(wmed([[10, 1], [20, 1], [30, 5]]), 30, 'ağırlığı yüksek değer kazanır');
  assert.equal(wmed([[30, 1], [10, 1], [20, 1]]), 20, 'sıralı gelmese de doğru');
});

test('escHtml: HTML özel karakterlerini kaçışlar, null boş olur', () => {
  assert.equal(escHtml('<img src=x onerror="a()">&\''), '&lt;img src=x onerror=&quot;a()&quot;&gt;&amp;&#39;');
  assert.equal(escHtml(null), ''); assert.equal(escHtml(undefined), ''); assert.equal(escHtml(0), '0');
});

test('rtWhen: yağış başlangıç ve bitişini bulur', () => {
  const t0 = Math.floor(Date.now() / 3600e3) * 3600, T = Array.from({ length: 24 }, (_, i) => t0 + i * 3600);
  const P = T.map((_, i) => (i === 2 || i === 3 ? 1 : 0));
  assert.deepEqual(rtWhen(T, P, t0 + 10), { s: 2, st: T[2], et: T[4] });
  assert.deepEqual(rtWhen(T, T.map(() => 0), t0 + 10), { s: -1 });
  assert.equal(rtWhen(T, T.map(() => 2), t0).s, 0, 'şu an yağışlıysa s=0');
  assert.equal(rtWhen(T, T.map(() => 2), t0).et, null, '12 saat sürerse bitiş yok');
  assert.equal(rtWhen([], [], t0), null);
});

test('sadeText: düz dille yağmur cümlesi', () => {
  const r = (pops, precs) => pops.map((p, i) => ({ hh: String(14 + i), pop: p, precip: precs ? precs[i] : 0 }));
  assert.equal(sadeText([]), '');
  assert.equal(sadeText(r([5, 10, 0])), 'Önümüzdeki saatlerde yağmur beklenmiyor.');
  assert.equal(sadeText(r([20, 55, 30])), 'Yağmur ihtimali %55.');
  assert.equal(sadeText(r([20, 80, 90], [0, 0.4, 1])), 'Saat 15:00 civarında yağmur bekleniyor.');
  assert.equal(sadeText(r([90], [2])), 'Şu an yağmur yağıyor.');
  assert.match(sadeText([{ hh: '10' }]), /beklenmiyor/, 'eksik alanlar hata vermez');
});

test('sadeText: öğüt vermez (şemsiye, öneri vb. yok)', () => {
  const outs = [[5, 10], [20, 55], [90, 90]].flatMap(p => [sadeText(p.map((x, i) => ({ hh: '1' + i, pop: x, precip: 0 }))), sadeText(p.map((x, i) => ({ hh: '1' + i, pop: x, precip: i ? 1 : 0 })))]);
  for (const o of outs) assert.ok(!/şemsiye|öner|yanına/i.test(o), o);
});

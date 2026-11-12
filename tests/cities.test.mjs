import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { CITIES, slugOf } from '../build-cities.mjs';

test('81 il, plaka 1-81 tam ve benzersiz, koordinatlar Türkiye sınırları içinde', () => {
  assert.equal(CITIES.length, 81);
  assert.deepEqual(CITIES.map(c => c.plate).sort((a, b) => a - b), Array.from({ length: 81 }, (_, i) => i + 1));
  assert.equal(new Set(CITIES.map(c => c.slug)).size, 81);
  for (const c of CITIES) assert.ok(c.lat > 35.5 && c.lat < 42.5 && c.lon > 25.5 && c.lon < 45, c.name + ' koordinatı');
  assert.equal(slugOf('Şanlıurfa'), 'sanliurfa'); assert.equal(slugOf('İstanbul'), 'istanbul'); assert.equal(slugOf('Iğdır'), 'igdir'); assert.equal(slugOf('Hakkâri'), 'hakkari');
});
test('şehir sayfaları güncel (değilse: npm run cities)', () => { execFileSync('node', ['build-cities.mjs', '--check']); });
test('her şehir sayfasında benzersiz başlık, canonical, uygulama bağlantısı ve sitemap kaydı var', () => {
  const titles = new Set(), sm = readFileSync('sitemap.xml', 'utf8');
  for (const c of CITIES) {
    const f = 'sehir/' + c.slug + '.html'; assert.ok(existsSync(f), f);
    const h = readFileSync(f, 'utf8'), t = /<title>(.*?)<\/title>/.exec(h)[1];
    assert.ok(!titles.has(t), 'yinelenen başlık ' + t); titles.add(t);
    assert.ok(h.includes('rel="canonical" href="https://mikroklimakontrolmerkezi.forevye.workers.dev/sehir/' + c.slug + '"'));
    assert.ok(h.includes('href="/?yer=' + c.lat + ',' + c.lon + ','), c.name + ' uygulama bağlantısı');
    assert.ok(h.includes('<h1>' + c.name + ' hava durumu</h1>'));
    assert.ok(!/<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>/.test(h), 'satır içi script yok (CSP)');
    assert.ok(sm.includes('/sehir/' + c.slug + '</loc>'));
  }
});

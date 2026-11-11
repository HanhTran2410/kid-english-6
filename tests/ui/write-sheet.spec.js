// WR-20 (SPEC-write 12.4): bảng 26 chữ để bố mẹ duyệt hình — mỗi nét một màu, số thứ tự + mũi tên ở điểm bắt đầu.
// Ảnh: test-results/<tên test>/bang-26-chu.png (đính kèm vào báo cáo Playwright).
import { test, expect } from '@playwright/test';
import { startApp, fakeSpeech } from './helpers.js';

test('WR-20: bảng 26 chữ (thứ tự nét, chỗ bắt đầu, hướng) để bố mẹ duyệt hình', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(async () => {
    const { LETTERS, LETTER_ORDER } = await import('/js/write/letters.js');
    const { sampleStroke, strokeEnds, pathD, isDotStroke } = await import('/js/write/stroke.js');
    const { letterBox } = await import('/js/write/pad.js');
    const COLORS = ['#e8590c', '#1c7ed6', '#2f9e44', '#ae3ec9'];
    const NS = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs) => {
      const e = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
      return e;
    };
    document.body.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(9,1fr);gap:8px;padding:12px;background:#fff;font-family:sans-serif';
    for (const l of LETTER_ORDER) {
      const box = letterBox(l);
      const svg = el('svg', { viewBox: `${box.x} ${box.y} ${box.w} ${box.h}`, width: 120, height: 164 });
      for (const y of [0, 50, 100, 150]) svg.append(el('line', { x1: box.x, x2: box.x + box.w, y1: y, y2: y, stroke: y === 100 ? '#888' : '#ddd', 'stroke-width': y === 100 ? 2 : 1 }));
      LETTERS[l].strokes.forEach((s, i) => {
        const c = COLORS[i % 4];
        if (isDotStroke(s)) svg.append(el('circle', { cx: s[0][1], cy: s[0][2], r: 5, fill: c }));
        else svg.append(el('path', { d: pathD(sampleStroke(s, 1).points), fill: 'none', stroke: c, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.85 }));
      });
      LETTERS[l].strokes.forEach((s, i) => {
        const { start, angle } = strokeEnds(s);
        const g = el('g', { transform: `translate(${start.x} ${start.y})` });
        g.append(el('circle', { r: 6.5, fill: '#222' }));
        const t = el('text', { y: 3, 'text-anchor': 'middle', 'font-size': 9, fill: '#fff', 'font-weight': 700 });
        t.textContent = String(i + 1);
        g.append(t);
        if (!isDotStroke(s)) {
          const r = (angle * Math.PI) / 180;
          svg.append(el('path', { d: 'M-4 -4 L5 0 L-4 4 Z', fill: '#222', transform: `translate(${start.x + Math.cos(r) * 14} ${start.y + Math.sin(r) * 14}) rotate(${angle})` }));
        }
        svg.append(g);
      });
      const cell = document.createElement('div');
      cell.style.cssText = 'display:grid;justify-items:center;border:1px solid #eee;border-radius:10px';
      const label = document.createElement('b');
      label.textContent = l;
      cell.append(label, svg);
      wrap.append(cell);
    }
    document.body.append(wrap);
  });
  await expect(page.locator('body > div > div')).toHaveCount(26);
  const path = testInfo.outputPath('bang-26-chu.png');
  await page.locator('body > div').screenshot({ path });
  await testInfo.attach('bang-26-chu', { path, contentType: 'image/png' });
});

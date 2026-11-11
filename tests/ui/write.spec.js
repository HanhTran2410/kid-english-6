// ✍️ Tập viết (SPEC-write.md mục 12.4): tab lưới chữ, xem → B1 → B2 → C, tô ngược, sai 2 / 3 lần, ↩️, hai ngón,
// ưu tiên bút, ra nền giữa C, viết thêm sau khi xong, pointercancel, tải lại giữa chữ, cỡ khung.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, spoken } from './helpers.js';
import { LETTERS } from '../../app/js/write/letters.js';
import { fakeStroke } from '../write-fake.js';

const progress = (page, key) => page.evaluate((k) => window.kidEnglish6.db.get('progress', k), key);
const step = (page) => page.locator('#app').getAttribute('data-step');

/** Vẽ một nét (điểm theo đơn vị chữ) lên khung viết bằng PointerEvent giả lập. */
async function draw(page, points, { type = 'touch', id = 1, up = true } = {}) {
  await page.evaluate(({ pts, type, id, up }) => {
    const svg = document.querySelector('.wr-pad');
    const m = svg.getScreenCTM();
    const px = pts.map((p) => new DOMPoint(p.x, p.y).matrixTransform(m));
    const fire = (name, p) => svg.dispatchEvent(new PointerEvent(name, {
      pointerId: id, pointerType: type, clientX: p.x, clientY: p.y, bubbles: true, isPrimary: id === 1,
    }));
    fire('pointerdown', px[0]);
    for (const p of px.slice(1)) fire('pointermove', p);
    if (up) fire('pointerup', px.at(-1));
  }, { pts: points, type, id, up });
}

/** Viết đúng cả chữ (mọi nét theo mẫu). */
async function writeLetter(page, letter) {
  for (const [i, s] of LETTERS[letter].strokes.entries()) {
    await expect(page.locator('#app')).toHaveAttribute('data-stroke', String(i));
    await draw(page, fakeStroke(s));
  }
}

async function openLetter(page, letter) {
  await page.getByRole('button', { name: 'Đánh vần và viết' }).click();
  await page.getByRole('button', { name: '✍️ Tập viết' }).click();
  await page.getByRole('button', { name: `Chữ ${letter}`, exact: true }).click();
}

/** Bỏ qua bước A: chờ mẫu chạy xong rồi bấm Tiếp tục. */
async function toB1(page) {
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect.poll(() => step(page)).toBe('B1');
}

/** Đợi lượt sau (khung mới, nét 0). */
async function waitTurn(page, name) {
  await expect.poll(() => step(page)).toBe(name);
  await expect(page.locator('.wr-pad:not(.locked)')).toBeVisible();
}

test('WR-01: tab Tập viết — 4 nhóm, 26 chữ, ⭐ Tiếp theo ở c', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Đánh vần và viết' }).click();
  await page.getByRole('button', { name: '✍️ Tập viết' }).click();
  await expect(page.locator('.wr-group')).toHaveCount(4);
  await expect(page.locator('.wr-card')).toHaveCount(26);
  for (const g of ['curly', 'ladder', 'robot', 'zigzag']) await expect(page.locator(`.wr-group[data-group="${g}"] .wr-card`).first()).toBeVisible();
  await expect(page.locator('.wr-card.next')).toHaveAttribute('data-letter', 'c');
});

test('WR-02: c — xem mẫu → B1, B2, C viết đúng → 3⭐, write/letter/c có 3 independent, streak 3', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openLetter(page, 'c');
  await expect.poll(() => spoken(page)).toContain('This is c.');
  await expect.poll(() => spoken(page)).toContain(LETTERS.c.say);
  // Chữ đọc (tiêu đề ✍️ c) dùng Andika (SPEC-write 6.5).
  await expect.poll(() => page.evaluate(() => document.fonts.check('700 40px Andika'))).toBe(true);
  await toB1(page);
  await writeLetter(page, 'c');
  await waitTurn(page, 'B2');
  await expect.poll(() => spoken(page)).toContain('Good! Again!');
  await writeLetter(page, 'c');
  await waitTurn(page, 'C');
  await expect(page.locator('.wr-sample svg')).toBeVisible();
  await writeLetter(page, 'c');
  await expect(page.locator('.done-stars')).toHaveAttribute('aria-label', '3 sao');
  const rec = await progress(page, 'write/letter/c');
  expect([rec.seen, rec.independent, rec.streak]).toEqual([3, 3, 3]);
  expect((await progress(page, 'lesson:write-c')).bestStars).toBe(3);
  await page.getByRole('button', { name: 'Chữ khác' }).click();
  await expect(page.locator('.wr-card.next')).toHaveAttribute('data-letter', 'a');
});

test('WR-03 + WR-06: t — nét 2 tô ngược → "Follow the arrow!", nét 1 vẫn còn; ↩️ xóa nét đúng → viết lại nét đó', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openLetter(page, 't');
  await toB1(page);
  const [down, across] = LETTERS.t.strokes;
  await expect(page.getByRole('button', { name: 'Xóa nét' })).toBeDisabled();
  await draw(page, fakeStroke(down));
  await expect(page.locator('#app')).toHaveAttribute('data-stroke', '1');
  await draw(page, fakeStroke(across, { reverse: true }));
  await expect.poll(() => spoken(page)).toContain('Follow the arrow!');
  await expect(page.locator('.wr-done .wr-ok')).toHaveCount(1);
  await expect(page.locator('#app')).toHaveAttribute('data-stroke', '1');
  // ↩️: xóa nét 1 vừa đúng → chấm xanh quay về nét 1.
  await page.getByRole('button', { name: 'Xóa nét' }).click();
  await expect(page.locator('.wr-done .wr-ok')).toHaveCount(0);
  await expect(page.locator('.wr-start')).toHaveAttribute('data-stroke', '0');
  await writeLetter(page, 't');
  await waitTurn(page, 'B2');
  // Lượt B1 có một lần sai → helped (↩️ không tính).
  const rec = await progress(page, 'write/letter/t');
  expect([rec.helped, rec.independent, rec.reasons.reverse]).toEqual([1, 0, 1]);
});

test('WR-04: l — sai 2 lần → strokeVi một lần + tô có dẫn; lần 3 Olly tự hoàn thành; lượt missed', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openLetter(page, 'l');
  await toB1(page);
  const [s] = LETTERS.l.strokes;
  await draw(page, fakeStroke(s, { startShift: 40 }));
  await expect.poll(() => spoken(page)).toContain('Start at the green dot!');
  await draw(page, fakeStroke(s, { startShift: 40 }));
  await expect.poll(() => spoken(page)).toContain(LETTERS.l.strokeVi[0]);
  await expect(page.locator('.wr-model-stroke.wr-guided')).toHaveCount(1);
  await draw(page, fakeStroke(s, { startShift: 40 }));
  await waitTurn(page, 'B2');
  const rec = await progress(page, 'write/letter/l');
  expect([rec.missed, rec.reasons.start]).toEqual([1, 3]);
  expect((await spoken(page)).filter((x) => x === LETTERS.l.strokeVi[0]).length).toBe(1);
});

test('WR-07 + WR-08 + WR-18: hai ngón chỉ ngón đầu viết; pointercancel hủy nét dở; đã thấy bút thì bỏ qua tay', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openLetter(page, 'z');
  await toB1(page);
  const [s1, s2, s3] = LETTERS.z.strokes;
  // Ngón 1 đặt xuống, ngón 2 kéo nguyên nét 1 → bỏ qua; ngón 1 nhấc lên tại chỗ = chạm → bỏ qua.
  await draw(page, [fakeStroke(s1)[0]], { id: 1, up: false });
  await draw(page, fakeStroke(s1), { id: 2 });
  await page.evaluate(() => {
    const svg = document.querySelector('.wr-pad');
    const r = svg.getBoundingClientRect();
    svg.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, pointerType: 'touch', clientX: r.x, clientY: r.y, bubbles: true }));
  });
  await expect(page.locator('.wr-ink path')).toHaveCount(0);
  await expect(page.locator('#app')).toHaveAttribute('data-stroke', '0');
  // Bút viết nét 1 → đúng; sau đó tay viết nét 2 → bỏ qua; bút viết nét 2 → đúng.
  await draw(page, fakeStroke(s1), { type: 'pen' });
  await expect(page.locator('#app')).toHaveAttribute('data-stroke', '1');
  await draw(page, fakeStroke(s2), { type: 'touch' });
  await expect(page.locator('#app')).toHaveAttribute('data-stroke', '1');
  await draw(page, fakeStroke(s2), { type: 'pen' });
  await draw(page, fakeStroke(s3), { type: 'pen' });
  await waitTurn(page, 'B2');
  const rec = await progress(page, 'write/letter/z');
  expect(rec.independent).toBe(1);
});

test('WR-05: i — chạm chỗ chấm trước nét thẳng → bỏ qua; viết nét thẳng → "Now the dot!"; kéo dài ở chấm → dot; chạm chấm → xong', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openLetter(page, 'i');
  await toB1(page);
  const [stem, dot] = LETTERS.i.strokes;
  const at = { x: dot[0][1], y: dot[0][2] };
  await draw(page, [at]);
  await expect(page.locator('#app')).toHaveAttribute('data-stroke', '0');
  await draw(page, fakeStroke(stem));
  await expect(page.locator('#app')).toHaveAttribute('data-stroke', '1');
  await expect.poll(() => spoken(page)).toContain('Now the dot!');
  await draw(page, fakeStroke([['line', at.x, 0, at.x, 45]]));
  await expect.poll(() => spoken(page)).toContain('Just tap the dot!');
  await draw(page, [{ x: at.x + 2, y: at.y + 1 }]);
  await waitTurn(page, 'B2');
  const rec = await progress(page, 'write/letter/i');
  expect([rec.helped, rec.reasons.dot, rec.reasons.start]).toEqual([1, 1, 0]);
});

test('WR-17: viết thêm sau khi chữ xong → bỏ qua (khung khóa), không đổi kết quả', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openLetter(page, 'l');
  await toB1(page);
  await writeLetter(page, 'l');
  await expect(page.locator('.wr-pad.locked')).toBeVisible();
  await draw(page, fakeStroke(LETTERS.l.strokes[0], { reverse: true }));
  await expect(page.locator('.wr-pad.locked .wr-ink path')).toHaveCount(0);
  await waitTurn(page, 'B2');
  expect((await progress(page, 'write/letter/l')).independent).toBe(1);
});

test('WR-09 + WR-24: ra nền giữa C → quay lại đúng chữ, lượt C; tải lại giữa chữ → lượt đã xong vẫn còn, chưa có sao', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openLetter(page, 'l');
  await toB1(page);
  await writeLetter(page, 'l');
  await waitTurn(page, 'B2');
  await writeLetter(page, 'l');
  await waitTurn(page, 'C');
  const setVisibility = (state) => page.evaluate((s) => {
    Object.defineProperty(document, 'visibilityState', { value: s, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
  await setVisibility('hidden');
  await setVisibility('visible');
  await page.locator('.resume-overlay').getByRole('button', { name: 'Bắt đầu' }).click();
  await waitTurn(page, 'C');
  await expect(page.locator('.wr-turn')).toHaveText('3/3');
  expect((await progress(page, 'write/letter/l')).seen).toBe(2);

  await startApp(page); // tải lại trang
  const rec = await progress(page, 'write/letter/l');
  expect(rec.seen).toBe(2);
  const lesson = await progress(page, 'lesson:write-l');
  expect(lesson?.plays ?? 0).toBe(0);
});

test('WR-12: cỡ khung — iPad ngang ≥ 260 px, iPhone dọc ≥ 200 px; nút không đè khung', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openLetter(page, 'l');
  await toB1(page);
  for (const [w, hgt, min] of [[1180, 820, 260], [820, 1180, 260], [390, 844, 200], [375, 667, 200]]) {
    await page.setViewportSize({ width: w, height: hgt });
    // Đo cả khung lẫn nút trong cùng một lần (trình duyệt vẽ lại sau khi đổi cỡ, đo rời dễ lệch nhau).
    await expect.poll(() => page.evaluate(() => {
      const pad = document.querySelector('.wr-pad').getBoundingClientRect();
      const undo = document.querySelector('.wr-undo').getBoundingClientRect();
      return { tall: Math.round(pad.height), below: undo.top >= pad.bottom - 1, fits: pad.bottom <= innerHeight };
    }), { message: `${w}x${hgt}` }).toEqual(expect.objectContaining({ below: true, fits: true }));
    expect((await page.locator('.wr-pad').boundingBox()).height).toBeGreaterThanOrEqual(min);
  }
});

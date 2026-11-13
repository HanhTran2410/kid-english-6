// 🔢 Toán phần 2 — Math-d / Math-e (SPEC-math2.md mục 11): T8 How many more (MATH-02 / 03), T9 Number bonds (MATH-04 / 05),
// T10 Add it up (MATH-19), T11 Take away (MATH-09), dòng gợi ý trên thẻ bài,
// thẻ sai mờ tại chỗ và giữ khi ra nền (MATH-17), bố cục iPhone dọc 375 × 667 (khung 10 ô ≥ 48 px, khay trong màn).
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, spoken } from './helpers.js';

const round = (page) => page.evaluate(() => {
  const r = window.kidEnglish6.current?.params?.round;
  return r ? JSON.parse(JSON.stringify(r)) : null;
});

/** Mở bài ở mức `level` (bật "Mở mọi mức" khi cần mức 2–3), qua phần làm mẫu. */
async function openAt(page, title, level = 1) {
  await page.evaluate(() => { window.kidEnglish6.settings.mathAllLevels = true; });
  await page.getByRole('button', { name: 'Toán' }).click();
  await page.getByRole('button', { name: title }).click();
  await page.locator(`.level-btn[data-level="${level}"]`).click();
}

/** Bấm thẻ tới khi điều kiện trên lượt đúng (bấm thừa sau khi mục đã chốt sẽ rơi sang mục sau). */
async function tapUntil(page, n, done) {
  await expect.poll(async () => {
    const cur = await round(page);
    if (!done(cur)) await page.locator(`.mt-ans[data-n="${n}"]`).click({ timeout: 300 }).catch(() => {});
    return done(await round(page));
  }).toBe(true);
}

const wrongOf = (item) => item.options.find((n) => n !== item.answer);

/** Ghi số đồ "phần hơn" sáng nhiều nhất (ở ?fast mục sau đến rất nhanh, đo sau khi chạm thì đã mất). */
const watchMax = (page, sel) => page.evaluate((q) => {
  window.__max = 0;
  new MutationObserver(() => {
    window.__max = Math.max(window.__max, document.querySelectorAll(q).length);
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
}, sel);
const watchExtras = (page) => watchMax(page, '.mt-tthing.extra');
const extrasSeen = (page) => page.evaluate(() => window.__max);

/** Chơi hết lượt: chạm đúng mọi mục, bỏ qua phần đọc câu. */
async function playRound(page) {
  for (let guard = 0; guard < 600; guard++) {
    if (await page.locator('.done-panel').isVisible()) return;
    const skip = page.getByRole('button', { name: 'Bỏ qua phần đọc' });
    const r = await round(page);
    if (await skip.isVisible()) await skip.click().catch(() => {});
    else if (r && r.phase === 'item' && r.results[r.index] == null) {
      await page.locator(`.mt-ans[data-n="${r.items[r.index].answer}"]`).click({ timeout: 500 }).catch(() => {});
    }
    await page.waitForTimeout(80);
  }
  throw new Error('Không xong lượt');
}

test('T8 mức 1: làm mẫu 5 – 3 → "Tom has two more apples."; dây nối có sẵn, phần hơn có viền; sai → thẻ mờ tại chỗ, "Let\'s match them!"; đúng → phần hơn sáng, Olly đếm; hết lượt', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Toán' }).click();
  await page.getByRole('button', { name: 'How many more?' }).click();
  await expect.poll(() => spoken(page)).toContain('Tom has 5 apples. Anna has 3 apples. How many more apples does Tom have?');
  await expect.poll(() => spoken(page)).toContain('Tom has two more apples.');
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  const r = await round(page);
  const item = r.items[0];
  const [top, bottom] = item.top === 'more' ? [item.more, item.less] : [item.less, item.more];
  await expect(page.locator('.mt-trow[data-row="top"] .mt-tthing')).toHaveCount(top.n);
  await expect(page.locator('.mt-trow[data-row="bottom"] .mt-tthing')).toHaveCount(bottom.n);
  await expect(page.locator('.mt-ans')).toHaveCount(3);
  await expect(page.locator('.mt-lines line')).toHaveCount(item.less.n);
  await expect(page.locator('.mt-tthing.edge')).toHaveCount(item.answer);
  // Thứ tự thẻ trong khay giữ nguyên sau khi sai.
  const order = await page.locator('.mt-ans').evaluateAll((els) => els.map((e) => e.dataset.n));
  await tapUntil(page, wrongOf(item), (cur) => cur.wrong >= 1);
  await expect(page.locator(`.mt-ans.tried[data-n="${wrongOf(item)}"]`)).toBeVisible();
  await expect.poll(() => spoken(page)).toContain("Let's match them!");
  expect(await page.locator('.mt-ans').evaluateAll((els) => els.map((e) => e.dataset.n))).toEqual(order);
  await watchExtras(page);
  await tapUntil(page, item.answer, (cur) => cur.results[0] != null);
  expect((await round(page)).results[0]).toBe('helped');
  await expect.poll(() => extrasSeen(page)).toBe(item.answer);
  await expect.poll(() => spoken(page)).toContain(`${['One', 'One, two', 'One, two, three'][item.answer - 1]}!`);
  await playRound(page);
  await expect(page.locator('.done-stars')).toHaveAttribute('aria-label', '2 sao');
  const rec = await page.evaluate((k) => window.kidEnglish6.db.get('progress', k), `math-t8/more/${item.more.n}-${item.less.n}`);
  expect([rec.helped, rec.kind]).toEqual([1, item.kind]);
});

test('MATH-03 — T8 mức 3: hai hàng lệch, không dây; sai lần 1 → hàng dưới về thẳng cột, dây nối đúng số cặp, phần hơn CHƯA sáng', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openAt(page, 'How many more?', 3);
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  const item = (await round(page)).items[0];
  await expect(page.locator('.mt-rows.scattered')).toBeVisible();
  await expect(page.locator('.mt-lines')).toHaveCount(0);
  await expect(page.locator('.mt-ans')).toHaveCount(4);
  await tapUntil(page, wrongOf(item), (cur) => cur.wrong >= 1);
  await expect(page.locator('.mt-rows.columns')).toBeVisible();
  await expect(page.locator('.mt-lines line')).toHaveCount(item.less.n);
  // Mỗi dây nối thẳng đứng: hai đầu cùng cột.
  const lines = await page.locator('.mt-lines line').evaluateAll((els) => els.map((l) => Math.abs(l.getAttribute('x1') - l.getAttribute('x2'))));
  expect(Math.max(...lines)).toBeLessThanOrEqual(1);
  await watchExtras(page);
  await page.waitForTimeout(500);
  expect(await extrasSeen(page)).toBe(0);
  await tapUntil(page, item.answer, (cur) => cur.results[0] != null);
  await expect.poll(() => extrasSeen(page)).toBe(item.answer);
});

test('T9 mức 1: làm mẫu "Five is three and two."; khung 10 ô cùng bộ chấm (xanh + nét đứt = tổng); sai → "Count the hidden spots!"; đúng → cánh mở, ô nét đứt thành cam; hết lượt', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Toán' }).click();
  await page.getByRole('button', { name: 'Number bonds' }).click();
  await expect.poll(() => spoken(page)).toContain('Five is three and two.');
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  const item = (await round(page)).items[0];
  await expect(page.locator('.mt-bugtotal')).toHaveText(String(item.total));
  await expect(page.locator(`.mt-wing.closed[data-side="${item.hidden}"]`)).toBeVisible();
  // MATH-05: khung luôn 10 ô; số ô có chấm = tổng, nét đứt = phần bị che.
  await expect(page.locator('.mt-frame .mt-cell')).toHaveCount(10);
  await expect(page.locator('.mt-cell.blue')).toHaveCount(item.known);
  await expect(page.locator('.mt-cell.dashed')).toHaveCount(item.answer);
  await expect(page.locator('.mt-cell.empty')).toHaveCount(10 - item.total);
  await tapUntil(page, wrongOf(item), (cur) => cur.wrong >= 1);
  await expect.poll(() => spoken(page)).toContain('Count the hidden spots!');
  await expect(page.locator('.mt-cell.dashed.glow')).toHaveCount(item.answer);
  // Cánh mở: chính các ô nét đứt chuyển cam (không thêm ô).
  await watchMax(page, '.mt-cell.orange');
  await tapUntil(page, item.answer, (cur) => cur.results[0] != null);
  await expect.poll(() => extrasSeen(page)).toBe(item.answer);
  await playRound(page);
  await expect(page.locator('.done-stars')).toHaveAttribute('aria-label', '2 sao');
});

test('T9 mức 2–3: khung 10 ô ẩn tới khi sai (mức 3 có 🔍 mở khung); cánh 0 chấm hiện số 0 (MATH-04)', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openAt(page, 'Number bonds', 3);
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  const r = await round(page);
  await expect(page.locator('.mt-framebox')).toBeHidden();
  await page.getByRole('button', { name: 'Xem khung 10 ô' }).click();
  await expect(page.locator('.mt-framebox')).toBeVisible();
  await expect(page.locator('.mt-cell.blue')).toHaveCount(r.items[0].known);
  // Mục known = 0 (nếu lượt có): chơi tới mục đó.
  const z = r.items.findIndex((x) => x.known === 0);
  if (z >= 0) {
    await expect.poll(async () => {
      const cur = await round(page);
      if (cur.index < z) {
        if (await page.getByRole('button', { name: 'Bỏ qua phần đọc' }).isVisible()) await page.getByRole('button', { name: 'Bỏ qua phần đọc' }).click().catch(() => {});
        else if (cur.results[cur.index] == null) await page.locator(`.mt-ans[data-n="${cur.items[cur.index].answer}"]`).click({ timeout: 300 }).catch(() => {});
      }
      return cur.index;
    }, { timeout: 30000 }).toBe(z);
    await expect(page.locator('.mt-wing[data-side="left"] .mt-wzero')).toHaveText('0');
    await expect(page.locator('.mt-wing[data-side="left"] .mt-wdot')).toHaveCount(0);
    await expect(page.locator('.mt-ans')).toHaveCount(4);
  }
});

test('MATH-17: sai một lần rồi ra nền → quay lại đúng mục, thẻ sai vẫn mờ, lần sai vẫn tính', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Toán' }).click();
  await page.getByRole('button', { name: 'Number bonds' }).click();
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  const item = (await round(page)).items[0];
  await tapUntil(page, wrongOf(item), (cur) => cur.wrong >= 1);
  const setVisibility = (state) => page.evaluate((s) => {
    Object.defineProperty(document, 'visibilityState', { value: s, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
  await setVisibility('hidden');
  await setVisibility('visible');
  await page.locator('.resume-overlay').getByRole('button', { name: 'Bắt đầu' }).click();
  const after = await round(page);
  expect([after.index, after.wrong]).toEqual([0, 1]);
  await expect(page.locator(`.mt-ans.tried[data-n="${wrongOf(item)}"]`)).toBeVisible();
  await tapUntil(page, item.answer, (cur) => cur.results[0] != null);
  expect((await round(page)).results[0]).toBe('helped');
});

test('iPhone dọc 375 × 667: T8 và T9 không tràn ngang, khay nằm trong màn; ô khung 10 ô ≥ 48 px, thẻ số ≥ 64 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await fakeSpeech(page);
  await startApp(page);
  for (const title of ['How many more?', 'Number bonds']) {
    await page.getByRole('button', { name: 'Toán' }).click();
    await page.getByRole('button', { name: title }).click();
    await page.getByRole('button', { name: 'Đến lượt con' }).click();
    await expect(page.locator('.mt-ans').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    for (const card of await page.locator('.mt-ans').all()) {
      const box = await card.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(64);
      expect(box.y + box.height).toBeLessThanOrEqual(667);
    }
    if (title === 'Number bonds') {
      for (const cell of await page.locator('.mt-cell').all()) expect((await cell.boundingBox()).width).toBeGreaterThanOrEqual(48);
    }
    await page.getByRole('button', { name: 'Về' }).click();
    await page.getByRole('button', { name: 'Về' }).click().catch(() => {});
  }
});

// ---------- Math-e: T10 Add it up, T11 Take away ----------

/** Chạm đúng các mục trước mục `index` (bỏ qua phần đọc) để tới mục đó. */
async function playTo(page, index) {
  await expect.poll(async () => {
    const cur = await round(page);
    if (cur.index < index) {
      const skip = page.getByRole('button', { name: 'Bỏ qua phần đọc' });
      if (await skip.isVisible()) await skip.click().catch(() => {});
      else if (cur.results[cur.index] == null) await page.locator(`.mt-ans[data-n="${cur.items[cur.index].answer}"]`).click({ timeout: 300 }).catch(() => {});
    }
    return cur.index;
  }, { timeout: 30000 }).toBe(index);
}

test('danh sách: T10, T11 có dòng gợi ý "học Tách – gộp số trước" khi chưa có sao ở T9 (không khóa)', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Toán' }).click();
  await expect(page.locator('.lesson-card')).toHaveCount(11);
  for (const id of ['math-t10', 'math-t11']) await expect(page.locator(`.lesson-card[data-lesson="${id}"] .lesson-note`)).toHaveText('Gợi ý: học 🐞 Tách – gộp số trước');
  await expect(page.locator('.lesson-card[data-lesson="math-t9"] .lesson-note')).toHaveCount(0);
  await page.evaluate(() => window.kidEnglish6.db.put('progress', { key: 'lesson:math-t9', lessonId: 'math-t9', bestStars: 2, plays: 1, completedAt: 1 }));
  await page.getByRole('button', { name: 'Về' }).click();
  await page.getByRole('button', { name: 'Toán' }).click();
  await expect(page.locator('.lesson-card[data-lesson="math-t10"] .lesson-note')).toHaveCount(0);
  await page.getByRole('button', { name: 'Add it up' }).click();
  await expect.poll(() => spoken(page)).toContain('Three plus two is five.');
});

test('T10 mức 1: làm mẫu 3 + 2 đếm hết; câu chuyện + khung có đồ (xanh = a, cam = b) + phép tính; sai → "Let\'s count them all!", Olly đếm; hết lượt', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Toán' }).click();
  await page.getByRole('button', { name: 'Add it up' }).click();
  await expect.poll(() => spoken(page)).toContain('3 ducks are in the pond. 2 more ducks come. How many ducks are there altogether?');
  await expect.poll(() => spoken(page)).toContain('Three plus two is five.');
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  const item = (await round(page)).items[0];
  await expect(page.locator('.mt-sumq .sword').first()).toBeVisible();
  await expect(page.locator('.mt-frame.pics .mt-cell.blue')).toHaveCount(item.a);
  await expect(page.locator('.mt-frame.pics .mt-cell.orange')).toHaveCount(item.b);
  await expect(page.locator('.mt-eq')).toHaveAttribute('aria-label', `${item.a} + ${item.b}`);
  await expect(page.locator('.mt-ans')).toHaveCount(3);
  const before = (await spoken(page)).length;
  await tapUntil(page, wrongOf(item), (cur) => cur.wrong >= 1);
  await expect.poll(async () => (await spoken(page)).slice(before)).toEqual(expect.arrayContaining(["Let's count them all!", ...['one', 'two', 'three', 'four', 'five'].slice(0, item.answer)]));
  await tapUntil(page, item.answer, (cur) => cur.results[0] != null);
  await playRound(page);
  await expect(page.locator('.done-stars')).toHaveAttribute('aria-label', '2 sao');
  expect((await page.evaluate((k) => window.kidEnglish6.db.get('progress', k), `math-t10/add/${item.a}-${item.b}`)).helped).toBe(1);
});

test('MATH-19: T10 mức 2 sai → sáng số ban đầu (a), "Start at {a}. Count on!"; mức 3 chỉ phép tính, sáng số lớn hơn', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openAt(page, 'Add it up', 2);
  await expect.poll(() => spoken(page)).toContain('Start at five. Count on!');
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  let item = (await round(page)).items[0];
  await tapUntil(page, wrongOf(item), (cur) => cur.wrong >= 1);
  await expect(page.locator('.mt-eqn.lit')).toHaveText(String(item.a));
  await expect(page.locator('.mt-cell.lit')).toHaveCount(item.a);
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  await expect.poll(() => spoken(page)).toContain(`Start at ${words[item.a]}. Count on!`);

  await page.getByRole('button', { name: 'Về' }).click(); // về danh sách Toán
  await page.getByRole('button', { name: 'Add it up' }).click();
  await page.locator('.level-btn[data-level="3"]').click();
  await expect.poll(() => spoken(page)).toContain('Same answer!');
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  const r = await round(page);
  // Mục đầu tiên không có số 0 và hai số khác nhau.
  const k = r.items.findIndex((x) => x.a !== x.b && x.a > 0 && x.b > 0);
  await playTo(page, k);
  item = r.items[k];
  await expect(page.locator('.mt-sumq')).toHaveCount(0);
  await expect(page.locator('.mt-framebox')).toBeHidden();
  await tapUntil(page, wrongOf(item), (cur) => cur.wrong >= 1);
  await expect(page.locator('.mt-framebox')).toBeVisible();
  await expect(page.locator('.mt-eqn.lit')).toHaveText(String(Math.max(item.a, item.b)));
  await expect(page.locator('.mt-cell.lit')).toHaveCount(Math.max(item.a, item.b));
});

test('T11 mức 1: làm mẫu 5 − 2; đồ bị bớt ở nguyên ô, bị gạch; sai → "Count the ones that are left!"; hết lượt', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Toán' }).click();
  await page.getByRole('button', { name: 'Take away' }).click();
  await expect.poll(() => spoken(page)).toContain('5 birds are on the tree. 2 birds fly away. How many birds are left?');
  await expect.poll(() => spoken(page)).toContain('Five take away two is three.');
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  const item = (await round(page)).items[0];
  await expect(page.locator('.mt-cell.blue')).toHaveCount(item.a);
  await expect(page.locator('.mt-cell.crossed')).toHaveCount(item.b);
  // Đồ bị gạch là các ô cuối của số bị trừ.
  const crossedAt = await page.locator('.mt-cell.crossed').evaluateAll((els) => els.map((e) => Number(e.dataset.i)));
  expect(crossedAt).toEqual(Array.from({ length: item.b }, (_, i) => item.a - item.b + i));
  await tapUntil(page, wrongOf(item), (cur) => cur.wrong >= 1);
  await expect.poll(() => spoken(page)).toContain('Count the ones that are left!');
  await tapUntil(page, item.answer, (cur) => cur.results[0] != null);
  await playRound(page);
  await expect(page.locator('.done-stars')).toHaveAttribute('aria-label', '2 sao');
});

test('MATH-09: T11 mức 3 trừ hết — khung giữ đủ a đồ, tất cả bị gạch; "Look! None are left."; câu đọc là phép tính', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openAt(page, 'Take away', 3);
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  const r = await round(page);
  const k = r.items.findIndex((x) => x.b === x.a);
  await playTo(page, k);
  const item = r.items[k];
  await page.getByRole('button', { name: 'Xem khung 10 ô' }).click();
  await expect(page.locator('.mt-cell.blue')).toHaveCount(item.a);
  await expect(page.locator('.mt-cell.crossed')).toHaveCount(item.a);
  await tapUntil(page, wrongOf(item), (cur) => cur.wrong >= 1);
  await expect.poll(() => spoken(page)).toContain('Look! None are left.');
  await tapUntil(page, 0, (cur) => cur.results[k] != null);
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  await expect.poll(() => spoken(page)).toContain(`${words[item.a][0].toUpperCase()}${words[item.a].slice(1)} minus ${words[item.a]} equals zero.`);
});

test('iPhone dọc 375 × 667: T10, T11 — khay trong màn, ô khung ≥ 48 px, không tràn ngang', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await fakeSpeech(page);
  await startApp(page);
  for (const title of ['Add it up', 'Take away']) {
    await page.getByRole('button', { name: 'Toán' }).click();
    await page.getByRole('button', { name: title }).click();
    await page.getByRole('button', { name: 'Đến lượt con' }).click();
    await expect(page.locator('.mt-ans').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    for (const card of await page.locator('.mt-ans').all()) {
      const box = await card.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(64);
      expect(box.y + box.height).toBeLessThanOrEqual(667);
    }
    for (const cell of await page.locator('.mt-cell').all()) expect((await cell.boundingBox()).width).toBeGreaterThanOrEqual(48);
    await page.getByRole('button', { name: 'Về' }).click();
    await page.getByRole('button', { name: 'Về' }).click().catch(() => {});
  }
});

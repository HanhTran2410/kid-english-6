// Khu 🔢 Math (SPEC-math.md mục 10): màn chính 5 thẻ, danh sách bài, làm mẫu → 8 mục → sao + mở mức, sai 1 / 2 lần,
// ra nền rồi quay lại đúng mục, không chạm → nhắc đúng một lần, T2 chạm đếm, T3 dấu, T6 xếp số.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, spoken } from './helpers.js';

const round = (page) => page.evaluate(() => {
  const r = window.kidEnglish6.current?.params?.round;
  return r ? JSON.parse(JSON.stringify(r)) : null;
});

/** Thứ tự đúng của T4 (khớp orderedT4). */
const orderOf = (item) => [...item.numbers].sort((a, b) => (item.order === 'desc' ? b - a : a - b));

const correctSel = (key, item) => {
  if (key === 't2') return item.answer === 'same' ? '.mt-same' : `.mt-pick[data-side="${item.answer}"]`;
  if (key === 't3') return `.mt-sign[data-sign="${item.sign}"]`;
  if (key === 't5') return `.mt-tick[data-n="${item.answer}"]`;
  if (key === 't7') return `.mt-person[data-side="${item.side}"]`;
  return `.mt-card[data-side="${item.side}"]`;
};
const wrongSel = (key, item) => {
  if (key === 't3') return `.mt-sign:not([data-sign="${item.sign}"])`;
  if (key === 't5') return `.mt-tick[data-n="${item.answer === item.line[1] - 1 ? item.answer - 1 : item.answer + 1}"]`;
  if (key === 't7') return `.mt-person[data-side="${item.side === 'left' ? 'right' : 'left'}"]`;
  return `.mt-card[data-side="${item.side === 'left' ? 'right' : 'left'}"]`;
};

async function openLesson(page, title) {
  await page.getByRole('button', { name: 'Toán' }).click();
  await page.getByRole('button', { name: title }).click();
}

/** Chơi hết lượt: chạm đúng mọi mục, bỏ qua phần đọc câu. */
async function playRound(page, key) {
  for (let guard = 0; guard < 600; guard++) {
    if (await page.locator('.done-panel').isVisible()) return;
    const skip = page.getByRole('button', { name: 'Bỏ qua phần đọc' });
    const r = await round(page);
    if (await skip.isVisible()) {
      await skip.click().catch(() => {});
    } else if (r && r.phase === 'item' && r.results[r.index] == null && !(await page.getByRole('button', { name: 'Đến lượt con' }).isVisible())) {
      const item = r.items[r.index];
      if (key === 't4') {
        // Chạm thẻ kế tiếp theo đúng thứ tự (thẻ đã xếp có lớp .placed).
        const placed = await page.locator('.mt-oslot .mt-ord').evaluateAll((els) => els.map((e) => Number(e.dataset.n)));
        const want = orderOf(item)[placed.length];
        await page.locator(`.mt-otray .mt-ord[data-n="${want}"]`).click({ timeout: 500 }).catch(() => {});
      } else if (item.make != null) {
        if (!(await page.locator('.mt-mat .mt-rod, .mt-mat .mt-one').count())) {
          for (let i = 0; i < Math.floor(item.make / 10); i++) await page.getByRole('button', { name: 'Thêm một thanh chục' }).click();
          for (let i = 0; i < item.make % 10; i++) await page.getByRole('button', { name: 'Thêm một khối lẻ' }).click();
        }
        await page.getByRole('button', { name: 'Xong' }).click({ timeout: 500 }).catch(() => {});
      } else {
        await page.locator(correctSel(key, item)).click({ timeout: 500 }).catch(() => {});
      }
    }
    await page.waitForTimeout(80);
  }
  throw new Error('Không xong lượt');
}

const progress = (page, key) => page.evaluate((k) => window.kidEnglish6.db.get('progress', k), key);

test('màn chính: 5 khu, Math mở được; lưới 3 + 2 không cuộn; iPhone dọc 2 + 2 + 1 (thẻ cuối rộng cả hàng)', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await expect(page.locator('.zone-card')).toHaveCount(5);
  const math = page.locator('.zone-card[data-zone="math"]');
  await expect(math).toBeVisible();
  for (const [w, hgt] of [[1180, 820], [820, 1180], [390, 844], [375, 667]]) {
    await page.setViewportSize({ width: w, height: hgt });
    // Đợi trình duyệt vẽ lại sau khi đổi cỡ.
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight), { message: `${w}x${hgt}` }).toBeLessThanOrEqual(1);
    const box = await math.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(120);
    if (w < 600) {
      const read = await page.locator('.zone-card[data-zone="read"]').boundingBox();
      expect(box.width).toBeGreaterThan(read.width * 1.8);
    }
  }
  await page.setViewportSize({ width: 1180, height: 820 });
  await math.click();
  await expect(page.locator('.lesson-card')).toHaveCount(7);
  await expect(page.locator('.lesson-card').nth(3)).toHaveAttribute('data-lesson', 'math-t4');
  await expect(page.locator('.lesson-card').last()).toHaveAttribute('data-lesson', 'math-t7');
  await expect(page.locator('.lesson-card.next')).toHaveAttribute('data-lesson', 'math-t1');
  await expect.poll(() => spoken(page)).toContain("Let's play with numbers!");
});

test('T1 mức 1: làm mẫu → ▶ → 8 mục đúng hết → 3⭐, mở Mức 2; vào lại thấy chọn mức (Mức 2 sáng)', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openLesson(page, 'Bigger or smaller?');
  await expect.poll(() => spoken(page)).toContain('Seven is bigger than four.');
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  const r = await round(page);
  expect(r.items).toHaveLength(8);
  expect(r.level).toBe(1);
  // Mức 1: cột khối luôn hiện, đúng số khối.
  await expect(page.locator('.mt-card[data-side="left"] .mt-block')).toHaveCount(r.items[0].a);
  await playRound(page, 't1');
  await expect(page.locator('.done-stars')).toHaveAttribute('aria-label', '3 sao');
  await expect(page.locator('.mt-unlock')).toHaveText('🔓 Đã mở Mức 2!');
  expect((await progress(page, 'lesson:math-t1/L1')).bestStars).toBe(3);
  expect((await progress(page, 'lesson:math-t1')).completedAt).toBeTruthy();
  const item = r.items[0];
  const rec = await progress(page, `math-t1/compare/${item.a}-${item.b}`);
  expect(rec.independent).toBeGreaterThanOrEqual(1);
  // Cùng một cặp số có thể gặp 2 lần trong lượt (bigger rồi smaller): bản ghi giữ kiểu câu của lần sau.
  expect(r.items.filter((x) => x.pair === item.pair).map((x) => x.kind)).toContain(rec.kind);

  await page.getByRole('button', { name: 'Học lại' }).click();
  await expect(page.locator('.level-btn')).toHaveCount(2);
  await expect(page.locator('.level-btn.suggested')).toHaveAttribute('data-level', '2');
  await page.locator('.level-btn[data-level="1"]').click();
  // Đã có sao → làm mẫu rút gọn, có ⏭. Ở ?fast phần mẫu rút gọn có thể xong trước khi kịp bấm ⏭ (máy chậm) → khi đó
  // bấm ▶ "Đến lượt con".
  const skip = page.getByRole('button', { name: 'Bỏ qua phần làm mẫu' });
  const go = page.getByRole('button', { name: 'Đến lượt con' });
  await expect.poll(async () => {
    for (const b of [skip, go]) await b.click({ timeout: 200 }).catch(() => {});
    return (await round(page))?.phase;
  }).toBe('item');
  expect((await round(page)).level).toBe(1);
});

test('T1: sai 1 lần → hình kiểm chứng, đúng → helped; sai 2 lần → tiếng Việt một lần + đáp án sáng → missed', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openLesson(page, 'Bigger or smaller?');
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  let r = await round(page);
  await expect.poll(() => spoken(page)).toContain(r.items[0].ask === 'bigger' ? 'Which number is bigger?' : 'Which number is smaller?');
  // Xem trạng thái trước rồi mới bấm: bấm thừa sau khi mục đã chốt sẽ rơi sang mục sau.
  await expect.poll(async () => {
    const cur = await round(page);
    if (cur.wrong < 1) await page.locator(wrongSel('t1', r.items[0])).click({ timeout: 300 }).catch(() => {});
    return cur.wrong;
  }).toBe(1);
  await expect.poll(async () => (await spoken(page)).some((s) => s.startsWith("Let's check!"))).toBe(true);
  await expect(page.locator('.mt-card .mt-block').first()).toBeVisible();
  await expect.poll(async () => {
    const cur = await round(page);
    if (cur.results[0] == null) await page.locator(correctSel('t1', r.items[0])).click({ timeout: 300 }).catch(() => {});
    return cur.results[0];
  }).toBe('helped');

  // Mục 2: sai hai lần. (Phần đọc câu có thể rơi ngay sau mục 1 — readPlan ngẫu nhiên — thì bỏ qua.)
  await expect.poll(async () => {
    await page.getByRole('button', { name: 'Bỏ qua phần đọc' }).click({ timeout: 300 }).catch(() => {});
    return (await round(page)).index;
  }).toBe(1);
  r = await round(page);
  await expect.poll(async () => {
    const cur = await round(page);
    if (cur.wrong < 2) await page.locator(wrongSel('t1', r.items[1])).click({ timeout: 300 }).catch(() => {});
    return cur.wrong;
  }).toBe(2);
  await expect(page.locator('.vi-help')).toBeVisible();
  await expect(page.locator(`${correctSel('t1', r.items[1])}.hint`)).toBeVisible();
  await expect.poll(async () => {
    const cur = await round(page);
    if (cur.results[1] == null) await page.locator(correctSel('t1', r.items[1])).click({ timeout: 300 }).catch(() => {});
    return cur.results[1];
  }).toBe('missed');
  const viCount = (await spoken(page)).filter((s) => /cột khối/.test(s)).length;
  expect(viCount).toBe(1);
});

test('ra nền ở mục chưa chốt → quay lại đúng mục, lần sai trước vẫn tính; 🏠 rồi mở lại → lượt mới', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openLesson(page, 'Bigger or smaller?');
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  const before = await round(page);
  await expect.poll(async () => {
    await page.locator(wrongSel('t1', before.items[0])).click({ timeout: 300 }).catch(() => {});
    return (await round(page)).wrong;
  }).toBe(1);
  const setVisibility = (state) => page.evaluate((s) => {
    Object.defineProperty(document, 'visibilityState', { value: s, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
  await setVisibility('hidden');
  await setVisibility('visible');
  await page.locator('.resume-overlay').getByRole('button', { name: 'Bắt đầu' }).click();
  const after = await round(page);
  expect(after.index).toBe(0);
  expect(after.wrong).toBe(1);
  expect(after.items).toEqual(before.items);
  await expect.poll(async () => {
    await page.locator(correctSel('t1', after.items[0])).click({ timeout: 300 }).catch(() => {});
    return (await round(page)).results[0];
  }).toBe('helped');

  await page.getByRole('button', { name: 'Về' }).click();
  await page.getByRole('button', { name: 'Bigger or smaller?' }).click();
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  const fresh = await round(page);
  expect(fresh.index).toBe(0);
  expect(fresh.results).toEqual([]);
});

test('không chạm: nhắc lại câu hỏi đúng một lần, không tự hiện đáp án', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openLesson(page, 'Bigger or smaller?');
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  const r = await round(page);
  const q = r.items[0].ask === 'bigger' ? 'Which number is bigger?' : 'Which number is smaller?';
  const count = async () => (await spoken(page)).filter((s) => s === q).length;
  await expect.poll(count).toBeGreaterThanOrEqual(1);
  const first = await count();
  await page.waitForTimeout(3000); // ?fast: 20 giây → 0,4 giây
  expect(await count()).toBe(first + 1);
  await expect(page.locator('.mt-card.hint')).toHaveCount(0);
  expect((await round(page)).wrong).toBe(0);
});

test('T2: chạm đếm (chạm lại không đếm lại), chọn đúng → dây nối từng cặp; chơi hết lượt', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openLesson(page, 'Which group has more?');
  await expect.poll(() => spoken(page)).toContain('There are more mice.');
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  const r = await round(page);
  const items = r.items;
  expect(items.some((x) => x.answer === 'same')).toBe(true);
  await expect(page.locator('.mt-group[data-side="left"] .mt-thing')).toHaveCount(items[0].left.n);
  const thing = page.locator('.mt-group[data-side="left"] .mt-thing').first();
  await thing.click();
  await thing.click();
  await expect(page.locator('.mt-group[data-side="left"] .mt-thing.counted')).toHaveCount(1);
  await expect.poll(async () => {
    await page.locator(correctSel('t2', items[0])).click({ timeout: 300 }).catch(() => {});
    return page.locator('.mt-lines path').count();
  }).toBe(Math.min(items[0].left.n, items[0].right.n));
  await playRound(page, 't2');
  await expect(page.locator('.done-stars')).toBeVisible();
});

test('T3: làm mẫu bigger → greater than; chọn dấu sai → bật về khay; hết lượt', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openLesson(page, 'Hungry crocodile');
  await expect.poll(() => spoken(page)).toContain('In math, we say: seven is greater than four. And we write it like this!');
  await expect.poll(() => spoken(page)).toContain('Four is less than seven.');
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  const r = await round(page);
  await expect(page.locator('.mt-sign')).toHaveCount(2); // mức 1: > <
  await expect.poll(async () => {
    await page.locator(wrongSel('t3', r.items[0])).click({ timeout: 300 }).catch(() => {});
    return (await round(page)).wrong;
  }).toBe(1);
  await expect(page.locator('.mt-slot .mt-sign-char')).toHaveCount(0);
  await expect.poll(() => spoken(page)).toContain('The crocodile eats the bigger number. Which is bigger?');
  await playRound(page, 't3');
  await expect(page.locator('.done-stars')).toHaveAttribute('aria-label', '2 sao');
});

test('T6 mức 1: làm mẫu 10 khối → 1 thanh, xếp số đúng thanh chục + khối lẻ; sai → "You made …"', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openLesson(page, 'Tens and ones');
  await expect.poll(() => spoken(page)).toContain('Ten ones make one ten!');
  await expect.poll(() => spoken(page)).toContain('Thirty-four is three tens and four ones.');
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  const r = await round(page);
  expect(r.items[0].make % 10).toBe(0);
  await page.getByRole('button', { name: 'Thêm một khối lẻ' }).click();
  await expect.poll(async () => {
    await page.getByRole('button', { name: 'Xong' }).click({ timeout: 300 }).catch(() => {});
    return (await round(page)).wrong;
  }).toBe(1);
  await expect.poll(() => spoken(page)).toContain('You made one.');
  await page.locator('.mt-mat .mt-one').click();
  await playRound(page, 't6');
  await expect(page.locator('.done-stars')).toHaveAttribute('aria-label', '2 sao');
  expect((await progress(page, `math-t6/make/${r.items[0].make}`)).helped).toBe(1);
});

test('T4 Line them up: làm mẫu first / next / next / last; chạm sai → rung, "Find the smallest number left."; sai 2 lần cùng chỗ → số đúng sáng → missed', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openLesson(page, 'Line them up');
  await expect.poll(() => spoken(page)).toContain('First, three.');
  await expect.poll(() => spoken(page)).toContain('The numbers are in order: three, five, seven, nine.');
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  const r = await round(page);
  const item = r.items[0];
  await expect(page.locator('.mt-oslot')).toHaveCount(4);
  await expect(page.locator('.mt-olabel')).toHaveText(['first', 'next', 'next', 'last']);
  const order = orderOf(item);
  // Chạm số lớn nhất trước → sai; lần 2 cũng sai → số nhỏ nhất sáng.
  await expect.poll(async () => {
    const cur = await round(page);
    if (cur.wrong < 2) await page.locator(`.mt-otray .mt-ord[data-n="${order[3]}"]`).click({ timeout: 300 }).catch(() => {});
    return cur.wrong;
  }).toBe(2);
  await expect.poll(() => spoken(page)).toContain('Find the smallest number left.');
  await expect(page.locator(`.mt-ord.hint[data-n="${order[0]}"]`)).toBeVisible();
  for (const n of order) await page.locator(`.mt-otray .mt-ord[data-n="${n}"]`).click();
  await expect.poll(async () => (await round(page)).results[0]).toBe('missed');
  const rec = await progress(page, `math-t4/order-asc/${order.join('-')}`);
  expect([rec.missed, rec.kind]).toEqual([1, 't4:asc']);
  await playRound(page, 't4');
  await expect(page.locator('.done-stars')).toHaveAttribute('aria-label', '2 sao');
});

test('T5 Number line: ếch nhảy từng bước, Olly đếm bước; sai → "One jump only!" ếch về chỗ cũ; tia số không vượt phạm vi', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openLesson(page, 'Number line');
  await expect.poll(() => spoken(page)).toContain('Eight comes after seven.');
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  const r = await round(page);
  const item = r.items[0];
  await expect(page.locator('.mt-tick')).toHaveCount(11);
  await expect(page.locator('.mt-frog')).toHaveAttribute('data-at', String(item.n));
  // Chạm số cách 2 bước → ếch nhảy 2 bước rồi về.
  const far = item.ask === 'after' ? item.n + 2 : item.n - 2;
  const before = (await spoken(page)).length;
  await expect.poll(async () => {
    const cur = await round(page);
    if (cur.wrong < 1) await page.locator(`.mt-tick[data-n="${far}"]`).click({ timeout: 300 }).catch(() => {});
    return cur.wrong;
  }).toBe(1);
  await expect.poll(async () => (await spoken(page)).slice(before)).toEqual(expect.arrayContaining(['One jump!', 'Two jumps!', 'One jump only!']));
  await expect(page.locator('.mt-frog')).toHaveAttribute('data-at', String(item.n));
  await expect.poll(async () => {
    const cur = await round(page);
    if (cur.results[0] == null) await page.locator(correctSel('t5', item)).click({ timeout: 300 }).catch(() => {});
    return cur.results[0];
  }).toBe('helped');
  await playRound(page, 't5');
  await expect(page.locator('.done-stars')).toHaveAttribute('aria-label', '2 sao');
  expect((await progress(page, `math-t5/${item.ask}/${item.n}`)).kind).toBe(`t5:${item.ask}`);
});

test('T5 iPhone dọc: tia số 7 số, vẫn chơi được', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fakeSpeech(page);
  await startApp(page);
  await openLesson(page, 'Number line');
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  await expect(page.locator('.mt-tick')).toHaveCount(7);
  const box = await page.locator('.mt-numline').boundingBox();
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  for (const tick of await page.locator('.mt-tick').all()) expect((await tick.boundingBox()).height).toBeGreaterThanOrEqual(64);
  await playRound(page, 't5');
  await expect(page.locator('.done-stars')).toBeVisible();
});

test('T7 Read and compare: Olly đọc câu đố (karaoke); mức 1 đồ vật hiện sẵn đúng số; chọn sai → "Let\'s count!"; đúng → câu "… has more …"', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openLesson(page, 'Read and compare');
  await expect.poll(() => spoken(page)).toContain('Tom has 5 apples. Anna has 3 apples. Who has more?');
  await expect.poll(() => spoken(page)).toContain('Tom has more apples.');
  await page.getByRole('button', { name: 'Đến lượt con' }).click();
  const r = await round(page);
  const item = r.items[0];
  await expect(page.locator('.mt-puzzle .sword').first()).toBeVisible();
  for (const [i, side] of ['left', 'right'].entries()) {
    await expect(page.locator(`.mt-person[data-side="${side}"] .mt-pthing`)).toHaveCount(item.people[i].n);
  }
  await expect.poll(async () => {
    const cur = await round(page);
    if (cur.wrong < 1) await page.locator(wrongSel('t7', item)).click({ timeout: 300 }).catch(() => {});
    return cur.wrong;
  }).toBe(1);
  await expect.poll(async () => (await spoken(page)).some((x) => x.startsWith("Let's count!"))).toBe(true);
  await playRound(page, 't7');
  await expect(page.locator('.done-stars')).toHaveAttribute('aria-label', '2 sao');
  expect((await progress(page, `math-t7/${item.ask}/${item.id}`)).helped).toBe(1);
});

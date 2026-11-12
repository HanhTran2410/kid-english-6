// 🧩 Quest (SPEC-quest.md mục 12.2–12.3): danh sách trò, kho rỗng, Quest 1 Read and Do (giới thiệu put, cầm đồ → ô
// đích, chấm 3 trường, chạm chỗ khi chưa cầm đồ, sai 2 lần), Quest 2 Build a Sentence (giữ thẻ đúng, Olly xếp nốt),
// ra nền rồi quay lại, iPhone dọc.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, spoken } from './helpers.js';

const round = (page) => page.evaluate(() => {
  const r = window.kidEnglish6.current?.params?.round;
  return r ? JSON.parse(JSON.stringify(r)) : null;
});
const progress = (page, key) => page.evaluate((k) => window.kidEnglish6.db.get('progress', k), key);

/** Đánh dấu bé đã đọc xong bài Phonics các nhóm `groups` ở khu Read. */
async function readDone(page, groups) {
  await page.evaluate(async (gs) => {
    const { db } = window.kidEnglish6;
    for (const g of gs) {
      await db.put('progress', { key: `lesson:phonics-g${g}`, lessonId: `phonics-g${g}`, part: '', plays: 1, completedAt: 1, bestStars: 3, lastStars: 3, lastAt: 1 });
    }
  }, groups);
}

async function openQuest(page, title) {
  await page.getByRole('button', { name: 'Thử thách' }).click();
  await page.getByRole('button', { name: title }).click();
}

/** Bấm ▶ "Đến lượt con" (hoặc ⏭) cho tới khi vào mục 1. */
async function toItems(page) {
  const go = page.getByRole('button', { name: 'Đến lượt con' });
  const skip = page.getByRole('button', { name: 'Bỏ qua phần làm mẫu' });
  await expect.poll(async () => {
    for (const b of [go, skip]) await b.click({ timeout: 200 }).catch(() => {});
    return (await round(page))?.phase;
  }, { timeout: 20_000 }).toBe('item');
}

/** Quest 1: làm đúng các việc chưa xong của mục đang hiện. */
async function doQ1(page, item) {
  const r = await round(page);
  const done = r.q1?.done ?? item.actions.map(() => false);
  for (const [i, a] of item.actions.entries()) {
    if (done[i]) continue;
    await page.locator(`.qt-shelf .qt-thing[data-thing="${a.thing}"]`).click({ timeout: 500 }).catch(() => {});
    await page.locator(`.qt-target[data-place="${a.place}"][data-where="${a.where}"]`).click({ timeout: 500 }).catch(() => {});
  }
}

/** Quest 2: chạm thẻ theo đúng thứ tự vào các chỗ còn trống. */
async function doQ2(page, item) {
  for (let i = 0; i < item.words.length; i++) {
    const filled = await page.locator(`.qt-slot[data-index="${i}"] .qt-token`).count();
    if (filled) continue;
    await page.locator(`.qt-tray .qt-token[data-word="${item.words[i]}"]`).first().click({ timeout: 500 }).catch(() => {});
  }
}

async function playRound(page, key) {
  for (let guard = 0; guard < 600; guard++) {
    if (await page.locator('.done-panel').isVisible()) return;
    const skip = page.getByRole('button', { name: 'Bỏ qua phần đọc' });
    const r = await round(page);
    if (await skip.isVisible()) await skip.click().catch(() => {});
    else if (r && r.phase === 'item' && r.results[r.index] == null) {
      const item = r.items[r.index];
      if (key === 'q1') await doQ1(page, item);
      else await doQ2(page, item);
    }
    await page.waitForTimeout(80);
  }
  throw new Error('Không xong lượt');
}

test('QU-02: chưa đọc xong bài nào → Quest 1 mờ, mở vào "Let\'s read more first!"; Quest 2 vẫn chơi được (nhóm 1)', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Thử thách' }).click();
  await expect(page.locator('.lesson-card')).toHaveCount(2);
  await expect(page.locator('.lesson-card.next')).toHaveAttribute('data-lesson', 'quest-q1');
  await expect(page.locator('.lesson-card[data-lesson="quest-q1"]')).toHaveClass(/dim/);
  await expect(page.locator('.lesson-card[data-lesson="quest-q2"]')).not.toHaveClass(/dim/);
  await page.getByRole('button', { name: 'Read and Do' }).click();
  await expect.poll(() => spoken(page)).toContain("Let's read more first!");
  await expect(page.locator('#app')).toHaveAttribute('data-empty', '1');
  expect(await progress(page, 'lesson:quest-q1/L1')).toBeUndefined();
});

test('QU-03 + QU-15: Quest 1 mức 1 — giới thiệu put; chạm chỗ khi chưa cầm đồ không tính sai; cầm đồ → ô đích → đúng; hết lượt → 3⭐', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await readDone(page, [1, 2, 3]);
  await openQuest(page, 'Read and Do');
  await expect.poll(() => spoken(page)).toContain('This word is put. Put means: move it there.');
  await toItems(page);
  expect(await progress(page, 'quest/word/put')).toBeTruthy();
  const r = await round(page);
  expect(r.items).toHaveLength(8);
  const item = r.items[0];
  await expect.poll(() => spoken(page)).toContain(item.text);
  await expect(page.locator('.qt-instruction .sword').first()).toBeVisible();
  // Chạm chỗ đặt khi chưa cầm đồ → nhắc, không tính sai.
  await page.locator('.qt-place').first().click();
  await expect.poll(() => spoken(page)).toContain('Tap a thing first.');
  // Cầm đồ → ô đích hiện hình mờ của đồ; chạm lại đồ → bỏ cầm.
  const a = item.actions[0];
  const thing = page.locator(`.qt-shelf .qt-thing[data-thing="${a.thing}"]`);
  await thing.click();
  await expect(thing).toHaveClass(/holding/);
  await expect(page.locator('.qt-target:not([hidden])').first()).toBeVisible();
  await expect(page.locator('.qt-nudge')).toHaveText('Now tap a place.');
  await thing.click();
  await expect(page.locator('.qt-target:not([hidden])')).toHaveCount(0);
  await playRound(page, 'q1');
  await expect(page.locator('.done-stars')).toHaveAttribute('aria-label', '3 sao');
  const rec = await progress(page, `quest-q1/do/${item.id}`);
  expect([rec.independent, rec.kind]).toEqual([1, item.kind]);
  expect((await progress(page, 'lesson:quest-q1/L1')).bestStars).toBe(3);
});

test('QU-04 + QU-12 + QU-13: Quest 1 sai đồ / sai chỗ / sai vị trí → đúng câu nhắc; sai 2 → tiếng Việt một lần + đồ đúng sáng → missed', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await readDone(page, [1, 2, 3]);
  await openQuest(page, 'Read and Do');
  await toItems(page);
  const r = await round(page);
  const item = r.items[0];
  const a = item.actions[0];
  const wrongThing = item.shelf.find((x) => x !== a.thing);
  const otherPlace = item.places.find((p) => p !== a.place && p !== 'bed') ?? item.places.find((p) => p !== a.place);
  const otherWhere = { box: 'in', bag: 'in', cup: 'in', bed: 'on' }[otherPlace];
  const tap = async (thing, place, where) => {
    await page.locator(`.qt-shelf .qt-thing[data-thing="${thing}"]`).click();
    await page.locator(`.qt-target[data-place="${place}"][data-where="${where}"]`).click();
  };
  const before = (await spoken(page)).length;
  await tap(wrongThing, a.place, a.where);
  const article = /^[aeiou]/.test(wrongThing) ? 'an' : 'a';
  await expect.poll(async () => (await spoken(page)).slice(before)).toContain(`That is ${article} ${wrongThing}. Find the ${a.thing}!`);
  await expect(page.locator(`.qt-instruction .sword.qt-hint-word[data-word="${a.thing}"]`)).toBeVisible();
  await expect.poll(async () => (await round(page)).q1.wrong[0]).toBe(1);
  // Sai lần 2 (sai chỗ): tiếng Việt một lần + đồ đúng sáng.
  await tap(a.thing, otherPlace, otherWhere);
  await expect.poll(async () => (await spoken(page)).slice(before)).toContain(`That is the ${otherPlace}. Put it ${a.where} the ${a.place}!`);
  await expect(page.locator('.vi-help')).toBeVisible();
  await expect(page.locator(`.qt-shelf .qt-thing.hint[data-thing="${a.thing}"]`)).toBeVisible();
  await tap(a.thing, a.place, a.where);
  await expect.poll(async () => (await round(page)).results[0]).toBe('missed');
  // Sai vị trí (mục 2, nếu chỗ có 2 vị trí): chỉ báo lỗi vị trí.
  const r2 = await round(page);
  const b = r2.items[1].actions[0];
  const alt = { box: b.where === 'in' ? 'on' : 'in', bed: 'on' }[b.place];
  if (alt && alt !== b.where) {
    await expect.poll(async () => (await round(page)).index).toBe(1);
    const b2 = (await spoken(page)).length;
    await tap(b.thing, b.place, alt);
    await expect.poll(async () => (await spoken(page)).slice(b2)).toContain(`The ${b.thing} is ${alt} the ${b.place}. Put it ${b.where.toUpperCase()} the ${b.place}!`);
  }
});

test('QU-05 + QU-18: Quest 2 — thẻ đúng chỗ giữ lại + khóa, thẻ sai về khay; sai 2 lượt → Olly xếp nốt → missed', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await readDone(page, [1, 2, 3]);
  await openQuest(page, 'Build a Sentence');
  await toItems(page);
  const r = await round(page);
  const item = r.items[0];
  await expect(page.locator('.qt-slot')).toHaveCount(item.words.length);
  // Mức 1: thẻ đầu câu đặt sẵn.
  await expect(page.locator('.qt-slot[data-index="0"] .qt-token.locked')).toHaveText(item.words[0]);
  // Xếp sai: đảo 2 thẻ cuối.
  const rest = item.words.slice(1);
  const wrongOrder = rest.length >= 2 ? [...rest.slice(0, -2), rest.at(-1), rest.at(-2)] : rest;
  const fill = async (order) => {
    for (const w of order) {
      await page.locator(`.qt-tray .qt-token[data-word="${w}"]`).first().click();
    }
  };
  test.skip(rest.length < 2 || rest.at(-1) === rest.at(-2), 'câu quá ngắn để xếp sai');
  await fill(wrongOrder);
  await expect.poll(async () => (await round(page)).wrong).toBe(1);
  await expect(page.locator('.qt-slot .qt-token.locked')).toHaveCount(item.words.length - 2);
  await expect(page.locator('.qt-tray .qt-token')).toHaveCount(2);
  await fill([rest.at(-1), rest.at(-2)]);
  await expect.poll(async () => (await round(page)).results[0]).toBe('missed');
  await expect.poll(() => spoken(page)).toContain(item.en);
  await playRound(page, 'q2');
  await expect(page.locator('.done-stars')).toHaveAttribute('aria-label', '2 sao');
  expect((await progress(page, `quest-q2/build/${item.id}`)).missed).toBe(1);
});

test('QU-06: ra nền giữa mục Quest 1 rồi quay lại → đúng mục, lần sai trước vẫn tính', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await readDone(page, [1, 2, 3]);
  await openQuest(page, 'Read and Do');
  await toItems(page);
  const before = await round(page);
  const a = before.items[0].actions[0];
  const wrongThing = before.items[0].shelf.find((x) => x !== a.thing);
  await page.locator(`.qt-shelf .qt-thing[data-thing="${wrongThing}"]`).click();
  await page.locator(`.qt-target[data-place="${a.place}"][data-where="${a.where}"]`).click();
  await expect.poll(async () => (await round(page)).q1?.wrong[0]).toBe(1);
  const setVisibility = (state) => page.evaluate((s) => {
    Object.defineProperty(document, 'visibilityState', { value: s, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
  await setVisibility('hidden');
  await setVisibility('visible');
  await page.locator('.resume-overlay').getByRole('button', { name: 'Bắt đầu' }).click();
  const after = await round(page);
  expect(after.index).toBe(0);
  expect(after.items).toEqual(before.items);
  await doQ1(page, after.items[0]);
  await expect.poll(async () => (await round(page)).results[0]).toBe('helped');
});

test('QU-07: iPhone dọc — đồ / ô đích / thẻ ≥ 64 px, không tràn ngang', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fakeSpeech(page);
  await startApp(page);
  await readDone(page, [1, 2, 3, 4, 5, 6, 7]);
  await openQuest(page, 'Read and Do');
  await toItems(page);
  const item = (await round(page)).items[0];
  await page.locator(`.qt-shelf .qt-thing[data-thing="${item.actions[0].thing}"]`).click();
  for (const el of await page.locator('.qt-shelf .qt-thing, .qt-target:not([hidden])').all()) {
    const box = await el.boundingBox();
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(64);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

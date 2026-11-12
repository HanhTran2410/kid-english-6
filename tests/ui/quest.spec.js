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

/** Quest 3: chạm lựa chọn tới khi app nhận (chạm lúc Olly đang nói bị bỏ qua — SPEC-quest 8.2). */
async function tapChoice(page, word, accepted) {
  await expect.poll(async () => {
    await page.locator(`.qt-choice[data-word="${word}"]`).click({ timeout: 300 }).catch(() => {});
    return accepted();
  }, { timeout: 15_000 }).toBe(true);
}
const cls = (page, word, c) => async () => (await page.locator(`.qt-choice[data-word="${word}"]`).getAttribute('class')).includes(c);

/** Quest 4: chữ cần đặt cho từ i theo thứ tự ô của từ (bỏ ô đã khóa của từ khác). */
function q4Letters(grid, locked, i) {
  const e = grid.entries[i];
  const [dr, dc] = e.dir === 'across' ? [0, 1] : [1, 0];
  return [...e.word].filter((_, k) => {
    const cell = grid.cells.find((x) => x.row === e.row + dr * k && x.col === e.col + dc * k);
    return !cell.entries.some((j) => locked[j]);
  });
}
const q4Sig = (page) => page.evaluate(() => {
  const st = window.kidEnglish6.current?.params?.round?.q4;
  return JSON.stringify([document.querySelectorAll('.cw-tile:not([hidden])').length, st?.wrong, st?.locked]);
});
/** Chạm hình gợi ý của từ i tới khi được chọn (chạm lúc Olly đang nói bị bỏ qua — 8.2). */
async function q4Select(page, i) {
  const clue = page.locator(`.cw-clue[data-entry="${i}"]`);
  await expect.poll(async () => {
    await clue.click({ timeout: 300 }).catch(() => {});
    return (await clue.getAttribute('class')).includes('active');
  }, { timeout: 15_000 }).toBe(true);
}
/** Chạm chữ trong khay tới khi chữ vào ô (hoặc từ được chấm). */
async function q4Put(page, ch) {
  const before = await q4Sig(page);
  await expect.poll(async () => {
    await page.locator(`.cw-tile[data-letter="${ch}"]:not([hidden])`).first().click({ timeout: 300 }).catch(() => {});
    return (await q4Sig(page)) !== before;
  }, { timeout: 15_000 }).toBe(true);
}
/** Quest 4: điền đúng một từ chưa khóa của lưới đang hiện. */
async function doQ4(page, item, r) {
  const locked = r.q4?.locked ?? item.grid.entries.map(() => false);
  const i = locked.findIndex((x) => !x);
  if (i < 0) return;
  await q4Select(page, i);
  for (const ch of q4Letters(item.grid, locked, i)) await q4Put(page, ch);
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
      else if (key === 'q3') await page.locator(`.qt-choice[data-word="${item.word}"]`).click({ timeout: 500 }).catch(() => {});
      else if (key === 'q4') await doQ4(page, item, r);
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
  await expect(page.locator('.lesson-card')).toHaveCount(4);
  await expect(page.locator('.lesson-card.next')).toHaveAttribute('data-lesson', 'quest-q1');
  await expect(page.locator('.lesson-card[data-lesson="quest-q1"]')).toHaveClass(/dim/);
  await expect(page.locator('.lesson-card[data-lesson="quest-q2"]')).not.toHaveClass(/dim/);
  // Quest 3: nhóm 1 chưa có câu đố bé đọc được (RD-14).
  await expect(page.locator('.lesson-card[data-lesson="quest-q3"]')).toHaveClass(/dim/);
  // Quest 4 không cần đọc câu: ô chữ từ nhóm 1 (ant, pin, tap…) ghép được.
  await expect(page.locator('.lesson-card[data-lesson="quest-q4"]')).not.toHaveClass(/dim/);
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

test('QU-19 + QU-20: Quest 3 mức 1 — 3 hình, 2 câu gợi ý; sai 1 → mờ tại chỗ + âm đầu phát từ file → helped; câu tổng kết; hết lượt 2⭐ (7/8 đúng ngay)', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await readDone(page, [1, 2, 3]);
  await openQuest(page, 'Guess the Word');
  await toItems(page);
  const r = await round(page);
  expect(r.items).toHaveLength(8);
  const item = r.items[0];
  expect(item.show).toBe(1);
  await expect(page.locator('.qt-choice.pic')).toHaveCount(3);
  await expect.poll(() => spoken(page)).toContain('What is it?');
  await expect.poll(() => spoken(page)).toContain(item.en.join(' '));
  const order = await page.locator('.qt-choice').evaluateAll((els) => els.map((e) => e.dataset.word));
  expect(order).toEqual(item.options);
  const wrong = item.options.find((w) => w !== item.word);
  await tapChoice(page, wrong, cls(page, wrong, 'tried'));
  await expect.poll(() => spoken(page)).toContain('It starts with…');
  // Âm đầu phát từ file âm rời (không đọc tên chữ bằng giọng máy).
  await expect(page.locator('.stage')).toHaveAttribute('data-last-sound', item.first.sound);
  expect(await page.locator('.qt-choice').evaluateAll((els) => els.map((e) => e.dataset.word))).toEqual(order);
  await tapChoice(page, item.word, async () => (await round(page)).results[0] != null);
  expect((await round(page)).results[0]).toBe('helped');
  await expect.poll(() => spoken(page)).toContain(item.sum);
  await playRound(page, 'q3');
  await expect(page.locator('.done-stars')).toHaveAttribute('aria-label', '2 sao');
  expect((await progress(page, `quest-q3/guess/${item.word}`)).helped).toBe(1);
});

test('Quest 3 mức 2 — chữ, không hình; làm mẫu có hình nhỏ; sai 1 → chữ đầu mọi lựa chọn sáng; sai 2 → đáp án sáng → missed', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await readDone(page, [1, 2, 3, 4, 5, 6, 7]);
  await page.evaluate(() => window.kidEnglish6.db.put('progress', { key: 'lesson:quest-q3/L1', lessonId: 'quest-q3', part: 'L1', plays: 1, completedAt: 1, bestStars: 3, lastStars: 3, lastAt: 1 }));
  await openQuest(page, 'Guess the Word');
  await page.getByRole('button', { name: 'Mức 2' }).click();
  await expect(page.locator('.qt-mini').first()).toBeVisible();
  await toItems(page);
  const item = (await round(page)).items[0];
  expect(item.show).toBe(2);
  await expect(page.locator('.qt-choice')).toHaveCount(3);
  await expect(page.locator('.qt-choice.pic, .qt-mini')).toHaveCount(0);
  const wrongs = item.options.filter((w) => w !== item.word);
  await tapChoice(page, wrongs[0], cls(page, wrongs[0], 'tried'));
  await expect(page.locator('.qt-first.lit')).toHaveCount(3);
  await tapChoice(page, wrongs[1], cls(page, wrongs[1], 'tried'));
  await expect(page.locator(`.qt-choice[data-word="${item.word}"]`)).toHaveClass(/hint/);
  await tapChoice(page, item.word, async () => (await round(page)).results[0] != null);
  expect((await round(page)).results[0]).toBe('missed');
});

test('QU-21: Quest 4 mức 1 — chạm hình → ô của từ sáng + Olly đánh vần âm từ file; đúng → khóa; ô giao nhau dùng chung, từ kia thấy sẵn chữ; 2 lưới = 6 mục → 3⭐', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await readDone(page, [1, 2, 3]);
  await openQuest(page, 'Mini Crossword');
  await toItems(page);
  const r = await round(page);
  expect(r.items).toHaveLength(6);
  const item = r.items[0];
  const { grid } = item;
  await expect(page.locator('.cw-cell')).toHaveCount(grid.cells.length);
  await expect(page.locator('.cw-clue')).toHaveCount(3);
  const w0 = grid.entries[0].word;
  await q4Select(page, 0);
  await expect(page.locator('.cw-cell.active')).toHaveCount(w0.length);
  await expect.poll(() => spoken(page)).toContain(`Spell: ${w0}!`);
  // Mức 1: đánh vần bằng file âm rời (âm cuối của từ là âm phát sau cùng).
  await expect(page.locator('.stage')).toHaveAttribute('data-last-sound', item.soundsOf[w0].at(-1));
  await expect(page.locator('.cw-tile')).toHaveCount(w0.length); // mức 1 không có chữ nhiễu
  for (const ch of w0) await q4Put(page, ch);
  await expect.poll(async () => (await round(page)).q4.locked[0]).toBe(true);
  await expect(page.locator('.cw-cell.locked')).toHaveCount(w0.length);
  // Ô giao nhau: một ô, đã khóa, có sẵn chữ; từ kia chỉ cần điền các ô còn lại.
  const cross = grid.cells.find((c) => c.entries.includes(0) && c.entries.length === 2);
  const j = cross.entries.find((x) => x !== 0);
  const crossEl = page.locator(`.cw-cell[data-key="${cross.row},${cross.col}"]`);
  await expect(crossEl).toHaveClass(/locked/);
  await expect(crossEl.locator('.cw-letter')).toHaveText(cross.letter);
  await q4Select(page, j);
  const need = q4Letters(grid, [true, false, false], j);
  expect(need.length).toBe(grid.entries[j].word.length - 1);
  await expect(page.locator('.cw-tile')).toHaveCount(need.length);
  await playRound(page, 'q4');
  await expect(page.locator('.done-stars')).toHaveAttribute('aria-label', '3 sao');
  expect((await progress(page, `quest-q4/cross/${w0}`)).independent).toBe(1);
  expect((await progress(page, 'lesson:quest-q4/L1')).bestStars).toBe(3);
});

test('Quest 4 sai: chỉ ô sai của từ đang chọn rung + về khay, ô đúng giữ; sai 2 → Olly điền nốt, khóa → missed', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await readDone(page, [1, 2, 3]);
  await openQuest(page, 'Mini Crossword');
  await toItems(page);
  const { grid } = (await round(page)).items[0];
  const i = grid.entries.findIndex((e) => e.word[0] !== e.word.at(-1));
  const word = grid.entries[i].word;
  await q4Select(page, i);
  // Đặt ngược: chữ đầu / cuối sai chỗ, chữ giữa (nếu trùng) đúng.
  for (const ch of [...word].reverse()) await q4Put(page, ch);
  await expect.poll(async () => (await round(page)).q4.wrong[i]).toBe(1);
  const filled = await page.locator('.cw-cell.active .cw-letter').evaluateAll((els) => els.filter((e) => e.textContent).length);
  expect(filled).toBe([...word].filter((ch, k) => ch === word[word.length - 1 - k]).length);
  await expect(page.locator('.cw-cell.locked')).toHaveCount(0); // từ khác không bị đụng tới
  await expect.poll(() => spoken(page)).toContain('Try again!');
  // Lần 2 lại đặt ngược các ô còn trống → sai 2.
  const empties = [...word].filter((ch, k) => ch !== word[word.length - 1 - k]);
  for (const ch of [...empties].reverse()) await q4Put(page, ch);
  await expect.poll(async () => (await round(page)).q4.results[i]).toBe('missed');
  await expect(page.locator('.cw-cell.locked')).toHaveCount(word.length);
});

test('QU-26: iPhone dọc, Quest 4 mức 3 — ô ≥ 48 px, lưới trên, hình + khay dưới, không tràn, không cuộn khi điền', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fakeSpeech(page);
  await startApp(page);
  await readDone(page, [1, 2, 3, 4, 5, 6, 7]);
  await page.evaluate(() => { window.kidEnglish6.settings.questAllLevels = true; });
  await openQuest(page, 'Mini Crossword');
  await page.getByRole('button', { name: 'Mức 3' }).click();
  await toItems(page);
  const item = (await round(page)).items[0];
  expect(item.grid.entries).toHaveLength(4);
  await q4Select(page, 0);
  await expect(page.locator('.cw-tile')).toHaveCount(item.grid.entries[0].word.length + 2); // 2 chữ nhiễu
  for (const el of await page.locator('.cw-cell').all()) {
    const box = await el.boundingBox();
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(48);
  }
  const grid = await page.locator('.cw-grid').boundingBox();
  const tray = await page.locator('.cw-tray').boundingBox();
  expect(tray.y).toBeGreaterThan(grid.y + grid.height - 1);
  expect(tray.y + tray.height).toBeLessThanOrEqual(844);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.scrollingElement.scrollHeight)).toBeLessThanOrEqual(844);
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

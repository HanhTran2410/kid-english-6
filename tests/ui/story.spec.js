// 📚 Truyện ngắn (SPEC-story.md mục 11.2): tab Truyện, ① Nghe truyện (lật trang, karaoke, ⏸, chạm từ, ra nền),
// ② Bé đọc (✅ / ⏭, đọc mẫu khi chưa nghe hết), ③ Câu hỏi (chọn hình / chọn chữ / xếp thứ tự, sai 1 / sai 2, sao).
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, spoken } from './helpers.js';

const app = (page, fn, arg) => page.evaluate(fn, arg);
const go = (page, params) => app(page, (p) => window.kidEnglish6.go('story', p), params);
const counter = (page) => page.locator('.scene-counter');
const progress = (page, key) => app(page, (k) => window.kidEnglish6.db.get('progress', k), key);

/** Câu hỏi đã chấm xong (kết quả đã ghi vào kho tiến độ). */
const answered = (page, storyId, qid) => progress(page, `${storyId}/quiz/${qid}`).then(Boolean);

/**
 * Xếp thẻ trang `id` vào ô thứ k (chạm thẻ trong khay). Xong khi thẻ nằm ở ô đó — hoặc câu hỏi đã chấm xong / có dấu
 * hiệu `also` (ở ?fast app chấm và chuyển màn rất nhanh sau thẻ cuối).
 */
async function placeCard(page, id, k, storyId, also = null) {
  await tapUntil(page.locator(`.order-tray .order-card[data-page="${id}"]`), async () => (
    (await page.locator(`.order-slot:nth-child(${k + 1}) .order-card[data-page="${id}"]`).count())
    || (also && (await page.locator(also).count()))
    || answered(page, storyId, 'q3')));
}

async function open(page, opts = {}) {
  await fakeSpeech(page, opts);
  await startApp(page);
}

/**
 * Bấm `locator` tới khi `done()` đúng (Olly đang nói thì app bỏ qua cú chạm). Sau mỗi lần bấm chờ một nhịp để kết quả kịp
 * ghi — không thì lần bấm lại có thể trúng nút cùng tên của câu sau.
 */
async function tapUntil(locator, done, timeout = 15_000) {
  await expect(async () => {
    if (await done()) return;
    await locator.click({ timeout: 1000 });
    await locator.page().waitForTimeout(250);
    expect(await done()).toBeTruthy();
  }).toPass({ timeout });
}

test('ST-01 / 02: tab 📚 Truyện → 7 truyện, ⭐ Tiếp theo ở nhóm 1; nghe hết → lật đủ trang, đọc đúng thứ tự, The end!, listened + 1', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Tập đọc' }).click();
  await page.getByRole('button', { name: '📚 Truyện' }).click();
  await expect(page.locator('.story-card')).toHaveCount(7);
  await expect(page.locator('.story-card.next')).toHaveAttribute('data-story', 'story-g1-pip');
  await expect(page.locator('.story-card[data-story="story-g7-lost-coin"] .story-card-note')).toHaveText('Nhiều từ mới — nghe trước nhé');
  await page.locator('.story-card[data-story="story-g1-pip"]').click();
  await expect(page.locator('.scene-done .done-title')).toHaveText('The end!', { timeout: 60_000 });
  const story = await app(page, async () => (await import('./js/story/builtin-stories.js')).BUILTIN_STORIES[0]);
  const order = story.pages.flatMap((p) => p.sentences.map((s) => s.en));
  const said = await spoken(page);
  expect(said.filter((s) => order.includes(s))).toEqual(order);
  await expect.poll(() => progress(page, 'lesson:story-g1-pip').then((p) => p?.listened)).toBe(1);
  const end = page.locator('.scene-done');
  for (const name of ['Trả lời câu hỏi', 'Con tự đọc', 'Nghe lại từ đầu']) await expect(end.getByRole('button', { name })).toBeVisible();
  await end.getByRole('button', { name: 'Nghe lại từ đầu' }).click();
  await expect(counter(page)).toHaveText('1 / 5');
});

test('ST-04 / 18 / 19 / 05: tắt tự chạy không tự lật; ⏸ rồi chạm từ không đọc tiếp; bấm ▶ liên tục chỉ đọc trang cuối; quay lại từ nền đang dừng', async ({ page }) => {
  await open(page);
  await app(page, () => window.kidEnglish6.setSetting('sceneAutoNext', false));
  await go(page, { storyId: 'story-g3-red-hat' });
  await expect.poll(() => page.locator('.story-screen').getAttribute('data-state')).toBe('PAGE_DONE');
  await page.waitForTimeout(400);
  await expect(counter(page)).toHaveText('1 / 5'); // tắt tự chạy: không tự lật
  await expect(page.getByRole('button', { name: 'Trang sau' })).toHaveClass(/nudge/);

  // ST-19: bấm Trang sau 3 lần liên tiếp → chỉ trang 4 được đọc tới hết, không hai giọng chồng nhau.
  const before = (await spoken(page)).length;
  for (let k = 0; k < 3; k++) await page.getByRole('button', { name: 'Trang sau' }).click();
  await expect(counter(page)).toHaveText('4 / 5');
  await expect.poll(() => page.locator('.story-screen').getAttribute('data-state')).toBe('PAGE_DONE');
  const after = (await spoken(page)).slice(before);
  expect(after).toContain('He sits on the log.');
  expect(after).not.toContain('The dog drops the hat.');

  // ST-18: ⏸ rồi chạm từ → đọc riêng từ đó, sau 3 giây KHÔNG đọc tiếp câu.
  await page.getByRole('button', { name: 'Trang trước' }).click();
  await page.getByRole('button', { name: 'Dừng' }).click();
  await expect(page.getByRole('button', { name: 'Chạy' })).toBeVisible();
  await page.locator('.story-sent .sword', { hasText: 'dog' }).click();
  await expect.poll(() => spoken(page).then((s) => s.at(-1))).toBe('dog');
  await page.waitForTimeout(500); // 3 giây ở ?fast
  expect((await spoken(page)).at(-1)).toBe('dog');
  await expect(page.locator('.story-screen')).toHaveAttribute('data-state', 'PAUSED');
  await expect(page.locator('.sword.tricky').first()).toBeVisible(); // "A" / "the" gạch chân

  // ST-05: quay lại từ nền (app mở lại màn với continueDirectly) → đúng trang, đang dừng, không tự đọc.
  const n = (await spoken(page)).length;
  await go(page, { storyId: 'story-g3-red-hat', page: 2, continueDirectly: true });
  await expect(counter(page)).toHaveText('3 / 5');
  await page.waitForTimeout(400);
  await expect(page.locator('.story-screen')).toHaveAttribute('data-state', 'PAUSED');
  expect((await spoken(page)).length).toBe(n);
});

test('ST-07: câu hỏi đúng hết lần đầu → 3 sao, plays + 1, kết quả từng câu independent', async ({ page }) => {
  await open(page);
  await go(page, { storyId: 'story-g3-red-hat', mode: 'quiz' });
  const q = (id) => page.locator(`.story-quiz[data-question="${id}"]`);
  await expect(q('q1')).toBeVisible();
  await tapUntil(page.locator('[data-choice="dog"]'), () => answered(page, 'story-g3-red-hat', 'q1'));
  await expect(q('q2')).toBeVisible();
  await tapUntil(page.locator('[data-choice="glad"]'), () => answered(page, 'story-g3-red-hat', 'q2'));
  await expect(q('q3')).toBeVisible();
  for (const [k, id] of ['p1', 'p3', 'p5'].entries()) {
    await placeCard(page, id, k, 'story-g3-red-hat');
  }
  await expect(page.locator('.done-stars')).toHaveText('⭐⭐⭐', { timeout: 15_000 });
  const p = await progress(page, 'lesson:story-g3-red-hat');
  expect(p.plays).toBe(1);
  expect(p.bestStars).toBe(3);
  for (const id of ['q1', 'q2', 'q3']) expect((await progress(page, `story-g3-red-hat/quiz/${id}`)).independent).toBe(1);
});

test('ST-08 / 09 / 10: sai 1 → mờ + hiện trang có đáp án; sai 2 → tiếng Việt + đáp án; order sai → thẻ đúng ở lại; 1 sao', async ({ page }) => {
  await open(page);
  await go(page, { storyId: 'story-g3-red-hat', mode: 'quiz' });
  // q1 (pick): sai 1 lần (cat) → cat mờ, hiện trang 3, rồi đúng → helped.
  await tapUntil(page.locator('[data-choice="cat"]'), () => page.locator('[data-choice="cat"].dim').count());
  await expect(page.locator('.story-hint-page [data-page="p3"]')).toBeVisible();
  await tapUntil(page.locator('[data-choice="dog"]'), () => answered(page, 'story-g3-red-hat', 'q1'));
  // q2 (word): sai 2 lần không được vì chỉ có 2 lựa chọn (sad mờ sau lần 1) → sai 1 rồi đáp án sáng khi sai 2 không xảy ra;
  // kiểm tra sai 1 → helped.
  await expect(page.locator('.story-quiz[data-question="q2"]')).toBeVisible();
  await tapUntil(page.locator('[data-choice="sad"]'), () => page.locator('[data-choice="sad"].dim').count());
  await expect(page.locator('.story-hint-page [data-page="p5"]')).toBeVisible();
  await tapUntil(page.locator('[data-choice="glad"]'), () => answered(page, 'story-g3-red-hat', 'q2'));
  // q3 (order): đặt p3, p1, p5 → chỉ ô last đúng (khóa, viền xanh), hai thẻ sai về khay; lần 2 sai tiếp → tiếng Việt + Olly xếp → missed.
  await expect(page.locator('.story-quiz[data-question="q3"]')).toBeVisible();
  for (const [k, id] of ['p3', 'p1', 'p5'].entries()) {
    await placeCard(page, id, k, 'story-g3-red-hat', '.order-slot.right');
  }
  await expect(page.locator('.order-slot[data-slot="last"]')).toHaveClass(/right/);
  await expect(page.locator('.order-slot[data-slot="last"] .order-card[data-page="p5"]')).toBeVisible();
  await expect(page.locator('.order-tray .order-card')).toHaveCount(2);
  for (const [k, id] of ['p3', 'p1'].entries()) {
    await placeCard(page, id, k, 'story-g3-red-hat', '.vi-help');
  }
  await expect.poll(() => spoken(page)).toContain('Đầu tiên Sam có mũ, rồi con chó lấy mũ, cuối cùng chó thả mũ ra và Sam nhặt lại.');
  await expect(page.locator('.done-stars')).toHaveText('⭐☆☆', { timeout: 20_000 });
  expect((await progress(page, 'story-g3-red-hat/quiz/q1')).helped).toBe(1);
  expect((await progress(page, 'story-g3-red-hat/quiz/q2')).helped).toBe(1);
  expect((await progress(page, 'story-g3-red-hat/quiz/q3')).missed).toBe(1);
});

test('ST-09: chọn hình sai 2 lần → tiếng Việt + đáp án sáng → missed', async ({ page }) => {
  await open(page);
  await go(page, { storyId: 'story-g3-red-hat', mode: 'quiz' });
  await tapUntil(page.locator('[data-choice="cat"]'), () => page.locator('[data-choice="cat"].dim').count());
  await tapUntil(page.locator('[data-choice="pig"]'), () => page.locator('.vi-help').count());
  await expect(page.locator('.vi-help')).toContainText('Con chó lấy cái mũ');
  await expect(page.locator('[data-choice="dog"]')).toHaveClass(/hint/);
  await tapUntil(page.locator('[data-choice="dog"]'), () => answered(page, 'story-g3-red-hat', 'q1'));
  await expect.poll(() => progress(page, 'story-g3-red-hat/quiz/q1').then((p) => p?.missed)).toBe(1);
});

test('ST-22: thoát giữa câu hỏi → không tính sao, plays không đổi, câu đã chấm vẫn ghi', async ({ page }) => {
  await open(page);
  await go(page, { storyId: 'story-g1-pip', mode: 'quiz' });
  await tapUntil(page.locator('[data-choice="ant"]'), () => answered(page, 'story-g1-pip', 'q1'));
  await expect(page.locator('.story-quiz[data-question="q2"]')).toBeVisible();
  await page.getByRole('button', { name: 'Về' }).first().click();
  await expect(page.locator('.story-card').first()).toBeVisible();
  expect((await progress(page, 'story-g1-pip/quiz/q1')).independent).toBe(1);
  expect(await progress(page, 'lesson:story-g1-pip')).toBeUndefined();
});

test('ST-06 / 30 / 31: Bé đọc không mic → ✅ ghi practiced, ⏭ ghi skipped; chưa nghe hết → Olly đọc mẫu, đã nghe hết → không', async ({ page }) => {
  await open(page, { recognition: false });
  // Chưa nghe hết: vào ② từ trang 5 → Olly đọc mẫu câu trước khi mời bé đọc.
  await go(page, { storyId: 'story-g1-pip', mode: 'read', page: 4 });
  const ok = page.getByRole('button', { name: 'Con đọc xong' });
  await expect(ok).toBeVisible();
  const said = await spoken(page);
  expect(said.indexOf('Nan pats Pip.')).toBeLessThan(said.indexOf('Your turn! Read the sentence!'));
  await tapUntil(ok, () => progress(page, 'story-g1-pip/read/p5s1').then((p) => p?.practiced === 1));
  await tapUntil(page.getByRole('button', { name: 'Bỏ qua' }), () => progress(page, 'story-g1-pip/read/p5s2').then((p) => p?.skipped === 1));
  expect((await progress(page, 'story-g1-pip/read/p5s2')).practiced).toBe(0);
  await expect(page.getByRole('button', { name: 'Trả lời câu hỏi' })).toBeVisible();

  // Đã nghe hết (vào từ màn "The end!"): không đọc mẫu, mời bé đọc ngay.
  const n = (await spoken(page)).length;
  await go(page, { storyId: 'story-g1-pip', mode: 'read', page: 0, heard: true });
  await expect(ok).toBeVisible();
  const fresh = (await spoken(page)).slice(n);
  expect(fresh).toContain('Your turn! Read the sentence!');
  expect(fresh).not.toContain('Pip is an ant.');
});

test('ST-28 / 11: có ảnh 2 / 5 trang → trang thiếu hiện emoji; truyện không emoji trang, không ảnh → bỏ câu xếp thứ tự', async ({ page }) => {
  await open(page);
  await app(page, async () => {
    const { setWordImage } = await import('./js/db.js');
    const c = new OffscreenCanvas(40, 40);
    c.getContext('2d').fillRect(0, 0, 40, 40);
    const blob = await c.convertToBlob({ type: 'image/png' });
    for (const id of ['p1', 'p2']) await setWordImage(window.kidEnglish6.db, { lessonId: 'story-g2-pam-hen', wordId: id, blob, width: 40, height: 40 });
  });
  await app(page, () => window.kidEnglish6.setSetting('sceneAutoNext', false));
  await go(page, { storyId: 'story-g2-pam-hen', page: 0, continueDirectly: true });
  await expect(page.locator('.story-frame img')).toBeVisible();
  await go(page, { storyId: 'story-g2-pam-hen', page: 2, continueDirectly: true });
  await expect(page.locator('.story-frame .story-emoji')).toHaveText('🐔🛍️');
  // Câu xếp thứ tự trang 3 → 4 → 5: thẻ dùng emoji trang (khác nhau) → vẫn chơi đủ 3 câu.
  const types = await app(page, async () => {
    const { playableQuestions, STORY_BY_ID } = await import('./js/story/story.js');
    const s = structuredClone(STORY_BY_ID.get('story-g2-pam-hen'));
    const full = playableQuestions(s, (id) => ['p1', 'p2'].includes(id)).map((q) => q.type);
    s.pages.forEach((p) => delete p.emoji);
    return [full, playableQuestions(s, () => false).map((q) => q.type)];
  });
  expect(types).toEqual([['pick', 'word', 'order'], ['pick', 'word']]);
});

test('ST-14 / 21: iPhone dọc, trang 2 câu, bật VI → hình + chữ + nút vừa màn, không cuộn; bật / tắt VI không đổi chiều cao', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await open(page);
  await app(page, () => window.kidEnglish6.setSetting('showVi', true));
  await go(page, { storyId: 'story-g6-big-fish', page: 4, continueDirectly: true });
  await expect(counter(page)).toHaveText('5 / 5');
  const fits = await app(page, () => {
    const doc = document.scrollingElement;
    const bottom = Math.max(...[...document.querySelectorAll('.scene-controls, .story-dots, .scene-text')].map((e) => e.getBoundingClientRect().bottom));
    return { scroll: doc.scrollHeight - window.innerHeight, bottom, h: window.innerHeight };
  });
  expect(fits.scroll).toBeLessThanOrEqual(1);
  expect(fits.bottom).toBeLessThanOrEqual(fits.h);
  const before = await page.locator('.scene-text').boundingBox();
  await page.getByRole('button', { name: 'Tiếng Việt' }).click();
  await expect(page.locator('.scene-vi')).toHaveCSS('visibility', 'hidden');
  const after = await page.locator('.scene-text').boundingBox();
  expect(Math.abs(after.height - before.height)).toBeLessThan(1);
});

test('4.3: chạm GIỮ một từ đọc được → hiện ô âm, phát từng âm rời rồi đọc cả từ; tricky word / từ mới không ghép; chạm thường vẫn đọc cả từ', async ({ page }) => {
  await open(page);
  await go(page, { storyId: 'story-g1-pip', page: 1, continueDirectly: true }); // "Pip naps in a tin."
  await expect(page.locator('.story-screen')).toHaveAttribute('data-state', 'PAUSED');
  const tin = page.locator('.story-sent .sword', { hasText: 'tin' });
  await expect(tin).toHaveAttribute('data-graphemes', 't i n');
  await expect(page.locator('.story-sent .sword', { hasText: /^a$/ })).not.toHaveAttribute('data-graphemes', /./); // tricky
  const box = await tin.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
  await expect(page.locator('.story-blend .story-blend-tile')).toHaveText(['t', 'i', 'n']);
  await expect.poll(() => page.locator('.scene-text').getAttribute('data-sound-count')).toBe('3');
  await expect.poll(() => spoken(page).then((s) => s.at(-1))).toBe('tin');
  const n = (await spoken(page)).length;
  await page.waitForTimeout(300);
  expect((await spoken(page)).length).toBe(n); // không đọc thêm lần nữa khi nhả tay; đang dừng → không đọc tiếp
  await page.locator('.story-sent .sword', { hasText: 'naps' }).click();
  await expect.poll(() => spoken(page).then((s) => s.at(-1))).toBe('naps');
  await expect(page.locator('.scene-text')).toHaveAttribute('data-sound-count', '3'); // chạm thường không phát âm rời
});

test('SPEC 1.1: còn ≤ 2 phút → xong hoạt động về danh sách, Olly nhắc "One more and then rest!" + chữ tiếng Việt, một lần mỗi buổi', async ({ page }) => {
  await open(page);
  await app(page, async () => {
    const a = window.kidEnglish6;
    await a.setSetting('limitMinutes', 20);
    a.session = { ...a.session, usedMs: 19 * 60 * 1000, extraMs: 0, warned: false };
  });
  await go(page, { storyId: 'story-g1-pip', continueDirectly: true });
  await page.getByRole('button', { name: 'Về' }).click();
  await expect(page.locator('.story-card').first()).toBeVisible();
  await expect.poll(() => spoken(page)).toContain('One more and then rest!');
  await expect(page.locator('.toast').last()).toHaveText('Còn một chút nữa thôi');
  await go(page, { storyId: 'story-g1-pip', continueDirectly: true });
  await page.getByRole('button', { name: 'Về' }).click();
  await expect(page.locator('.story-card').first()).toBeVisible();
  await page.waitForTimeout(300);
  expect((await spoken(page)).filter((s) => s === 'One more and then rest!').length).toBe(1);
});

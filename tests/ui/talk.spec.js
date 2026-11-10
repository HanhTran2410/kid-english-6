// Khu 💬 Talk (SPEC 3.3): chọn mức → bạn hỏi (giọng thứ hai) → Olly làm mẫu → bé nói (nhận dạng + mic giả theo kịch bản).
// OL-16 (máy không nghe ra → mời nói lại, không chê), OL-17 (im lặng: hỏi lại → từ khóa → câu mẫu, đúng thứ tự), sao = mức,
// ghi âm → Góc bố mẹ → 🎙️ Ghi âm; không mic → nút ✅.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent, spoken } from './helpers.js';

const queue = (page, items) => page.evaluate((x) => window.__heardQueue.push(...x), items);
const openTalk = async (page, lessonId) => {
  await page.getByRole('button', { name: 'Nói chuyện' }).click();
  await expect(page.locator('.tab.active')).toHaveText('💬 Hằng ngày');
  await expect(page.locator('.lesson-card')).toHaveCount(6);
  await page.locator(`.lesson-card[data-lesson="${lessonId}"]`).click();
  await expect(page.locator('.level-btn')).toHaveCount(3);
};
/** Vị trí đầu tiên của từng câu trong log giọng đọc, tính từ `from`. */
const order = (log, lines, from = 0) => {
  let at = from;
  return lines.map((l) => {
    at = log.indexOf(l, at);
    return at;
  });
};

test('Mức 1 "Chào hỏi": bạn Mimi hỏi, Olly làm mẫu có tên bé, bé nói đúng → khen + Mimi đáp; 1 sao; lần sau gợi ý mức 2; ghi âm nghe lại được', async ({ page }) => {
  await fakeSpeech(page, { recognition: 'fake' });
  await startApp(page);
  await page.evaluate(() => window.kidEnglish6.setSetting('childName', 'Lan'));
  await openTalk(page, 'talk-hello');
  await expect(page.locator('.level-btn.suggested')).toHaveAttribute('data-level', '1');
  await queue(page, [{ turn: 'd1-t1', text: 'my name is Lan' }, { turn: 'd1-t2', text: "I'm fine thank you" }, { turn: 'd1-t3', text: "I'm six" }, { turn: 'd1-t4', text: 'goodbye Mimi' }]);
  await page.getByRole('button', { name: 'Mức 1: Nghe – nhắc lại' }).click();
  await expect(page.locator('.talk[data-turn="d1-t1"] .answer-line')).toHaveText(/My\s*name\s*is\s*Lan\./);
  await expect(page.locator('.done-stars')).toHaveText('⭐☆☆');
  const log = await spoken(page);
  const pos = order(log, ["Hi! I'm Mimi. What's your name?", 'My name is Lan.', 'Your turn!', 'Great talking!', 'Nice to meet you!', 'Goodbye, Mimi!']);
  expect(pos.every((p, i) => p >= 0 && (i === 0 || p > pos[i - 1])), JSON.stringify({ pos, log })).toBe(true);

  await page.getByRole('button', { name: 'Bài khác' }).click();
  await expect(page.locator('.lesson-card[data-lesson="talk-hello"] .lesson-stars')).toHaveText('⭐☆☆');
  await page.locator('.lesson-card[data-lesson="talk-hello"]').click();
  await expect(page.locator('.level-btn.suggested')).toHaveAttribute('data-level', '2');

  await page.getByRole('button', { name: 'Về' }).click();
  await page.getByRole('button', { name: 'Về màn hình chính' }).click();
  await openParent(page);
  await page.getByRole('button', { name: 'Ghi âm' }).click();
  await expect(page.locator('.rec-row')).toHaveCount(4);
  await expect(page.locator('.rec-row').filter({ hasText: 'My name is Lan.' })).toContainText('Hello!');
  await page.getByRole('button', { name: /Xóa toàn bộ ghi âm/ }).click();
  await page.locator('.dialog').getByRole('button', { name: 'Xóa hết' }).click();
  await expect(page.locator('.rec-row')).toHaveCount(0);
});

test('Mức 3 "Màu sắc": im lặng → hỏi lại → từ khóa → câu mẫu → đi tiếp (OL-17); máy không nghe ra → mời nói lại (OL-16); nói khác → làm mẫu, không chê; Bỏ qua; 3 sao', async ({ page }) => {
  await fakeSpeech(page, { recognition: 'fake' });
  await startApp(page);
  await openTalk(page, 'talk-colours');
  await page.getByRole('button', { name: 'Mức 3: Tự trả lời' }).click();

  // Lượt 1: im lặng suốt. Lượt 2: có tiếng 2 lần, máy không ra chữ. Lượt 3: nói khác. Lượt 4: bấm Bỏ qua.
  await queue(page, [{ turn: 'd1-t2', voice: true }, { turn: 'd1-t2', voice: true }, { turn: 'd1-t3', text: 'banana' }]);
  await expect(page.locator('.talk[data-turn="d1-t1"] .talk-key')).toHaveText(['red']);
  await expect(page.locator('.talk[data-turn="d1-t4"]')).toBeVisible();
  await page.getByRole('button', { name: 'Bỏ qua' }).click();
  await expect(page.locator('.done-stars')).toHaveText('⭐⭐⭐');

  const log = await spoken(page);
  const ask = 'What colour is the apple?';
  const first = log.indexOf(ask);
  const t1 = order(log, [ask, 'Your turn!', ask, 'Your turn!', 'red', 'Your turn!', 'Say it with me!', 'It is red.', 'Your turn!', "That's OK! Let's go on."], first);
  expect(t1.every((p, i) => p >= 0 && (i === 0 || p > t1[i - 1])), JSON.stringify({ t1, log })).toBe(true);
  const t2 = order(log, ['What colour is the banana?', "I didn't catch that. Say it again!", 'Good job!', 'Yummy!'], t1.at(-1));
  expect(t2.every((p, i) => p >= 0 && (i === 0 || p > t2[i - 1])), JSON.stringify({ t2, log })).toBe(true);
  const t3 = order(log, ['What colour is the frog?', 'Good try! Listen:', 'It is green.', 'Ribbit!'], t2.at(-1));
  expect(t3.every((p, i) => p >= 0 && (i === 0 || p > t3[i - 1])), JSON.stringify({ t3, log })).toBe(true);
  expect(log.some((l) => /wrong|try again/i.test(l))).toBe(false);

  const items = await page.evaluate(async () => (await window.kidEnglish6.db.getAllByIndex('progress', 'lessonId', 'talk-colours'))
    .filter((p) => p.activity === 'talk').map((p) => [p.itemId, p.helped, p.practiced]).sort());
  expect(items).toEqual([['d1-t1', 1, 0], ['d1-t2', 0, 1], ['d1-t3', 0, 1]]); // lượt 4 bỏ qua: không ghi
});

test('Không có mic, mức 2 "Đồ chơi": hiện phần đầu câu "It is a ___", bé bấm ✅ Con nói xong cho từng lượt → 2 sao', async ({ page }) => {
  await fakeSpeech(page, { mic: false });
  await startApp(page);
  await openTalk(page, 'talk-toys');
  await page.getByRole('button', { name: 'Mức 2: Nói tiếp' }).click();
  await expect(page.locator('.talk[data-turn="d1-t1"] .answer-line')).toHaveText(/It\s*is\s*a\s*___/);
  await expect(page.locator('.talk[data-turn="d1-t1"] .talk-pic')).toHaveText('🚗');
  for (const turn of ['t1', 't2', 't3', 't4']) {
    await expect(page.locator(`.talk[data-turn="d1-${turn}"]`)).toBeVisible();
    await page.getByRole('button', { name: 'Con nói xong' }).click({ timeout: 10_000 });
  }
  await expect(page.locator('.done-stars')).toHaveText('⭐⭐☆');
  expect(await spoken(page)).toContain('It is a…');
});
